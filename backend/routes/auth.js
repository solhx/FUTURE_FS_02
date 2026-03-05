const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (public - self registration)
// @access  Public
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 50 })
      .withMessage("Name cannot exceed 50 characters"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create user with agent role (default)
      // All self-registrations require admin approval
      const user = await User.create({ 
        name, 
        email, 
        password, 
        role: "agent",
        isApproved: false // Requires admin approval
      });

      // Return success but no token - user needs approval
      return res.status(201).json({
        success: true,
        message: "Registration successful! Your account is pending approval by an administrator. You will be able to login once approved.",
        requiresApproval: true,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  }
);

// @route   POST /api/auth/admin/register
// @desc    Register a new admin/user (admin only - for creating users from admin panel)
// @access  Private (Admin only)
router.post(
  "/admin/register",
  protect,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 50 })
      .withMessage("Name cannot exceed 50 characters"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["admin", "manager", "agent"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { name, email, password, role } = req.body;

      // Only admins can create users via admin panel
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can register new users",
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Assign role
      const assignedRole = role || "agent";

      // Admin-created users are auto-approved
      const user = await User.create({ 
        name, 
        email, 
        password, 
        role: assignedRole,
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      });

      sendTokenResponse(user, 201, res, "User created successfully");
    } catch (error) {
      console.error("Admin register error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { email, password } = req.body;

      // Find user with password included
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Your account has been deactivated",
        });
      }

      if (!user.isApproved) {
        return res.status(401).json({
          success: false,
          message: "Your account is pending approval by an administrator",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      sendTokenResponse(user, 200, res, "Login successful");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    },
  });
});

// @route   PUT /api/auth/updatepassword
// @desc    Update password
// @access  Private
router.put(
  "/updatepassword",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
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
      const user = await User.findById(req.user._id).select("+password");
      const isMatch = await user.comparePassword(req.body.currentPassword);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = req.body.newPassword;
      await user.save();

      sendTokenResponse(user, 200, res, "Password updated successfully");
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/auth/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put(
  "/users/:id/role",
  protect,
  authorize("admin"),
  [
    body("role")
      .isIn(["admin", "manager", "agent"])
      .withMessage("Invalid role"),
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
      const { role } = req.body;
      const { id } = req.params;

      // Prevent changing own role
      if (id === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role",
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   PUT /api/auth/users/:id/approve
// @desc    Approve a user (admin only)
// @access  Private/Admin
router.put("/users/:id/approve", protect, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent approving yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot approve your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: "User is already approved",
      });
    }

    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User has been approved successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        approvedAt: user.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/auth/users/:id/reject
// @desc    Reject/delete a pending user (admin only)
// @access  Private/Admin
router.delete("/users/:id/reject", protect, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent rejecting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot reject your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User registration has been rejected and removed",
    });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/auth/users/:id/activate
// @desc    Activate/deactivate a user (admin only)
// @access  Private/Admin
router.put("/users/:id/activate", protect, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent deactivating yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: isActive ? "User has been activated" : "User has been deactivated",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
