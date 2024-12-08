import connection from "../config/db.js";
import {validationReport} from "../schemas/reports-schema.js"

export class ReportsController {
    static async sales(req, res) {
        const { start_date, end_date } = req.query;

        // Validar las fechas
        const validation = validationReport({ start_date, end_date });
        if (!validation.success) {
            return res.status(400).json(validation.error.errors);
        }

        const query = `
            SELECT dp.usuario_id, dp.producto_id, dp.cantidad, dp.precio, p.nombre, p.descripcion, p.categoria, pg.fecha_creacion
            FROM detalle_pagos dp
            JOIN productos p ON dp.producto_id = p.id
            JOIN pagos pg ON dp.pago_id = pg.id
            WHERE pg.fecha_creacion BETWEEN ? AND ?;
        `;

        try {
            const [results] = await connection.promise().query(query, [start_date, end_date]);
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({
                error: true,
                message: "Ocurrió un error al generar el reporte de ventas: " + error
            });
        }
    }

    static async inventory(req, res) {
        const query = `
            SELECT p.id as productId, p.nombre, p.descripcion, p.categoria, i.stock,
                   CASE
                       WHEN i.stock < 5 THEN 'Stock bajo'
                       ELSE 'Disponible'
                   END as estado
            FROM productos p
            JOIN inventario i ON p.id = i.productos_id
            WHERE i.stock > 0;
        `;

        try {
            const [results] = await connection.promise().query(query);
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({
                error: true,
                message: "Ocurrió un error al generar el reporte de inventario: " + error
            });
        }
    }
}