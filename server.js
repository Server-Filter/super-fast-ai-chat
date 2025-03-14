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

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Proxy route for Ollama API
app.post('/api/generate', async (req, res) => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b',
                prompt: req.body.prompt,
                stream: false,
                format: 'json'
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Ollama response:', data);
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to communicate with Ollama API',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});