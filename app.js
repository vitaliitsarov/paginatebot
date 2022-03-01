const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config()

axios.defaults.baseURL = process.env.API_URL;
const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, {polling: true});


const getPagination = ( current, maxpage, data ) => {
  let keys = [];
  if (current == 1) keys.push({ text: `⛔️`, callback_data: 'prev'});
  if (current > 1) keys.push({ text: `⬅️`, callback_data: (current-1).toString() });
  keys.push({ text: `${current}/${maxpage}`, callback_data: current.toString() });
  if (current == maxpage) keys.push({ text: `⛔️`, callback_data: 'last' })
  if (current < maxpage) keys.push({ text: `➡️`, callback_data: (current + 1).toString() })

  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [ 
          [{ text: `🔗 Оформить займ`, url: data.cards.data[0].link }],
          keys 
        ],
    })
  };
}

const messageText = (data) => {
    const info = data.cards.data[0];
    const message = `💸ЗАЙМ НА ЛЮБЫЕ НУЖДЫ💸`+
    `\n\nДля Всех стран СНГ!🇷🇺🇺🇦🇰🇿 `+
    `\n\n📝Без справок!`+
    `\n🙋🏻‍♂️Без поручителей!`+
    `\n💰От ${info.amount} ${info.time}.`+
    `\n📃Только по паспорту! `+
    `\n🙌🏻 С ЛЮБОЙ кредитной историей!`+
    `\n💳Займ прямо на КАРТУ💳`+
    `\n\n\n👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻`
    return message
}

bot.onText(/\/start/, function(msg) {
    axios.get('api/cards')
        .then(function (response) {
            const { data } = response
            const messageEnter = Object.assign(
                {}, 
                getPagination(data.cards.from, data.cards.last_page, data), 
                { caption: messageText(data) }
            );
            bot.sendPhoto(msg.chat.id, data.cards.data[0].logo, messageEnter);
        })
        .catch(function (error) {
            console.log(error);
        })
});

bot.on('callback_query', function (message) {
    const msg = message.message;

    if(message.data == "prev") { 
        bot.answerCallbackQuery(message.id, { text: "Вы уже на первой странице!", show_alert: true })
        return;
    } else if(message.data == "last") {
        bot.answerCallbackQuery(message.id, { text: "Вы уже на последней странице!", show_alert: true })
        return;
    }

    axios.get('api/cards', {
        params: {
            page: parseInt(message.data)
        }
    }).then(function (response) {
        const { data } = response
        const editOptions = Object.assign(
            {}, 
            getPagination(parseInt(message.data), data.cards.last_page, data), 
            {
                chat_id: msg.chat.id, 
                message_id: msg.message_id,
            }
        );
        bot.editMessageMedia({ 
            type: "photo",
            media: data.cards.data[0].logo.toString(),
            caption: messageText(data)
        }, editOptions);
    }).catch(function (error) {
        console.log(error);
    })
});