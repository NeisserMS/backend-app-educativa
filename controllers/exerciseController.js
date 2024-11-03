// backend/controllers/exerciseController.js
const Exercise = require("../models/Exercise");
const Solution = require("../models/Solution");
const axios = require("axios");

exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ difficulty: 1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los ejercicios" });
  }
};

exports.generateExercise = async (req, res) => {
  const { difficulty } = req.body; // 1: Fácil, 2: Medio, 3: Difícil
  try {
    // Llamada a la API de OpenAI para generar un ejercicio
    const prompt = `Genera un ejercicio de Programación Orientada a Objetos en Java con dificultad nivel ${difficulty}. Incluye una descripción clara del problema y los requisitos.`;

    const response = await axios.post(
      "https://api.openai.com/v1/engines/davinci-codex/completions",
      {
        prompt,
        max_tokens: 300,
        temperature: 0.7,
        n: 1,
        stop: null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const exerciseDescription = response.data.choices[0].text.trim();

    // Crear y guardar el ejercicio en la base de datos
    const newExercise = new Exercise({
      title: `Ejercicio Nivel ${difficulty}`,
      description: exerciseDescription,
      difficulty,
    });

    await newExercise.save();

    res.status(201).json(newExercise);
  } catch (error) {
    console.error(error.response.data);
    res.status(500).json({ error: "Error al generar el ejercicio" });
  }
};

exports.submitSolution = async (req, res) => {
  const exerciseId = req.params.id;
  const { code } = req.body;
  const userId = req.user._id;

  try {
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise)
      return res.status(404).json({ error: "Ejercicio no encontrado" });

    // Enviar el código a Judge0 para su evaluación
    const submissionResponse = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions`,
      {
        source_code: code,
        language_id: 62, // Java (usualmente 62 para Java 11)
        stdin: "",
        expected_output: exercise.expected_output || "", // Opcional: puedes definir la salida esperada
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "x-rapidapi-key": process.env.JUDGE0_API_KEY,
        },
      }
    );

    const token = submissionResponse.data.token;

    // Esperar a que la evaluación se complete
    let evaluation;
    while (true) {
      const evaluationResponse = await axios.get(
        `${process.env.JUDGE0_API_URL}/submissions/${token}`,
        {
          headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": process.env.JUDGE0_API_KEY,
          },
        }
      );

      evaluation = evaluationResponse.data;
      if (evaluation.status.id >= 3) break; // 3: Completed
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo
    }

    // Crear y guardar la solución en la base de datos
    const newSolution = new Solution({
      user: userId,
      exercise: exerciseId,
      code,
      feedback: evaluation.status.description,
    });

    await newSolution.save();

    res.json({ message: evaluation.status.description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al evaluar la solución" });
  }
};
