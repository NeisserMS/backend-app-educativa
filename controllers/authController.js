// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.register = async (req, res) => {
  const { nombres, apellidos, email, password, repeatPassword } = req.body;

  if (password !== repeatPassword) {
    return res.status(400).json({ error: "Las contraseñas no coinciden" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado" });
    }

    const newUser = new User({ nombres, apellidos, email, password });
    await newUser.save();
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el usuario:", error); 
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Usuario no encontrado");
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Contraseña incorrecta");
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    console.log("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // URL del frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const msg = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      subject: "Restablecimiento de contraseña",
      text: `Recibiste este correo porque tú (o alguien más) solicitó restablecer la contraseña de tu cuenta.\n\n
      Por favor, haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso:\n\n
      ${resetLink}\n\n
      Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.\n`,
    };

    await sgMail.send(msg);

    res.status(200).json({ message: "Correo de restablecimiento de contraseña enviado" });
  } catch (error) {
    console.error("Error al solicitar el restablecimiento de contraseña:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.validateResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido o caducado" });
    }

    res.status(200).json({ message: "Token válido" });
  } catch (error) {
    console.error("Error al validar el token:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido o caducado" });
    }

    user.password = password; // Middleware `pre('save')` encripta la contraseña
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    res.status(200).json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
















