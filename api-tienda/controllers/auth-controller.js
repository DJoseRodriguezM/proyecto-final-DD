import connection from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import 'dotenv/config';
import { validateLog, validateReg } from "../schemas/auth-schema.js";
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
    static login(req, res) {
        const { email, password } = req.body;
        const { success, error } = validateLog(req.body);

        if (!success) {
            return res.status(400).json({
                error: true,
                message: JSON.parse(error.message)
            });
        }

        if (!email || !password) {
            return res.status(400).json({
                 message: "El correo y la contraseña son requeridos." 
            });
        }

        const consulta = "SELECT nombre, correo, contrasena, rol FROM usuarios WHERE correo = ?";

        try {
            connection.query(consulta, [email], (error, results) => {

                if (error) {
                    return res.status(400).json({
                        error: true,
                        message: "Ocurrió un error al obtener los datos: " + error
                    })
                }

                if (results && results.length === 0){
                    return res.status(404).json({
                        error: true,
                        message: "Usuario no encontrado"
                    })
                }

                const { nombre, correo, contrasena, rol } = results[0];

                bcrypt.compare(password, contrasena, function (err, result) {

                    if (!result) {
                        return res.status(401).json({
                            error: true,
                            message: "Usuario o contraseña incorrectos"
                        })
                    }

                    const data = { nombre, correo, rol }

                    const token = jwt.sign( { correo, rol }, process.env.SECRET_KEY, { expiresIn: "1h" });

                    return res.status(200).json({
                        error: false,
                        message: "Usuario logueado correctamente",
                        data: data,
                        token: token,
                        duration: 3600
                    })
                })
            });
        } catch (error) {
            return res.status(400).json({
                error: true,
                message: "Error al intentar loguear al usuario"
            })
        };
    }

    static async register(req, res) {
        const data = req.body;

        const { success, error } = validateReg(data);
        
        if (!success) {
            return res.status(400).json({
                error: true,
                message: JSON.parse(error.message)
            });
        }

        const { nombre, correo, contrasena, rol } = data;

        const checkEmailQuery = "SELECT correo FROM usuarios WHERE correo = ?";
        const consulta = "INSERT INTO usuarios (id, nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?)";

        try {
            const id = uuidv4();
            connection.query(checkEmailQuery, [correo], async (error, results) => {
                if (error) {
                    return res.status(400).json({
                        error: true,
                        message: "Error al verificar el correo " + error
                    });
                }

                if (results && results.length > 0) {
                    return res.status(400).json({
                        error: true,
                        message: "El correo ya está registrado"
                    });
                }

                const hashedPassword = await bcrypt.hash(contrasena, 10);

                const userRole = rol || 'cliente';
                connection.query(consulta, [id, nombre, correo, hashedPassword, userRole], (error, results) => {
                    if (error) {
                        return res.status(500).json({
                            error: true,
                            message: "Error en el servidor al intentar registrar el usuario " + error
                        });
                    }

                    return res.status(201).json({
                        error: false,
                        message: "Usuario registrado correctamente"
                    });
                });
            });
        } catch (error) {
            return res.status(400).json({
                error: true,
                message: "Error al registrar el usuario"
            });
        }
    }
}