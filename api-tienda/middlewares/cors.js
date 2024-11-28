import cors from 'cors'

export const corsMiddleware = () => cors({
    origin: (origin, callback) => {

        const accesos_permitidos = [
            '*'
        ]

        if (accesos_permitidos.includes(origin)) {
            callback(null, true)
            return
        }

        if (!origin) {
            callback(null, true)
            return
        }

        callback(new Error('Acceso no permitido'))

    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})