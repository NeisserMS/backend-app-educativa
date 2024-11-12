const express = require("express");
const router = express.Router();
const exerciseController = require("../controllers/exerciseController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Ejercicios
 *   description: Endpoints para gestionar ejercicios de POO en Java
 */

/**
 * @swagger
 * /exercises:
 *   get:
 *     summary: Obtener todos los ejercicios disponibles
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ejercicios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       401:
 *         description: No autorizado, token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autorizado, token no proporcionado
 *       500:
 *         description: Error en el servidor
 */

// Obtener todos los ejercicios
router.get("/", protect, exerciseController.getAllExercises);

/**
 * @swagger
 * /exercises/generate:
 *   post:
 *     summary: Generar un nuevo ejercicio con IA
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - difficulty
 *               - userId
 *             properties:
 *               difficulty:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 example: 2
 *                 description: "Nivel de dificultad (1: Fácil, 2: Medio, 3: Difícil)"
 *               userId:
 *                 type: string
 *                 example: "67255e4b740f1857e288199f"
 *                 description: "ID del usuario que genera el ejercicio"
 *     responses:
 *       201:
 *         description: Ejercicio generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         description: Error de validación o fallo en la generación del ejercicio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al generar el ejercicio
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autorizado, token inválido
 *       500:
 *         description: Error en el servidor
 */

// Generar un nuevo ejercicio con IA
router.post("/generate", protect, exerciseController.generateExercise);

/**
 * @swagger
 * /exercises/user/{userId}:
 *   get:
 *     summary: Obtener todos los ejercicios generados por un usuario específico
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de ejercicios del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       401:
 *         description: No autorizado, token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autorizado, token no proporcionado
 *       500:
 *         description: Error en el servidor
 */

// Obtener ejercicios por usuario
router.get("/user/:userId", protect, exerciseController.getExercisesByUser);

/**
 * @swagger
 * /exercises/{id}:
 *   get:
 *     summary: Obtener los detalles de un ejercicio específico
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ejercicio
 *     responses:
 *       200:
 *         description: Detalles del ejercicio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       401:
 *         description: No autorizado, token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autorizado, token no proporcionado
 *       404:
 *         description: Ejercicio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ejercicio no encontrado
 *       500:
 *         description: Error en el servidor
 */

// Obtener los detalles de un ejercicio específico
router.get("/:id", protect, exerciseController.getExerciseById);

/**
 * @swagger
 * /exercises/{id}/submit:
 *   post:
 *     summary: Enviar una solución para evaluar
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ejercicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: |
 *                   public class Main {
 *                       public static void main(String[] args) {
 *                           // Escribe tu código aquí
 *                       }
 *                   }
 *                 description: "Código Java escrito por el estudiante"
 *     responses:
 *       200:
 *         description: Solución evaluada con feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solución correcta
 *       400:
 *         description: Error de validación o problema al evaluar la solución
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al evaluar la solución
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autorizado, token inválido
 *       500:
 *         description: Error en el servidor
 */

// Enviar solución para evaluación
router.post("/:id/submit", protect, exerciseController.submitSolution);

/**
 * @swagger
 * /conversations/{exerciseId}/{userId}:
 *   get:
 *     summary: Obtener la conversación relacionada con un ejercicio y un usuario específico
 *     tags: [Conversaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ejercicio
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Conversación obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exercise:
 *                   type: string
 *                   example: "672ebfe2240e8bfd69a916ed"
 *                 user:
 *                   type: string
 *                   example: "67255e4b740f1857e288199f"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sender:
 *                         type: string
 *                         example: "user"
 *                       content:
 *                         type: string
 *                         example: "Este es un mensaje de ejemplo"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-11-09T01:50:26.960Z"
 *       404:
 *         description: Conversación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Conversación no encontrada
 *       500:
 *         description: Error en el servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al obtener la conversación
 */

// Obtener la conversación relacionada con un ejercicio y un usuario específico
// router.get("/conversations/:exerciseId/:userId", protect, exerciseController.getConversation);

/**
 * @swagger
 * /exercises/{id}/help:
 *   get:
 *     summary: Obtener una pequeña parte de la solución como ayuda
 *     tags: [Ejercicios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ejercicio
 *     responses:
 *       200:
 *         description: Ayuda obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 help:
 *                   type: string
 *                   example: "Aquí tienes una pequeña parte de la solución..."
 *       404:
 *         description: Ejercicio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ejercicio no encontrado
 *       500:
 *         description: Error en el servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al obtener la ayuda
 */

// Obtener una pequeña parte de la solución como ayuda
router.get("/:id/help", protect, exerciseController.getHelp);

module.exports = router;