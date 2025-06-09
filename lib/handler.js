// File: lib/handler.js
export async function handleCommand(sock, msg) {
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
  const from = msg.key.remoteJid;

  if (!text) return;

  if (text.startsWith('!menu')) {
    await sock.sendMessage(from, { text: `
🤖 *REY-BOT COMMAND MENU*

!menu - Show this menu
!animate - Generate animation
!clean - Remove watermark
!episodes - Cartoon series (6x5s)
!kick @user - Remove member
!promote @user - Promote member
!desc new text - Change group description
` });
  } else if (text.startsWith('!animate')) {
    await sock.sendMessage(from, { text: '🎞️ Generating animation from your input...' });
  } else if (text.startsWith('!clean')) {
    await sock.sendMessage(from, { text: '🧼 Removing watermark from your file...' });
  } else if (text.startsWith('!episodes')) {
    await sock.sendMessage(from, { text: '🎬 Creating 6-episode cartoon...' });
  } else {
    await sock.sendMessage(from, {
      text: 'Hi! Type *!menu* to see what I can do. 😊'
    });
  }
}
