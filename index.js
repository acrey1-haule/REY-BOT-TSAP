require('dotenv').config();
const { startBot, sendKeepAlive } = require('./lib/bot');

sendKeepAlive();
startBot();