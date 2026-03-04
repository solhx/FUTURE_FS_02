const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Lead = require("../models/Lead");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

// ─────────────────────────────────────────────
// @route   GET /api/leads
// @desc    Get all leads with filtering, search, pagination
// @access  Private
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const {
      status,
      source,
      priority,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      assignedTo,
      archived = "false",
    } = req.query;

    // Build filter object
    const filter = { isArchived: archived === "true" };

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate("assignedTo", "name email avatar")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      data: leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   GET /api/leads/analytics
// @desc    Get analytics data
// @access  Private
// ─────────────────────────────────────────────
router.get("/analytics", async (req, res) => {
  try {
    // Status distribution
    const statusCounts = await Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Source distribution
    const sourceCounts = await Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Leads per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const leadsOverTime = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isArchived: false } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Priority distribution
    const priorityCounts = await Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Summary stats
    const totalLeads = await Lead.countDocuments({ isArchived: false });
    const convertedLeads = await Lead.countDocuments({
      status: "converted",
      isArchived: false,
    });
    const newLeads = await Lead.countDocuments({
      status: "new",
      isArchived: false,
    });
    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    // Recent leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await Lead.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      isArchived: false,
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalLeads,
          convertedLeads,
          newLeads,
          recentLeads,
          conversionRate: parseFloat(conversionRate),
        },
        statusDistribution: statusCounts,
        sourceDistribution: sourceCounts,
        leadsOverTime,
        priorityDistribution: priorityCounts,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   GET /api/leads/:id
// @desc    Get single lead
// @access  Private
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      "assignedTo",
      "name email avatar"
    );

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   POST /api/leads
// @desc    Create new lead
// @access  Private
// ─────────────────────────────────────────────
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("phone").optional().trim(),
    body("company").optional().trim(),
    body("status")
      .optional()
      .isIn(["new", "contacted", "qualified", "converted", "lost"]),
    body("source")
      .optional()
      .isIn([
        "website",
        "referral",
        "social_media",
        "email_campaign",
        "cold_call",
        "other",
      ]),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("budget").optional().isNumeric().withMessage("Budget must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const lead = await Lead.create({
        ...req.body,
        assignedTo: req.body.assignedTo || req.user._id,
      });

      const populatedLead = await Lead.findById(lead._id).populate(
        "assignedTo",
        "name email avatar"
      );

      res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: populatedLead,
      });
    } catch (error) {
      console.error("Create lead error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ─────────────────────────────────────────────
// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
// ─────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    // Prevent direct notes modification via this route
    const { notes, ...updateData } = req.body;

    // Track when lead was contacted
    if (
      updateData.status === "contacted" ||
      updateData.status === "qualified"
    ) {
      updateData.lastContactedAt = new Date();
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("assignedTo", "name email avatar");

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   DELETE /api/leads/:id
// @desc    Delete lead (soft delete / archive)
// @access  Private (Admin/Manager only)
// ─────────────────────────────────────────────
router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead archived successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   POST /api/leads/:id/notes
// @desc    Add note to a lead
// @access  Private
// ─────────────────────────────────────────────
router.post(
  "/:id/notes",
  [body("content").trim().notEmpty().withMessage("Note content is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot be empty",
        errors: errors.array(),
      });
    }

    try {
      const note = {
        content: req.body.content,
        createdBy: req.user._id,
        createdByName: req.user.name,
      };

      const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { $push: { notes: { $each: [note], $position: 0 } } },
        { new: true }
      ).populate("assignedTo", "name email avatar");

      if (!lead) {
        return res
          .status(404)
          .json({ success: false, message: "Lead not found" });
      }

      res.status(201).json({
        success: true,
        message: "Note added successfully",
        data: lead,
      });
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ─────────────────────────────────────────────
// @route   DELETE /api/leads/:id/notes/:noteId
// @desc    Delete a note from a lead
// @access  Private
// ─────────────────────────────────────────────
router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $pull: { notes: { _id: req.params.noteId } } },
      { new: true }
    );

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// @route   PATCH /api/leads/:id/status
// @desc    Quick status update
// @access  Private
// ─────────────────────────────────────────────
router.patch(
  "/:id/status",
  [
    body("status")
      .isIn(["new", "contacted", "qualified", "converted", "lost"])
      .withMessage("Invalid status value"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    try {
      const updateData = { status: req.body.status };
      if (
        req.body.status === "contacted" ||
        req.body.status === "qualified"
      ) {
        updateData.lastContactedAt = new Date();
      }

      const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      ).populate("assignedTo", "name email avatar");

      if (!lead) {
        return res
          .status(404)
          .json({ success: false, message: "Lead not found" });
      }

      res.status(200).json({
        success: true,
        message: `Lead status updated to '${req.body.status}'`,
        data: lead,
      });
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;