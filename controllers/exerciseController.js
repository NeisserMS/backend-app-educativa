// backend/controllers/exerciseController.js
const Exercise = require("../models/Exercise");
const Solution = require("../models/Solution");
const config = require('../config');
const axios = require("axios");

exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ difficulty: 1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los ejercicios" });
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryRequest = async (fn, retries = 3, delayTime = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(delayTime);
    return retryRequest(fn, retries - 1, delayTime);
  }
};

exports.generateExercise = async (req, res) => {
  const { difficulty } = req.body; // 1: Fácil, 2: Medio, 3: Difícil
  let prompt;
  if (difficulty === 1) {
    prompt = `Genera un ejercicio de Programación Orientada a Objetos en Java con dificultad nivel 1 (Fácil). Incluye una descripción clara y breve del problema. El ejercicio debe ser muy básico, por ejemplo, crear una clase simple con algunas propiedades y métodos, y no incluyas la solución.`;
  } else if (difficulty === 2) {
    prompt = `Genera un ejercicio de Programación Orientada a Objetos en Java con dificultad nivel 2 (Medio). Incluye una descripción clara del problema y los requisitos. El ejercicio debe tener una dificultad moderada, por ejemplo, crear una clase con herencia y algunos métodos adicionales, y no incluyas la solución`;
  } else if (difficulty === 3) {
    prompt = `Genera un ejercicio de Programación Orientada a Objetos en Java con dificultad nivel 3 (Difícil). Incluye una descripción clara del problema y los requisitos. El ejercicio debe ser avanzado, por ejemplo, crear una clase con herencia, interfaces y métodos complejos, y no incluyas la solución.`;
  } else {
    return res.status(400).json({ error: "La dificultad debe ser 1, 2 o 3" });
  }
  
  try {
    
    const response = await retryRequest(() =>
      axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.5
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Organization": process.env.OPENAI_ORG_ID,
            "OpenAI-Project": process.env.OPENAI_PROJECT_ID,
          },
        }
      )
    );

    const exerciseDescription = response.data.choices[0].message.content.trim();

    const newExercise = new Exercise({
      title: `Ejercicio Nivel ${difficulty}`,
      description: exerciseDescription,
      difficulty,
    });

    await newExercise.save();

    res.status(201).json(newExercise);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
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

    const base64Code = Buffer.from(code).toString('base64');

    const expectedOutput = exercise.expected_output
      ? Buffer.from(exercise.expected_output).toString('base64')
      : "";

    const submissionResponse = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=true`,
      {
        source_code: base64Code,
        language_id: 62, // ID de Java en Judge0
        stdin: "",
        expected_output: expectedOutput,
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

    let evaluation;
    while (true) {
      const evaluationResponse = await axios.get(
        `${process.env.JUDGE0_API_URL}/submissions/${token}?base64_encoded=true`,
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

    // Decodificar los resultados de base64 a UTF-8
    const decodeBase64 = (data) => (data ? Buffer.from(data, 'base64').toString('utf-8') : null);
    const stdout = decodeBase64(evaluation.stdout);
    const stderr = decodeBase64(evaluation.stderr);
    const compileOutput = decodeBase64(evaluation.compile_output);

    // Generar un prompt para OpenAI para interpretar la salida y dar feedback detallado
    const openaiPrompt = `
      Aquí tienes la descripción del problema:
      ${exercise.description}

      Salida generada por el código:
      - stdout: ${stdout}
      - stderr: ${stderr}
      - compile_output: ${compileOutput}

      Si el resultado es correcto, proporciona una respuesta de éxito con un breve feedback positivo.
      Si el resultado es incorrecto, explica en lenguaje sencillo el problema en el código, 
      proporciona posibles sugerencias para mejorarlo y comenta si hay errores de sintaxis o lógica.`;

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: openaiPrompt }],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const feedback = openaiResponse.data.choices[0].message.content.trim();

    // Crear y guardar la solución en la base de datos
    const newSolution = new Solution({
      user: userId,
      exercise: exerciseId,
      code,
      feedback,
      stdout,
      stderr,
      compile_output: compileOutput,
    });

    await newSolution.save();

    // Enviar el feedback y resultados al usuario
    res.json({
      message: evaluation.status.description,
      feedback,
      stdout,
      stderr,
      compile_output: compileOutput,
    });
  } catch (error) {
    console.error("Error al evaluar la solución:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al evaluar la solución" });
  }
};