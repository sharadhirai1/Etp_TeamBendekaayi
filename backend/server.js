/ backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

// Import models from database folder
const { User, Feedback, Review, Message } = require("../database/database");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// BASIC HEALTH CHECK
// ------------------------
app.get("/", (req, res) => {
  res.send("✅ Backend server running successfully!");
});

// ------------------------
// SIGNUP ROUTE
// ------------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, school, isTeacher } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      school,
      isTeacher: !!isTeacher,
    });
    await user.save();

    res.json({ message: "Signup successful", userId: user._id });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ------------------------
// LOGIN ROUTE
// ------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, isTeacher: user.isTeacher },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ------------------------
// SUBMIT FEEDBACK
// ------------------------
app.post("/api/feedback", async (req, res) => {
  try {
    const { userId, mood, note } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const fb = new Feedback({
      user: user._id,
      role: user.isTeacher ? "teacher" : "student",
      mood,
      note,
    });
    await fb.save();

    res.json({ message: "Feedback saved successfully!" });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Feedback submission failed" });
  }
});

// ------------------------
// GET ALL FEEDBACK (for teachers)
// ------------------------
app.get("/api/feedback", async (req, res) => {
  try {
    const data = await Feedback.find()
      .populate("user", "name email school")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("Fetch feedback error:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ------------------------
// ADD REVIEW
// ------------------------
app.post("/api/review", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const review = new Review({ user: userId, rating, comment });
    await review.save();
    res.json({ message: "Review added successfully!" });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: "Review submission failed" });
  }
});

// ------------------------
// GET REVIEWS
// ------------------------
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ------------------------
// MESSAGES
// ------------------------
app.post("/api/message", async (req, res) => {
  try {
    const { fromId, toId, text } = req.body;
    const message = new Message({ from: fromId, to: toId, text });
    await message.save();
    res.json({ message: "Message sent!" });
  } catch (err) {
    console.error("Message error:", err);
    res.status(500).json({ error: "Message sending failed" });
  }
});

app.get("/api/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const msgs = await Message.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from to", "name email")
      .sort({ date: 1 });
    res.json(msgs);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ------------------------
// STATS
// ------------------------
app.get("/api/stats", async (req, res) => {
  try {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const agg = await Feedback.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);
    const stats = { Fine: 0, Tired: 0, Stressed: 0 };
    agg.forEach((a) => (stats[a._id] = a.count));
    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ------------------------
// START SERVER
// ------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
