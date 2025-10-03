const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Replace with your MongoDB connection string in .env
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error(err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// Feedback Schema
const FeedbackSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mood: { type: String, enum: ["Fine", "Tired", "Stressed"], required: true },
    note: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedbackSchema);

// Routes
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();
        res.status(201).json({ message: "✅ User registered successfully" });
    } catch {
        res.status(400).json({ error: "⚠️ Email already exists or invalid data" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "⚠️ User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "⚠️ Invalid password" });

    res.json({ message: "✅ Login successful", user: { id: user._id, name: user.name, role: user.role } });
});

app.post("/feedback", async (req, res) => {
    const { studentId, mood, note } = req.body;
    const newFeedback = new Feedback({ studentId, mood, note });
    await newFeedback.save();
    res.status(201).json({ message: "✅ Feedback submitted" });
});

app.get("/feedback", async (req, res) => {
    const feedbacks = await Feedback.find().populate("studentId", "name email");
    res.json(feedbacks);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
