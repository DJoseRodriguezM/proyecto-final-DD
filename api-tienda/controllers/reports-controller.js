import connection from "../config/db.js";
import {validationReport} from "../schemas/reports-schema.js"
import connect from "../config/db.js"

export class ReportsController {
    static async sales(req, res) {
        try{
            const data = req.body

            const {success, error} = validationReport(data)

            const consult = ""


            if(!success){
                return res.status(404)
                    .json({
                        message: "Error en la validacion de los datos"
                    })
            }

        }catch(error){

        }
    }

    static async inventory(req, res) {
        
    }
}