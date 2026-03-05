const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const adminUser = {
  name: "Hossam",
  email: "hossam@gmail.com",
  password: "Hoss@811",
  role: "admin",
  isApproved: true,
  isActive: true,
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/crm");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    adminUser.password = hashedPassword;

    // Create admin user
    const user = await User.create(adminUser);
    console.log("Admin user created successfully!");
    console.log({
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();

