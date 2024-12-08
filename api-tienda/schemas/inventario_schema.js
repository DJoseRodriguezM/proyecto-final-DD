import {z} from 'zod'

const ProductSchema = z.object(
    {
        "product_id": z.number({
            required_error: "El producto es requerido"
        }).int({
            message: "Debe ser un entero"
        }),
        "cantidad": z.number({
            required_error: "La cantidad es requerida"
        }).int({
            message: "Debe ser un entero"
        }),

        "fecha": z.string().datetime().refine((date) => !isNaN(Date.parse(date)), {
            message: "Debe ser una fecha válida en formato ISO 8601 ejemplo:2024-11-09T17:27:27.000Z",
          }).optional()
    }
).strict()

export const validateProductSchema = (product) => ProductSchema.safeParse(product)

export const validatePartialSchema = (product) => ProductSchema.partial().safeParse(product)