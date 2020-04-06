const config = require('./config.json');
const TelegramBot = require('node-telegram-bot-api');
const { StreamClient } = require("cw-sdk-node");

const client = new StreamClient({
  creds: {
    apiKey: config.Cryptowatch.APIKey,
    secretKey: config.Cryptowatch.Secret
  },
  subscriptions: [
    "pairs:9:trades" // BTC/USD
  ],
  logLevel: "debug"
});
const bot = new TelegramBot(config.Telegram.Token, {polling: true});

var _chatId = 0;
var minPrice = 0;
var maxPrice = 0;
var lastPrice = 0;
var interval = 30 * 1000;

bot.on('polling_error', (error) => console.log(error));

bot.onText(/\/setpeaks [0-9]+ [0-9]+/, (message, match) => {

  const chatId = message.chat.id;
  _chatId = chatId;

  var split = match[0].split(' ');
  minPrice = split[1];
  maxPrice = split[2];

  var reply = 'New min (USD): ' + minPrice + '\n';
  reply += 'New max (USD): ' + maxPrice;

  bot.sendMessage(chatId, reply);
});

bot.onText(/\/getpeaks/, (message) => {

  const chatId = message.chat.id;
  _chatId = chatId;

  var reply = 'Current min (USD): ' + minPrice + '\n';
  reply += 'Current max (USD): ' + maxPrice;

  bot.sendMessage(chatId, reply);
});

bot.onText(/\/settimer [0-9]+/, (message, match) => {

  const chatId = message.chat.id;
  _chatId = chatId;

  var split = match[0].split(' ');
  var minutes = split[1];
  var seconds = minutes * 60;
  interval = seconds * 1000;

  var reply = 'New timer (minutes): ' + minutes + '\n';
  reply += 'New timer (seconds): ' + seconds;

  bot.sendMessage(chatId, reply);
});

bot.onText(/\/gettimer/, (message) => {

  const chatId = message.chat.id;
  _chatId = chatId;

  var seconds = interval / 1000;
  var minutes = seconds / 60;

  var reply = 'Current timer (minutes): ' + minutes + '\n';
  reply += 'Current timer (seconds): ' + seconds;

  bot.sendMessage(chatId, reply);
});

setInterval(() => {

  client.connect();

  var reply = '';
  if (lastPrice < minPrice && lastPrice !== 0) {

    reply = 'Price went below USD' + minPrice + '\n';
    maxPrice = minPrice;
    minPrice -= 100;
  } else if (lastPrice > maxPrice && lastPrice !== 0) {

    reply = 'Price went over USD' + maxPrice + '\n';
    minPrice = maxPrice;
    maxPrice += 100;
  }
  reply += 'BTC/USD: ' + lastPrice;
  bot.sendMessage(_chatId, reply);
}, interval);

client.onConnect(() => {
  setTimeout(() => {
    client.disconnect();
  }, 10000);
});

client.onMarketUpdate(marketData => {
  marketData.trades.forEach(object => {
    lastPrice = object.price;
  });
});

client.onError(err => {
  console.error(err);
});