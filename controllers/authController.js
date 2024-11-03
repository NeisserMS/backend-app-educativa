// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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
  console.log("Datos recibidos:", { email, password });
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
    console.log("Token generado:", token);
    res.json({
      token,
      user: {
        id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};