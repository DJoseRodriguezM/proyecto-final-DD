import connection from "../config/db.js";

export class CartController {
    static getCartByUser(req, res) {
        const userId = req.params.userId;
        const query = `
            SELECT cp.id as cartProductId, p.id as productId, p.nombre, p.descripcion, p.precio, cp.cantidad, cp.fecha_agregado,
                   dp.color, dp.talla, dp.peso, dp.dimensiones
            FROM carritos c
            JOIN carrito_productos cp ON c.id = cp.carrito_id
            JOIN productos p ON cp.producto_id = p.id
            LEFT JOIN detalles_producto dp ON p.id = dp.producto_id
            WHERE c.usuario_id = ?;
        `;
        try {
            connection.query(query, [userId], (error, results) => {
                if (error) {
                    return res.status(400).json({
                        error: true,
                        message: "Ocurrió un error al obtener los datos: " + error
                    })
                }
                if (results && results.length === 0) {
                    return res.json({
                        message: "Usuario no encontrado"
                    })
                }

                return res
                    .header('Content-Type', 'application/json')
                    .status(200)
                    .json(results)
            })
        } catch (error) {
            return res.status(400).json({
                error: true,
                message: "Ocurrió un error al obtener los datos: " + error
            })
        }
        
    }

    static addToCart(req, res) {
        const { userId, productId, cantidad } = req.body;
        const findOrCreateCartQuery = `
            INSERT INTO carritos (usuario_id)
            VALUES (?)
            ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
        `;
        const addProductToCartQuery = `
            INSERT INTO carrito_productos (carrito_id, producto_id, cantidad)
            VALUES (LAST_INSERT_ID(), ?, ?)
            ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad);
        `;
        try {
            connection.beginTransaction((err) => {
                if (err) throw err;
                connection.query(findOrCreateCartQuery, [userId], (error, results) => {
                    if (error) {
                        return connection.rollback(() => {
                            res.status(400).json({
                                error: true,
                                message: "Ocurrió un error al crear el carrito: " + error
                            })
                        })
                    }
                    if (results && results.length === 0) {
                        return res.json({
                            message: "Usuario no encontrado"
                        });
                    }

                    const carritoId = results.insertId;
                    connection.query(addProductToCartQuery, [productId, cantidad], (error, results) => {
                        if (error) {
                            return connection.rollback(() => {
                                res.status(400).json({
                                    error: true,
                                    message: "Ocurrió un error al añadir el producto al carrito: " + error
                                })
                            })
                        }
                        if (results && results.length === 0) {
                            return res.json({
                                message: "Usuario no encontrado"
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    res.status(400).json({
                                        error: true,
                                        message: "Ocurrió un error al confirmar la transacción: " + err
                                    })
                                })
                            }
                            return res
                                .header('Content-Type', 'application/json')
                                .status(200)
                                .json(results)
                            })
                    })
                })
            })
        } catch (error) {
            return res.status(400).json({
                error: true,
                message: "Ocurrió un error al añadir el producto al carrito: " + error
            })
        }
    }

    static removeFromCart(req, res) {
        const { userId, productId, cantidad } = req.body;
        const getCartProductQuery = `
            SELECT cp.cantidad, cp.carrito_id
            FROM carrito_productos cp
            JOIN carritos c ON cp.carrito_id = c.id
            WHERE c.usuario_id = ? AND cp.producto_id = ?;
        `;
        const deleteProductFromCartQuery = `
            DELETE FROM carrito_productos
            WHERE carrito_id = ? AND producto_id = ?;
        `;
        const updateProductQuantityQuery = `
            UPDATE carrito_productos
            SET cantidad = cantidad - ?
            WHERE carrito_id = ? AND producto_id = ?;
        `;
        try {
            connection.query(getCartProductQuery, [userId, productId], (error, results) => {
                if (error) {
                    return res.status(400).json({
                        error: true,
                        message: "Ocurrió un error al obtener los datos del producto en el carrito: " + error
                    });
                }
                if (results && results.length === 0) {
                    return res.json({
                        message: "Usuario no encontrado"
                    });
                }
                const currentQuantity = results[0].cantidad;
                const carritoId = results[0].carrito_id;
                if (cantidad > currentQuantity) {
                    return res.status(400).json({
                        error: true,
                        message: "La cantidad a eliminar no puede ser mayor que la cantidad actual en el carrito"
                    });
                }
                if (currentQuantity <= cantidad) {
                    connection.query(deleteProductFromCartQuery, [carritoId, productId], (error, results) => {
                        if (error) {
                            return res.status(400).json({
                                error: true,
                                message: "Ocurrió un error al eliminar el producto del carrito: " + error
                            });
                        }
                        return res.status(200).json({
                            message: 'Producto eliminado del carrito'
                        });
                    });
                } else {
                    connection.query(updateProductQuantityQuery, [cantidad, carritoId, productId], (error, results) => {
                        if (error) {
                            return res.status(400).json({
                                error: true,
                                message: "Ocurrió un error al actualizar la cantidad del producto en el carrito: " + error
                            });
                        }
                        return res.status(200).json({
                            message: 'Cantidad del producto actualizada en el carrito'
                        });
                    });
                }
            });
        } catch (error) {
            return res.status(400).json({
                error: true,
                message: "Ocurrió un error al eliminar el producto del carrito: " + error
            });
        }
    }
}