const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const BOT_NAME = 'REY‑BOT';
const GREETING = '✨ Hey! I’m REY‑BOT, your mcheshi assistant 🤖. How can I help you today?';

async function getAIResponse(prompt) {
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI error:', err.message);
    return '😓 Sorry, I had trouble thinking of an answer.';
  }
}

function sendKeepAlive() {
  console.log('✅ REY‑BOT is alive and ready!');
}

async function enhanceImage(imagePath) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));

  const response = await axios.post('https://api.deepai.org/api/torch-srgan', formData, {
    headers: {
      'Api-Key': process.env.DEEPAI_KEY,
      ...formData.getHeaders()
    }
  });

  return response.data.output_url;
}

async function downloadMedia(message, type) {
  const stream = await downloadContentFromMessage(message[type], type);
  const filename = path.join(__dirname, `../downloads/${uuidv4()}.${type === 'imageMessage' ? 'jpg' : 'mp4'}`);
  const buffer = [];
  for await (const chunk of stream) buffer.push(chunk);
  fs.writeFileSync(filename, Buffer.concat(buffer));
  return filename;
}

async function startBot() {
  console.log(`
╔════════════════════════════╗
║    🤖 REY-BOT Activated!   ║
║    Mcheshi. Msaidizi. AI. ║
╚════════════════════════════╝
`);

  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (msg.message.imageMessage) {
      const filename = await downloadMedia(msg.message, 'imageMessage');
      try {
        const enhancedURL = await enhanceImage(filename);
        await sock.sendMessage(sender, {
          image: { url: enhancedURL },
          caption: '🖼️ Enhanced by REY‑BOT!'
        });
      } catch (e) {
        await sock.sendMessage(sender, { text: '😓 Failed to enhance image.' });
      }
      return;
    }

    if (!text) return;

    if (text.toLowerCase() === 'hi') {
      await sock.sendMessage(sender, { text: `${GREETING}` });
    } else if (text.toLowerCase() === 'help') {
      const reply = 
`${BOT_NAME} here! 🔥
Commands:
• *hi* – Greet me
• *help* – Show this menu
• *ping* – I’ll pong back
• *ai <question>* – Ask me anything 🤔
• *sauti <text>* – I’ll speak it 🎤
• *send image* – I’ll enhance it 🧠`;
      await sock.sendMessage(sender, { text: reply });
    } else if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(sender, { text: 'Pong! 🏓' });
    } else if (text.toLowerCase().startsWith('ai ')) {
      const userPrompt = text.slice(3).trim();
      const aiReply = await getAIResponse(userPrompt);
      await sock.sendMessage(sender, { text: `🤖 ${aiReply}` });
    } else if (text.toLowerCase().startsWith('sauti ')) {
      const voiceText = text.slice(6).trim();
      // Placeholder for TTS function, to be implemented in tts.js
      await sock.sendMessage(sender, { text: '🔊 Voice feature coming soon!' });
    } else {
      await sock.sendMessage(sender, { text: `'${text}' huh? I’m still learning 😅` });
    }
  });

  // Auto-status view and emoji reaction
  sock.ev.on('messages.update', async updates => {
    const emojis = ['👍', '❤️', '😂', '😍', '🎉'];
    for (const update of updates) {
      if (update.key && update.key.remoteJid?.startsWith('status@broadcast')) {
        try {
          await sock.readMessages([update.key]);
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          await sock.sendMessage(update.key.remoteJid, { reaction: { text: emoji, key: update.key } });
          console.log(`👀 REY‑BOT viewed status and reacted with ${emoji}`);
        } catch (err) {
          console.error('❌ Failed to view/react status:', err);
        }
      }
    }
  });
}

module.exports = { startBot, sendKeepAlive, enhanceImage };