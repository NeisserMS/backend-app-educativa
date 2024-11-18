// backend/controllers/exerciseController.js
const Exercise = require("../models/Exercise");
const Solution = require("../models/Solution");
const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");

const predefinedExercises = {
  1: [
    { title: "Ejercicio 1: Crear una Clase", description: "Crea una clase llamada Persona con los atributos nombre y edad, y además incluye el método main para ejecutar el ejercicio,y por ultimo que no considere los métodos get y set." },
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
    // Validar si hay ejercicios pendientes
    const unfinishedExercise = await Exercise.findOne({
      user: userId,
      status: { $in: ["En proceso", "En verificación"] }, // Puedes ajustar los estados relevantes
    });

    if (unfinishedExercise) {
      return res.status(400).json({
        error: `Debes de terminar el ejercicio actual.`,
      });
    }

    // Verificar si el usuario tiene al menos 10 ejercicios completados de dificultad 1 para generar un ejercicio de dificultad 2
    if (difficulty === 2) {
      const completedLevel1Count = await Exercise.countDocuments({
        difficulty: 1,
        user: userId,
        status: "Completado",
      });
      if (completedLevel1Count < 10) {
        return res.status(400).json({ error: "Debes completar el nivel Básico" });
      }
    }

    // Verificar si el usuario tiene al menos 10 ejercicios completados de dificultad 1 y 10 ejercicios completados de dificultad 2 para generar un ejercicio de dificultad 3
    if (difficulty === 3) {
      const completedLevel1Count = await Exercise.countDocuments({
        difficulty: 1,
        user: userId,
        status: "Completado",
      });
      const completedLevel2Count = await Exercise.countDocuments({
        difficulty: 2,
        user: userId,
        status: "Completado",
      });
      if (completedLevel1Count < 10 || completedLevel2Count < 10) {
        return res.status(400).json({ error: "Debes completar el nivel Intermedio" });
      }
    }

    const existingExercisesCount = await Exercise.countDocuments({
      difficulty,
      user: userId,
    });

    if (existingExercisesCount >= 10) {
      return res.status(400).json({
        error: "Se ha alcanzado el límite de 10 ejercicios para este nivel",
      });
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
      subtitle: subtitle.trim(), // Guardar el subtítulo
      description: exerciseDescription,
      difficulty,
      user: userId,
      status: "En proceso", // Establecer el estado inicial
    });

    await newExercise.save();

    res.status(201).json({
      exercise: {
        title: newExercise.title,
        subtitle: newExercise.subtitle,
        description: newExercise.description,
        difficulty: newExercise.difficulty,
        status: newExercise.status,
        id: newExercise._id,
      }
    });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al generar el ejercicio" });
  }
};

exports.getHelp = async (req, res) => {
  const exerciseId = req.params.id;
  const userId = req.params.userId;

  try {
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }

    if (exercise.numberHelp >= 2) {
      return res.status(400).json({ error: "Ya superaste la ayuda para este ejercicio" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Reducir puntos del usuario
    user.points -= 10;
    await user.save();

    let prompt;
    if (exercise.numberHelp === 0) {
      prompt = `
        Proporciona solo la estructura inicial de la clase para este ejercicio de Programación Orientada a Objetos en Java (Código fuente, si el ejercicio es pequeño aun asi solo considera la parte inicial, no resuelvas todo), sin resolver completamente el ejercicio.
        
        Título: ${exercise.title}
        Descripción: ${exercise.description}
        
        Ejemplo:
        public class Persona {
            // Atributos
            String nombre;
            int edad;

            public static void main(String[] args) {
                // Método main vacío para que el usuario lo complete.
            }
        }
      `;
    } else if (exercise.numberHelp === 1) {
      prompt = `
        Proporciona una solución más completa para que se diferencie de la primera ayuda, centraté mas en proporcionar el codgio fuente y no tanto en explicar la solución. El codigo
        debe ser funcional por lo que debes de considerar el método Main, puedes dar la solución casi al 90%.
        
        Título: ${exercise.title}
        Descripción: ${exercise.description}
        
        Ejemplo:
        public class Persona {
            String nombre;
            int edad;

            public static void main(String[] args) {
                Persona persona1 = new Persona();
                persona1.nombre = "Juan"; // Asignar nombre
                persona1.edad = 25;       // Asignar edad

                System.out.println("Nombre: " + persona1.nombre);
                System.out.println("Edad: " + persona1.edad);
            }
        }
      `;
    } else {
      prompt = `
        Proporciona un ejemplo más detallado que incluya buenas prácticas o expansiones opcionales del código, sin resolver completamente el ejercicio.
        
        Título: ${exercise.title}
        Descripción: ${exercise.description}
        
        Ejemplo:
        public class Persona {
            String nombre;
            int edad;

            public Persona(String nombre, int edad) {
                this.nombre = nombre;
                this.edad = edad;
            }

            public static void main(String[] args) {
                Persona persona1 = new Persona("Juan", 25);
                Persona persona2 = new Persona("María", 30);

                System.out.println("Nombre: " + persona1.nombre + ", Edad: " + persona1.edad);
                System.out.println("Nombre: " + persona2.nombre + ", Edad: " + persona2.edad);
            }
        }
      `;
    }

    // Solicitar a OpenAI el contenido de la ayuda
    const response = await retryRequest(() =>
      axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.5,
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

    exercise.numberHelp += 1;
    await exercise.save();

    res.status(200).json({ help: helpContent, points: user.points });
  } catch (error) {
    console.error("Error al obtener la ayuda:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al obtener la ayuda", details: error.message });
  }
};

exports.getSolutionByExerciseAndUser = async (req, res) => {
  const { exerciseId, userId } = req.params;

  try {
    // Buscar todas las soluciones del usuario para un ejercicio específico
    const solutions = await Solution.find({
      exercise: new mongoose.Types.ObjectId(exerciseId),
      user: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: 1 }) // Ordenar cronológicamente
      .select("code feedback createdAt"); // Seleccionar solo los campos relevantes

    if (!solutions || solutions.length === 0) {
      const exercise = await Exercise.findById(exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: "Ejercicio no encontrado" });
      }

      return res.json({
        exercise: {
          id: exercise._id,
          title: exercise.title,
          description: exercise.description,
          subtitle: exercise.subtitle,
          difficulty: exercise.difficulty,
        },
        solutions: [], // Retornar un array vacío si no hay soluciones
      });
    }

    // Obtener los detalles del ejercicio asociado
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }

    // Combinar la información del ejercicio y las soluciones
    const combinedResult = {
      exercise: {
        id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        subtitle: exercise.subtitle,
        difficulty: exercise.difficulty,
      },
      solutions, // Devolver todas las soluciones como un array
    };

    return res.json(combinedResult);
  } catch (error) {
    console.error("Error al obtener las soluciones:", error);
    res.status(500).json({ error: "Error al obtener las soluciones o el ejercicio" });
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

    console.log("Ejercicio encontrado:", exercise);

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

      if (evaluation.status.id >= 3) break; 
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
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

      Si el resultado es correcto, proporciona una respuesta de éxito con un breve (muy corto) feedback positivo.
      Si el resultado es incorrecto, explica en lenguaje sencillo el problema en el código, 
      proporciona posibles sugerencias para mejorarlo y comenta si hay errores de sintaxis o lógica (que la respuesta sea corta).
      No proporciones la solución completa, solo orientación y consejos para mejorar el código.
    `;

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: openaiPrompt }],
        max_tokens: 800,
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

    let newStatus = "En proceso";

    if (!stderr && !compileOutput) {
      newStatus = "Completado";
    } else {
      newStatus = "Requiere revisión";
    }
    
    // Actualizar el estado del ejercicio
    exercise.status = newStatus;
    await exercise.save();

    // Guardar la solución con el feedback
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

    // Responder al cliente
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