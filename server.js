import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Proxy route for Ollama API
app.post('/api/generate', async (req, res) => {
    try {
        console.log('Received request:', req.body);

        if (!req.body.prompt) {
            throw new Error('No prompt provided');
        }

        console.log('Sending request to Ollama...');
        
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b',
                prompt: req.body.prompt,
                stream: false
            })
        });

        console.log('Ollama response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama error:', errorText);
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Ollama response:', {
            model: data.model,
            response_length: data.response?.length
        });

        res.json({
            response: data.response,
            model: data.model
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to communicate with Ollama API',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Environment:', {
        nodeEnv: process.env.NODE_ENV,
        ollamaModel: process.env.OLLAMA_MODEL,
        port: PORT
    });
});