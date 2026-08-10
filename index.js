require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');

// Inicializa a API do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Instruções do assistente
const SYSTEM_PROMPT = `
Você é um assistente virtual amigável e eficiente responsável pelo atendimento ao cliente via WhatsApp.
Instruções:
1. Responda de forma clara, direta e cordial em português.
2. Mantenha respostas curtas e adequadas para mensagens de WhatsApp.
`;

const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
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

client.on('message', async (msg) => {
  // Ignora grupos, status e mensagens sem texto (ex: figurinhas soltas)
  if (msg.from.includes('@g.us') || msg.isStatus || !msg.body || msg.body.trim() === '') return;

  try {
    console.log(`[Mensagem Recebida]: ${msg.body}`);

    // Usando gemini-1.5-flash (limite de 15 requisições por minuto no plano grátis)
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: msg.body,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    const respostaIA = response.text;
    await msg.reply(respostaIA);
    console.log(`[Resposta Enviada]: ${respostaIA}`);

  } catch (error) {
    if (error.status === 429) {
      console.log('⚠️ Limite de requisições do Gemini atingido temporariamente. Aguarde alguns segundos.');
    } else {
      console.error('Erro ao processar mensagem com Gemini:', error);
    }
  }
});

client.initialize();