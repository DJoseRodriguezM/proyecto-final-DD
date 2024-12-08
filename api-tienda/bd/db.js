import connection from "../config/db.js";

// Asegúrate de que esta función devuelva una promesa
export const selectCarritoProducto = (usuario_id, carrito_id) => {
    return new Promise((resolve, reject) => {
        const consult = `
            SELECT 
                cp.carrito_id, 
                c.usuario_id, 
                JSON_ARRAYAGG(cp.producto_id) AS productos
            FROM 
                carrito_productos cp
            INNER JOIN 
                carritos c ON cp.carrito_id = c.id
            WHERE 
                c.usuario_id = ? AND cp.carrito_id = ?
            GROUP BY 
                cp.carrito_id, c.usuario_id;
        `;
        
        connection.query(consult, [usuario_id, carrito_id], (error, result) => {
            if (error) {
                reject(error); // Rechaza la promesa si hay un error
            } else {
                resolve(result[0]); // Resuelve la promesa con los resultados
            }
        });
    });
};
