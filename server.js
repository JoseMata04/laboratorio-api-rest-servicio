
require('dotenv').config();

const express = require('express');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR
// ==========================================

// Permitir recibir datos JSON
app.use(express.json());


// ==========================================
// 2. RUTA PRINCIPAL DE PRUEBA
// ==========================================

app.get('/', (req, res) => {
    res.status(200).json({
        mensaje: 'API REST funcionando'
    });
});


// ==========================================
// 3. GET - CONSULTAR TODOS LOS SERVICIOS
// ==========================================

app.get('/api/servicios', async (req, res) => {
    try {

        const [rows] = await db.execute(
            'SELECT * FROM servicios'
        );

        return res.status(200).json(rows);

    } catch (error) {

        console.error('Error GET servicios:', error.message);

        return res.status(500).json({
            mensaje: 'Error al consultar servicios'
        });
    }
});


// ==========================================
// 4. GET - CONSULTAR SERVICIO POR ID
// ==========================================

app.get('/api/servicios/:id', async (req, res) => {
    try {

        const id = Number(req.params.id);

        // Validar que el ID sea correcto
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'ID inválido'
            });
        }

        // Consulta parametrizada
        const [rows] = await db.execute(
            'SELECT * FROM servicios WHERE id = ?',
            [id]
        );

        // Comprobar si existe el servicio
        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {

        console.error('Error GET por ID:', error.message);

        return res.status(500).json({
            mensaje: 'Error al consultar servicio'
        });
    }
});


// ==========================================
// 5. POST - REGISTRAR UN SERVICIO
// ==========================================

app.post('/api/servicios', async (req, res) => {
    try {

        const { nombre, precio } = req.body || {};

        // Validar el nombre
        if (
            typeof nombre !== 'string' ||
            nombre.trim() === ''
        ) {
            return res.status(400).json({
                mensaje: 'El nombre es obligatorio'
            });
        }

        // Validar longitud del nombre
        if (nombre.trim().length > 100) {
            return res.status(400).json({
                mensaje: 'El nombre no puede superar 100 caracteres'
            });
        }

        // Validar el precio
        if (
            typeof precio !== 'number' ||
            !Number.isFinite(precio) ||
            precio <= 0 ||
            precio > 99999999.99
        ) {
            return res.status(400).json({
                mensaje: 'El precio debe ser un número positivo válido'
            });
        }

        // Consulta SQL parametrizada
        const [resultado] = await db.execute(
            'INSERT INTO servicios (nombre, precio) VALUES (?, ?)',
            [nombre.trim(), precio]
        );

        return res.status(201).json({
            mensaje: 'Servicio registrado correctamente',
            id: resultado.insertId
        });

    } catch (error) {

        console.error('Error POST:', error.message);

        return res.status(500).json({
            mensaje: 'Error al registrar servicio'
        });
    }
});


// ==========================================
// 6. MANEJAR RUTAS NO EXISTENTES
// ==========================================

app.use((req, res) => {
    return res.status(404).json({
        mensaje: 'Ruta no encontrada'
    });
});


// ==========================================
// 7. INICIAR SERVIDOR EXPRESS
// ==========================================

async function iniciarServidor() {

    try {

        // Verificar conexión con MySQL
        await db.query('SELECT 1');

        console.log('Conexión a MySQL correcta');

        // Iniciar Express en el puerto 3000
        const servidor = app.listen(PORT);

        // Confirmar que el puerto está disponible
        servidor.on('listening', () => {
            console.log(
                `Servidor funcionando en http://localhost:${PORT}`
            );
        });

        // Manejar errores del servidor
        servidor.on('error', (error) => {

            if (error.code === 'EADDRINUSE') {
                console.error(
                    `ERROR: El puerto ${PORT} ya está ocupado.`
                );
                console.error(
                    'Cierra el servidor anterior e intenta nuevamente.'
                );
            } else {
                console.error(
                    'Error del servidor:', error.message
                );
            }

            process.exitCode = 1;
        });

    } catch (error) {

        console.error(
            'Error al conectar con MySQL:', error.message
        );

        process.exitCode = 1;
    }
}

// Ejecutar el servidor
iniciarServidor();
