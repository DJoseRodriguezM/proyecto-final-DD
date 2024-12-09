import express, { json } from 'express';
import { corsMiddleware } from './middlewares/cors.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import inventarioRouter from './routes/inventario.js';
import paymentsRouter from './routes/payments.js';
import productsRouter from './routes/products.js';
import reportsRouter from './routes/reports.js';
import 'dotenv/config';
import authMiddleware from './middlewares/authMiddleware.js';
import isAdmin from './middlewares/isAdmin.js';

const app = express();

app.disable('x-powered-by');
app.use(json());
app.use(corsMiddleware());

const PORT = process.env.PORT || 3000;

// Rutas
app.use('/auth', authRouter)

// Ruta protegida con authMiddleware e isAdmin
app.use('/admin', authMiddleware, isAdmin, (req, res) => {
    res.json({ message: 'Acceso concedido a la ruta de administrador' });
});

app.use('/cart', cartRouter)
app.use('/inventory', inventarioRouter)
app.use('/payments', paymentsRouter)
app.use('/products', productsRouter)
app.use('/reports', reportsRouter)


app.use((req, res) => {
    res.status(404).json({
        message: "URL no encontrada"
    })
})

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
})