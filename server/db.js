// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/resumeApp", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected via Mongoose");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

// Schema definition
const historySchema = new mongoose.Schema({
  text: { type: String, required: true },
  section: { type: String, required: true },
  rewritten: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Model creation
const History = mongoose.model("History", historySchema);

// Save a rewrite record
const saveHistory = async ({ text, section, rewritten }) => {
  await History.create({ text, section, rewritten });
};

// Get last 20 records
const getHistory = async () => {
  return await History.find().sort({ timestamp: -1 }).limit(20).lean();
};

module.exports = {
  connectDB,
  saveHistory,
  getHistory,
};
