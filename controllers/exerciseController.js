// backend/controllers/exerciseController.js
const Exercise = require("../models/Exercise");
const Solution = require("../models/Solution");
const config = require('../config');
const axios = require("axios");

const predefinedExercises = {
  1: [
    { title: "Ejercicio 1: Crear una Clase", description: "Crea una clase llamada Persona con los atributos nombre y edad." },
    { title: "Ejercicio 2: Métodos Getters y Setters", description: "Añade métodos getters y setters para los atributos nombre y edad en la clase Persona." },
    { title: "Ejercicio 3: Constructor", description: "Añade un constructor a la clase Persona que inicialice los atributos nombre y edad." },
    { title: "Ejercicio 4: Método toString", description: "Añade un método toString a la clase Persona que devuelva una cadena con el nombre y la edad de la persona." },
    { title: "Ejercicio 5: Herencia", description: "Crea una clase Estudiante que herede de Persona y añada el atributo matricula." },
    { title: "Ejercicio 6: Sobrescribir Métodos", description: "Sobrescribe el método toString en la clase Estudiante para incluir la matrícula." },
    { title: "Ejercicio 7: Polimorfismo", description: "Crea una clase Profesor que herede de Persona y añada el atributo departamento. Crea un método impartirClase en Profesor." },
    { title: "Ejercicio 8: Interfaces", description: "Crea una interfaz Trabajador con el método trabajar. Implementa la interfaz en las clases Estudiante y Profesor." },
    { title: "Ejercicio 9: Clases Abstractas", description: "Crea una clase abstracta Animal con el método abstracto hacerSonido. Crea clases Perro y Gato que hereden de Animal e implementen el método hacerSonido." },
    { title: "Ejercicio 10: Manejo de Excepciones", description: "Añade manejo de excepciones a la clase Persona para validar que la edad sea un número positivo." },
  ],
  2: [
    { title: "Ejercicio 1: Encapsulación y Visibilidad", description: "Aplica modificadores de acceso en los atributos de la clase Persona (private para nombre y edad). Crea métodos getNombre y getEdad." },
    { title: "Ejercicio 2: Métodos Estáticos", description: "Añade un método estático en Persona, totalPersonas(), que devuelva el número total de instancias creadas." },
    { title: "Ejercicio 3: Sobrecarga de Constructores", description: "Crea dos constructores en Persona, uno que reciba solo nombre y otro que reciba nombre y edad." },
    { title: "Ejercicio 4: Sobrecarga de Métodos", description: "Implementa un método mostrarInfo en Persona que devuelva la información de nombre o nombre y edad según los parámetros pasados." },
    { title: "Ejercicio 5: Clases Internas", description: "Crea una clase interna Direccion en Persona, con atributos calle y ciudad. Método getDireccion() debe devolver la dirección completa." },
    { title: "Ejercicio 6: Excepciones Personalizadas", description: "Crea una excepción personalizada EdadNegativaException. Lanza esta excepción si la edad en Persona es negativa." },
    { title: "Ejercicio 7: Colecciones y Generics", description: "Crea una lista de objetos Persona y ordena por edad usando una función de comparación." },
    { title: "Ejercicio 8: Manejo de Archivos", description: "Implementa un método para guardar y leer la información de Persona en un archivo." },
    { title: "Ejercicio 9: Serialización JSON", description: "Serializa Persona a JSON y deserializa." },
    { title: "Ejercicio 10: Programación Funcional", description: "Usa lambdas para filtrar personas mayores de cierta edad en una lista." },
  ],
  3: [
    { title: "Ejercicio 1: Singleton", description: "Implementa Singleton en PersonaManager y prueba que solo se crea una instancia." },
    { title: "Ejercicio 2: Factory", description: "Crea una fábrica para instanciar Persona o sus subclases." },
    { title: "Ejercicio 3: Observer", description: "Usa Observer para notificar cambios de nombre en Persona a un registro de cambios." },
    { title: "Ejercicio 4: Multihilo", description: "Calcula promedio de edades en paralelo en una lista grande de Persona." },
    { title: "Ejercicio 5: Comunicación entre Procesos", description: "Implementa una API REST sencilla para consultar y crear objetos Persona." },
    { title: "Ejercicio 6: Refactoring", description: "Mejora el código de Persona para cumplir con principios de diseño limpio." },
    { title: "Ejercicio 7: Pruebas Unitarias", description: "Crea pruebas unitarias para Persona." },
    { title: "Ejercicio 8: Inversión de Dependencias", description: "Usa interfaces para que Persona dependa de abstracciones." },
    { title: "Ejercicio 9: Principios SOLID", description: "Refactoriza según SOLID y justifica los cambios en comentarios." },
    { title: "Ejercicio 10: API RESTful", description: "Crea una API REST para CRUD de Persona con endpoints definidos." },
  ]
};


exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ difficulty: 1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los ejercicios" });
  }
};

exports.getExercisesByUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const exercises = await Exercise.find({ user: userId }).sort({ createdAt: -1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los ejercicios del usuario" });
  }
};

exports.getExerciseById = async (req, res) => {
  const exerciseId = req.params.id;

  try {
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el ejercicio" });
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
  const { difficulty, userId } = req.body; // 1: Fácil, 2: Medio, 3: Difícil

  // Verificar si hay ejercicios predefinidos para el nivel especificado
  if (!predefinedExercises[difficulty]) {
    return res.status(400).json({ error: "Nivel de dificultad no válido" });
  }

  try {
    const existingExercisesCount = await Exercise.countDocuments({ difficulty });

    if (existingExercisesCount >= 10) {
      return res.status(400).json({ error: "Se ha alcanzado el límite de 10 ejercicios para este nivel" });
    }

    const nextExercise = predefinedExercises[difficulty][existingExercisesCount];

    const prompt = `Genera un ejercicio de Programación Orientada a Objetos en Java con el siguiente título y descripción:\n\nTítulo: ${nextExercise.title}\nDescripción: ${nextExercise.description}\n\nAsegúrate de incluir todas las importaciones necesarias para que el código pueda compilarse correctamente, y no incluyas la solución (código fuente), solo plantea el ejercicio.`;

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

    const exerciseContent = response.data.choices[0].message.content.trim();
    const [subtitle, ...descriptionParts] = exerciseContent.split('\n');
    const exerciseDescription = descriptionParts.join('\n').trim();

    const newExercise = new Exercise({
      title: nextExercise.title,
      subtitle: subtitle.trim(), 
      description: exerciseDescription,
      difficulty,
      user: userId,
      status: "En proceso", 
    });

    await newExercise.save();

    res.status(201).json(newExercise);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al generar el ejercicio" });
  }
};

exports.getHelp = async (req, res) => {
  const exerciseId = req.params.id;

  try {
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }

    const prompt = `Proporciona una pequeña parte de la solución para el siguiente ejercicio de Programación Orientada a Objetos en Java:\n\nTítulo: ${exercise.title}\nDescripción: ${exercise.description}\n\nAsegúrate de no proporcionar la solución completa, solo una pequeña parte que sirva como ayuda u orientación.`;

    const response = await retryRequest(() =>
      axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
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

    const helpContent = response.data.choices[0].message.content.trim();

    res.status(200).json({ help: helpContent });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al obtener la ayuda" });
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

    // Asegúrate de que el código no tenga clases públicas y que incluya todas las importaciones necesarias
    const adjustedCode = code.replace(/public\s+class/g, 'class');

    const base64Code = Buffer.from(adjustedCode).toString('base64');

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

        // Determinar el nuevo estado del ejercicio
        let newStatus = "En proceso";
        if (evaluation.status.description === "Accepted") {
          newStatus = "Completado";
        } else {
          newStatus = "Requiere revisión";
        }
    
        // Actualizar el estado del ejercicio
        exercise.status = newStatus;
        await exercise.save();
    

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
      proporciona posibles sugerencias para mejorarlo y comenta si hay errores de sintaxis o lógica.
      No proporciones la solución completa, solo orientación y consejos para mejorar el código.
    `;

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

        // // Guardar la conversación en la base de datos
        // const conversation = await Conversation.findOne({ exercise: exerciseId, user: userId });
        // if (conversation) {
        //   conversation.messages.push({ sender: "user", content: code });
        //   conversation.messages.push({ sender: "ai", content: feedback });
        //   await conversation.save();
        // } else {
        //   const newConversation = new Conversation({
        //     exercise: exerciseId,
        //     user: userId,
        //     messages: [
        //       { sender: "user", content: code },
        //       { sender: "ai", content: feedback },
        //     ],
        //   });
        //   await newConversation.save();
        // }
    // Enviar el feedback y resultados al usuario
    res.json({
      message: evaluation.status.description,
      feedback,
      stdout,
      stderr,
      compile_output: compileOutput,
      status: newStatus, 
    });
  } catch (error) {
    console.error("Error al evaluar la solución:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al evaluar la solución" });
  }
};

// exports.getConversation = async (req, res) => {
//   const { exerciseId, userId } = req.params;

//   try {
//     const conversation = await Conversation.findOne({ exercise: exerciseId, user: userId });
//     if (!conversation) {
//       return res.status(404).json({ error: "Conversación no encontrada" });
//     }
//     res.json(conversation);
//   } catch (error) {
//     res.status(500).json({ error: "Error al obtener la conversación" });
//   }
// };