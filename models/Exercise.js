// backend/models/Exercise.js
const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: Number, required: true }, // 1: Fácil, 2: Medio, 3: Difícil
  createdAt: { type: Date, default: Date.now },
  expected_output: { type: String, required: false },
});

module.exports = mongoose.model("Exercise", ExerciseSchema);
