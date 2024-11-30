import { z } from 'zod';

export const LogSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export const RegSchema = z.object({
    "nombre": z.string({
        invalid_type_error: "El nombre debe ser un string",
    }).trim().min(3, {
        message: "El nombre debe tener al menos 3 caracteres",
    }).optional(),
    "correo": z.string().email({
        message: "El correo debe ser un correo válido",
    }),
    "contrasena": z.string().trim().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres",
    }),
    "rol": z.enum(["admin", "cliente"]).default("cliente"),
})

export const validateLog = (data) => {
    try {
        LogSchema.safeParse(data);
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};

export const validateReg = (data) => {
    try {
        RegSchema.parse(data);
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};