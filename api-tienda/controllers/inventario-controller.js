import connection from "../config/db.js";

export class InventarioController {
    static async restock(req, res) {
        try {
            const { product_id, cantidad } = req.body;

            const consultBuscar = "SELECT id FROM productos WHERE id = ?";

            connection.query(consultBuscar, [product_id], (error, result) => {
                if (error) {
                    return res.status(404).json({
                        message: "Error en la búsqueda del producto"
                    });
                }

                if (result && result.length === 0) {
                    return res.status(404).json({
                        message: "Producto no encontrado"
                    });
                }

                const consult = "INSERT INTO inventario (productos_id, stock) VALUES (?, ?)";

                connection.query(consult, [product_id, cantidad], (error, result) => {
                    if (error) {
                        return res.status(404).json({
                            message: "No se pudo agregar al inventario"
                        });
                    }
                    if (result && result.length === 0) {
                        return res.status(404).json({
                            message: "Producto no encontrado"
                        });
                    }

                    return res.status(201).json({
                        message: "Producto agregado al inventario",
                        result: {
                            productos_id: product_id,
                            stock: cantidad
                        }
                    });
                });
            });
        } catch (error) {
            return res.status(500).json({
                message: "Error en el servidor",
                error: error.message
            });
        }
    }

    static async getStockyByID(req, res) {
        const { id } = req.params;
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
                    return res.status(404).json({
                        message: "Error al obtener los datos"
                    });
                }

                if (result && result.length === 0) {
                    return res.status(404).json({
                        message: "Información no encontrada"
                    });
                }

                return res.status(200).json(result[0]);
            });
        } catch (e) {
            return res.status(500).json({
                message: "Error en el servidor",
                error: e.message
            });
        }
    }
}