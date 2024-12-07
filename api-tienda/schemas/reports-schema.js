import {z} from "zod"

const reportSaleSchema = z.object(
    {
        "start_date": z.string({
            invalid_type_error:"Tipo incorrecto de fecha",
            required_error: "La fecha inicio es requerida"
        }).date(),

        "end_date": z.string({
            invalid_type_error: "Tipo fecha final invalida",
            required_error: "La fecha final es requerida"
        })
    }
).strict()

export const validationReport = (data) => reportSaleSchema.safeParse(data)