import mysql from 'mysql';
import 'dotenv/config';

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

connection.connect((error) => {
    if(error){
        console.log('Error al conectarse a la base de datos', error);
        throw error;
    }
})

export default connection;