const jsonServer = require('json-server')
const express = require('express')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path')
const cors = require('cors')
const fs = require('fs');

// Cria servidor com Express (que também usará json-server)
const app = express()
const dbPath = path.join(__dirname, './db/db.json'); // uses './db/db.json'

// CORS e arquivos estáticos
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json()); // Add this near the top of your server file



// Configure MIME types
app.use('*.js', (req, res, next) => {
    res.type('application/javascript');
    next();
});

app.use('*.css', (req, res, next) => {
    res.type('text/css');
    next();
});

app.get('/assets/css/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'assets', 'css', 'style.css'), {
        headers: {
            'Content-Type': 'text/css'
        }
    });
});

// SSE endpoint for driver location updates
app.get('/motoristas/:id', (req, res) => {
    const driverId = req.params.id;
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    // Function to send current location
    const sendLocation = () => {
        try {
            // Read the file fresh each time
            const dbFileContent = fs.readFileSync(dbPath, 'utf8');
            const db = JSON.parse(dbFileContent); // Parse the fresh content

            const driver = db.drivers.find(d => d.id === parseInt(driverId));

            if (driver && driver.realtimeLocation) {
                res.write(`data: ${JSON.stringify({ realtimeLocation: driver.realtimeLocation })}\n\n`);
            }
        } catch (err) {
            console.error("[SSE] Error reading or parsing db.json:", err);
        }
    };

    // Send initial location
    sendLocation();

    // Set up interval to check for updates
    const interval = setInterval(sendLocation, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Regular REST endpoint for getting driver data
app.get('/motoristas/:id/data', (req, res) => {
    const driverId = req.params.id;
    const db = require('./db/db.json');
    const driver = db.drivers.find(d => d.id === parseInt(driverId));
    
    if (driver) {
        res.json(driver); // Return the full driver object as JSON
    } else {
        res.status(404).json({ error: 'Driver not found' });
    }
});

// Regular REST endpoint for putting driver data
app.put('/motoristas/:id', (req, res) => {
    const driverId = parseInt(req.params.id);
    const updatedDriverData = req.body;
    
    try {
        // Read current database
        const fs = require('fs');
        const dbPath = './db/db.json';
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Find the driver index
        const driverIndex = db.drivers.findIndex(d => d.id === driverId);
        
        if (driverIndex === -1) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        
        // Update the driver data
        db.drivers[driverIndex] = { ...db.drivers[driverIndex], ...updatedDriverData };
        
        // Write back to file
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        
        // Return the updated driver
        res.json(db.drivers[driverIndex]);
        
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota personalizada para gerar QR Code Pix
app.get('/api/pix', async (req, res) => {
    const { nome, cidade, valor, chave } = req.query
    console.log('Requisição recebida:', { nome, cidade, valor, chave })

    if (!nome || !cidade || !valor || !chave) {
        return res.status(400).json({ error: 'Parâmetros ausentes' });
    }

    try {
        const params = new URLSearchParams({
            nome,
            cidade,
            valor,
            chave,
            saida: 'br'
        });

        const response = await fetch(`https://gerarqrcodepix.com.br/api/v1?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`API respondeu com status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta da API PIX:', data);
        res.json(data);
    } catch (err) {
        console.error('Erro ao buscar QR Pix:', err);
        res.status(500).json({ error: 'Erro ao gerar QR Pix', details: err.message });
    }
});

// Ping para verificar se o servidor está online
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor está online' });
});

// ----------------------------
// Integração com JSON Server
// ----------------------------
const router = jsonServer.router('./db/db.json')
const middlewares = jsonServer.defaults({ noCors: true })

app.use(middlewares)
app.use(router)

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor unificado rodando em http://localhost:3000')
})
