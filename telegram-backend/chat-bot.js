require('dotenv').config();
const OpenAI = require("openai");
const WebSocket = require("ws");

// Inicializa el cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// WebSockets
const ws1 = new WebSocket('ws://localhost:3000');
const ws2 = new WebSocket('ws://localhost:3000');

let conversation = []; // historial de la conversación

async function generateResponse(message) {
  conversation.push({ role: "user", content: message });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: conversation,
  });

  const reply = res.choices[0].message.content;
  conversation.push({ role: "assistant", content: reply });
  return reply;
}

// Bot1 inicia la conversación
ws1.on('open', async () => {
  const msg = await generateResponse("Hola!");
  ws1.send("Bot1: " + msg);
});

// Bot2 responde
ws2.on('message', async (msg) => {
  console.log("Bot2 escuchó: " + msg);
  const reply = await generateResponse(msg);
  setTimeout(() => ws2.send("Bot2: " + reply), 1000);
});

// Bot1 sigue la conversación
ws1.on('message', async (msg) => {
  console.log("Bot1 escuchó: " + msg);
  const reply = await generateResponse(msg);
  setTimeout(() => ws1.send("Bot1: " + reply), 1000);
});
