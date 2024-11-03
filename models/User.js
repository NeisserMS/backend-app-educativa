// backend/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del usuario
 *           example: 60d0fe4f5311236168a109ca
 *         username:
 *           type: string
 *           description: Nombre de usuario único
 *           example: juanperez
 *         email:
 *           type: string
 *           description: Correo electrónico único
 *           example: juanperez@example.com
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *           example: ContraseñaSegura123
 *         role:
 *           type: string
 *           enum: [student, instructor]
 *           description: Rol del usuario
 *           example: student
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *           example: 2023-09-23T06:57:20.975Z
 */

const UserSchema = new mongoose.Schema({
  nombres: { type: String, required: true, trim: true },
  apellidos: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor"], default: "student" },
  createdAt: { type: Date, default: Date.now },
});

// Middleware para encriptar la contraseña antes de guardar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas durante el login
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
