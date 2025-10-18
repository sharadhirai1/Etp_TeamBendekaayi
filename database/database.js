// backend/database.js
const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/studentFeedback";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("✅ MongoDB Connected"))
  .catch(err=>console.error("❌ MongoDB error:", err));

// User model
const UserSchema = new mongoose.Schema({
  name: {type:String, required:true},
  email: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  school: {type:String},
  isTeacher: {type:Boolean, default:false}
}, { timestamps:true });
const User = mongoose.model("User", UserSchema);

// Feedback model
const FeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["student","teacher"], default: "student" },
  mood: { type: String, enum: ["Fine","Tired","Stressed"], required: true },
  note: String,
  date: { type: Date, default: Date.now }
}, { timestamps:true });
const Feedback = mongoose.model("Feedback", FeedbackSchema);

// Review model
const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min:1, max:5, required:true },
  comment: String,
  date: { type: Date, default: Date.now }
});
const Review = mongoose.model("Review", ReviewSchema);

// Message model
const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const Message = mongoose.model("Message", MessageSchema);

module.exports = { User, Feedback, Review, Message };
