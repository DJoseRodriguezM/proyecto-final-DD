import {z} from "zod"

const reportSaleSchema = z.object(
    {
        "start_date": z.string({
            invalid_type_error:"Tipo incorrecto de fecha",
            required_error: "La fecha inicio es requerida"
        }).refine(date => !isNaN(Date.parse(date)), {
            message: "Fecha de inicio inválida"
        }),

        "end_date": z.string({
            invalid_type_error: "Tipo fecha final invalida",
            required_error: "La fecha final es requerida"
        }).refine(date => !isNaN(Date.parse(date)), {
            message: "Fecha final inválida"
        })
    }
).strict()

export const validationReport = (data) => reportSaleSchema.safeParse(data)