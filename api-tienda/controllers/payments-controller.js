import Stripe from 'stripe';
import connection from "../config/db.js";
import { selectCarritoProducto } from "../bd/db.js";
import 'dotenv/config';

// Instancia de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const MINIMUM_AMOUNT = 50; // 50 centavos

export class PaymentsController {
    // Procesa un pago
    static async checkout(req, res) {
        const { user_id, cart_id, payment_method_id } = req.body;

        try {
            // Llamada a la función selectCarritoProducto
            const busqueda = await selectCarritoProducto(user_id, cart_id);

            if (!busqueda || !busqueda.productos || busqueda.productos.length === 0) {
                return res.status(404).json({ message: "No se encontró el carrito o no hay productos." });
            }

            // Calcular el monto total del carrito
            let totalAmount = 0;
            let productosConPrecio = [];  // Guardamos los productos con sus precios

            try {
                // Calculamos el precio total considerando la cantidad de cada producto
                const precios = await Promise.all(
                    busqueda.productos.map(async (producto) => {
                        return new Promise((resolve, reject) => {
                            connection.query(
                                'SELECT precio FROM productos WHERE id = ?',
                                [producto.producto_id],
                                (error, result) => {
                                    if (error) return reject(error);
                                    const precio = result.length > 0 ? parseInt(result[0].precio) : 0;
                                    const cantidad = producto.cantidad || 1;  // Asume 1 si no hay cantidad
                                    totalAmount += precio * cantidad;  // Acumulamos el total
                                    productosConPrecio.push({
                                        producto_id: producto.producto_id,
                                        precio: precio,
                                        cantidad: producto.cantidad
                                    });
                                    resolve();
                                }
                            );
                        });
                    })
                );

                // Esperamos a que todas las consultas terminen
                await Promise.all(precios);
            } catch (error) {
                console.error("Error al calcular el monto total:", error.message);
                return res.status(500).json({ message: 'Error al calcular el monto total.' });
            }

            // Verificar si el monto total es suficiente
            if (totalAmount < MINIMUM_AMOUNT) {
                return res.status(400).json({ message: `El monto debe ser al menos ${MINIMUM_AMOUNT / 100} USD.` });
            }

            // Crear PaymentIntent con Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount * 100, // en centavos
                currency: 'usd',
                payment_method: payment_method_id,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never', // Evita redirecciones
                },
                confirm: true,
            });

            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ message: 'El pago no se pudo procesar.' });
            }

            // Guardar el pago en la base de datos
            connection.query(
                'INSERT INTO pagos (estado, fecha_creacion, metodo_pago, total) VALUES (?, ?, ?, ?)',
                ['pendiente', new Date(), 'stripe', totalAmount],
                (error, result) => {
                    if (error) {
                        console.error('Error al guardar el pago:', error.message);
                        return res.status(500).json({ message: 'Error al procesar el pago' });
                    }

                    const payment_id = result.insertId;

                    // Guardar detalles del pago, ahora con precio válido
                    productosConPrecio.forEach((producto) => {
                        connection.query(
                            'INSERT INTO detalle_pagos (producto_id, pago_id, precio, usuario_id, cantidad) VALUES (?, ?, ?, ?, ?)',
                            [producto.producto_id, payment_id, producto.precio, user_id, producto.cantidad],
                            (error) => {
                                if (error) {
                                    console.error('Error al guardar detalles del producto:', error.message);
                                }
                            }
                        );
                    });

                    // Actualizar inventario y vaciar carrito
                    PaymentsController.updateInventory(busqueda.productos, cart_id, res);

                    return res.status(200).json({
                        message: 'Pago procesado con éxito',
                        payment: { id: payment_id, estado: 'completado', total: totalAmount },
                    });
                }
            );
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al procesar el pago', error: error.message });
        }
    }

    // Obtener el historial de pagos
    static async history(req, res) {
        const { userId } = req.params;

        try {
            connection.query(
                'SELECT p.* FROM pagos p JOIN detalle_pagos dp ON p.id = dp.pago_id WHERE dp.usuario_id = ?',
                [userId],
                (error, pagos) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ message: 'Error al obtener el historial de pagos' });
                    }

                    const pagosConDetalles = [];

                    const obtenerDetalles = (pago) => {
                        return new Promise((resolve, reject) => {
                            connection.query(
                                'SELECT * FROM detalle_pagos WHERE pago_id = ?',
                                [pago.id],
                                (error, detalles) => {
                                    if (error) {
                                        console.error(error);
                                        return reject(error);
                                    }
                                    pago.detalles = detalles;
                                    pagosConDetalles.push(pago);
                                    resolve();
                                }
                            );
                        });
                    };

                    Promise.all(pagos.map(obtenerDetalles))
                        .then(() => {
                            return res.status(200).json(pagosConDetalles);
                        })
                        .catch((error) => {
                            console.error(error);
                            return res.status(500).json({ message: 'Error al obtener los detalles de los pagos' });
                        });
                }
            );
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al obtener el historial de pagos', error: error.message });
        }
    }

    // Actualizar inventario y vaciar carrito
    static async updateInventory(cart_items, cart_id, res) {
        try {
            // Verificar si hay suficiente inventario para cada producto
            for (const producto of cart_items) {
                const [rows] = await connection.promise().query(
                    'SELECT stock FROM inventario WHERE productos_id = ?',
                    [producto.producto_id]
                );

                if (rows.length === 0 || rows[0].stock < producto.cantidad) {
                    return res.status(400).json({
                        message: `No hay suficiente inventario para el producto con ID ${producto.producto_id}`
                    });
                }
            }

            // Reducir el inventario de cada producto
            for (const producto of cart_items) {
                await connection.promise().query(
                    'UPDATE inventario SET stock = stock - ? WHERE productos_id = ?',
                    [producto.cantidad, producto.producto_id]
                );
            }

            // Vaciar el carrito del usuario
            await connection.promise().query(
                'DELETE FROM carritos WHERE id = ?',
                [cart_id]
            );
        } catch (error) {
            console.error('Error al actualizar inventario o vaciar el carrito:', error.message);
            throw new Error('No se pudo actualizar el inventario o vaciar el carrito');
        }
    }
}