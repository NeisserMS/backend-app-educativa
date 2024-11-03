// backend/routes/exerciseRoutes.js

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
 *             properties:
 *               difficulty:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 example: 2
 *                 description: "Nivel de dificultad (1: Fácil, 2: Medio, 3: Difícil)"
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

module.exports = router;
