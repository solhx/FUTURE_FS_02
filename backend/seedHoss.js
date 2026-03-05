const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const adminUser = {
  name: "Hossam",
  email: "hoss@gmail.com",
  password: "Hoss@811",
  role: "admin",
  isApproved: true,
  isActive: true,
};

async function seedHoss() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/crm");
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminUser.email });
    if (existingUser) {
      console.log("User already exists! Updating to admin...");
      existingUser.role = "admin";
      existingUser.isApproved = true;
      existingUser.isActive = true;
      await existingUser.save();
      console.log("User updated to admin successfully!");
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
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seedHoss();

