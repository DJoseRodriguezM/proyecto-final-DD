import { json } from "express";
import connection from "../config/db.js";

export class InventarioController {
    static async restock(req, res) {
        try{
            const {product_id, cantidad} = req.body

            const consultBuscar = "SELECT id FROM productos WHERE id = ?"

            const busquedaId = connection.query(consultBuscar, [product_id], (error, result) => {
                console.log(result)
                if(error){
                    return res.status(404)
                        .json({
                            message: "Error en la busqueda del producto"
                        })
                }
                
                if(result){
                    return true
                }
                return false
            })
            if(busquedaId){
                const consult = "INSERT INTO inventario (productos_id, stock) VALUES (?,?)"

            connection.query(consult, [product_id, cantidad], (error, result)=>{
                if(error){
                    return res.status(404)
                        .json({
                            message: "No se pudo agregar al inventario"
                        })
                }
                return res.status(201)
                    .json(result)
            })
            }
        }catch(error){
            return res.json(error.message)
        }
    }

    static async getStockyByID(req, res) {
        const { id } = req.params;  // Se corrigió para acceder a los parámetros de la URL
        try {
            const consult = `
                SELECT i.productos_id, p.nombre, SUM(i.stock) AS cantidad 
                FROM inventario i 
                INNER JOIN productos p ON i.productos_id = p.id 
                WHERE i.productos_id = ? 
                GROUP BY i.productos_id, p.nombre
            `;
            
            connection.query(consult, [id], (error, result) => {
                if (error) {
                    console.log(error);  
                    return res.status(404).json({
                        message: "Error al obtener los datos"
                    });
                }
                
                if (result.length === 0) {  
                    return res.status(404).json({
                        message: "Información no encontrada"
                    });
                }
                
                console.log(result);  
                return res.status(200).json(result[0]);  
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Error en el servidor"
            });
        }
    }
    
}