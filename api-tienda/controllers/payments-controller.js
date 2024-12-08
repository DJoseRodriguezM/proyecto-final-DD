import Stripe from 'stripe';
import connection from "../config/db.js";
import { selectCarritoProducto } from "../bd/db.js";

// Instancia de Stripe (reemplaza con tu clave secreta de Stripe)
const stripe = new Stripe('sk_test_51QTnjAEL4sjlSoZnkQMFwKhgsSFNKDeTdGSXrIflNhZO5wC1GiESJJUGfJD62DaBWZ4GxWiWG9Wm07IxWZSVgsg700n0vMy75U');

// Asume que el monto mínimo para 'usd' es 50 centavos
const MINIMUM_AMOUNT = 50; // 50 centavos

export class PaymentsController {
    // Procesa un pago
    static async checkout(req, res) {
        const { user_id, cart_id, payment_method_id } = req.body;

        try {
            // Llamada a la función selectCarritoProducto
            const busqueda = await selectCarritoProducto(user_id, cart_id);

            // Verificamos si busqueda tiene el formato esperado
            if (!busqueda || !busqueda.productos || busqueda.productos.length === 0) {
                return res.status(404).json({
                    message: "No se encontró el carrito o no hay productos en el carrito."
                });
            }

            // Calcula el monto total del carrito
            let totalAmount = 0;
            try {
                const precios = await Promise.all(
                    busqueda.productos.map((producto_id) =>
                        new Promise((resolve, reject) => {
                            connection.query(
                                'SELECT precio FROM productos WHERE id = ?',
                                [producto_id],
                                (error, result) => {
                                    if (error) return reject(error); // Rechaza la promesa si hay error
                                    if (result && result.length > 0) {
                                        resolve(parseInt(result[0].precio)); // Devuelve el precio
                                    } else {
                                        resolve(0); // Si no se encuentra el producto, devuelve 0
                                    }
                                }
                            );
                        })
                    )
                );

                // Suma los precios obtenidos
                totalAmount = precios.reduce((sum, price) => sum + price, 0);
            } catch (error) {
                console.error("Error al calcular el monto total:", error.message);
                return res.status(500).json({ message: 'Error al calcular el monto total del carrito' });
            }

            console.log(`Monto total calculado: ${totalAmount} USD`);

            // Verifica si el monto total es mayor al mínimo permitido
            if (totalAmount < MINIMUM_AMOUNT) {
                return res.status(400).json({
                    message: `El monto total debe ser al menos ${MINIMUM_AMOUNT / 100} USD para procesar el pago.`
                });
            }

            // Crear PaymentIntent con Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount * 100, // En centavos
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

            // Guarda el pago en la base de datos
            connection.execute(
                'INSERT INTO pagos (estado, fecha_creacion, metodo_pago, total) VALUES (?, ?, ?, ?)',
                ['pendiente', new Date(), 'stripe', totalAmount],
                (error, result) => {
                    if (error) {
                        console.error('Error al guardar el pago:', error.message);
                        return res.status(500).json({ message: 'Error al procesar el pago' });
                    }

                    const payment_id = result.insertId;

                    // Guarda los detalles del producto
                    busqueda.productos.forEach((producto_id) => {
                        connection.execute(
                            'INSERT INTO detalles_producto (producto_id, pago_id, precio, usuario_id) VALUES (?, ?, ?, ?)',
                            [producto_id, payment_id, totalAmount, user_id],
                            (error) => {
                                if (error) {
                                    console.error('Error al guardar detalles del producto:', error.message);
                                }
                            }
                        );
                    });

                    // Actualiza el inventario y vacía el carrito
                    PaymentsController.updateInventory(busqueda.productos, cart_id);

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

    // Obtener el historial de pagos de un usuario
    static async history(req, res) {
        const { userId } = req.params;

        try {
            connection.execute(
                'SELECT * FROM pagos WHERE usuario_id = ?',
                [userId],
                (error, pagos) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ message: 'Error al obtener el historial de pagos' });
                    }

                    pagos.forEach((pago) => {
                        connection.execute(
                            'SELECT * FROM detalles_producto WHERE pago_id = ?',
                            [pago.id],
                            (error, detalles) => {
                                if (error) {
                                    console.error(error);
                                }
                                pago.detalles = detalles;
                            }
                        );
                    });

                    return res.status(200).json(pagos);
                }
            );
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al obtener el historial de pagos', error: error.message });
        }
    }

    // Actualizar el inventario y vaciar el carrito
    static async updateInventory(cart_items, cart_id) {
        try {
            cart_items.forEach((producto_id) => {
                connection.execute(
                    'UPDATE inventario SET stock = stock - 1 WHERE productos_id = ?',
                    [producto_id],
                    (error) => {
                        if (error) {
                            console.error('Error al actualizar inventario:', error.message);
                        }
                    }
                );
            });

            connection.execute(
                'DELETE FROM carrito_productos WHERE carrito_id = ?',
                [cart_id],
                (error) => {
                    if (error) {
                        console.error('Error al vaciar carrito:', error.message);
                    }
                }
            );
        } catch (error) {
            console.error('Error al actualizar el inventario o vaciar el carrito:', error.message);
            throw new Error('No se pudo actualizar el inventario o vaciar el carrito');
        }
    }
}
