const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');
const http = require('http'); 
const fs = require('fs');
require('dotenv').config();

// 1. Limpar sessões fantasma para evitar o erro "Browser is already running"
const authPath = './.wwebjs_auth';
if (fs.existsSync(authPath)) {
    try {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('Limpeza de sessões antigas concluída.');
    } catch (e) {
        console.error('Erro ao limpar cache:', e);
    }
}

// 2. Criar um servidor Web Falso para o Render não reiniciar o bot
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.write('Bot do WhatsApp esta online e a funcionar!');
    res.end();
}).listen(port, () => console.log(`Servidor web rodando na porta ${port} para o Render`));

// 3. Inicializar o Bot
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('--- QR CODE GERADO ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot conectado com sucesso ao WhatsApp!');
});

client.on('message', async (msg) => {
    if (msg.from.endsWith('@c.us')) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: msg.body,
            });
            msg.reply(response.text);
        } catch (error) {
            console.error('Erro na API Gemini:', error);
        }
    }
});

client.initialize();