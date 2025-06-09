// File: lib/bot.js
import makeWASocket, { useSingleFileAuthState } from '@whiskeysockets/baileys';
import { handleCommand } from './handler.js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const { state, saveState } = useSingleFileAuthState('./session/auth.json');

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  browser: ['ReyBot', 'Chrome', '10.0']
});

sock.ev.on('creds.update', saveState);

setInterval(() => {
  if (process.env.ALWAYS_ONLINE === 'true') {
    sock.sendPresenceUpdate('available');
  }
}, 5000);

sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;
  await handleCommand(sock, msg);
});
