const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();

// ✅ express.json() をここでは使わない（削除または後ろに）
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(config);

// CSVから飲食店情報を読み込み
let restaurants = [];
fs.createReadStream('oimachi_restaurants.csv')
  .pipe(csv())
  .on('data', (row) => {
    restaurants.push(row);
  })
  .on('end', () => {
    console.log('CSV読み込み完了！');
  });

// ✅ LINE middleware を先に通す！
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  if (!events.length) return res.status(200).end();

  await Promise.all(events.map(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const userText = event.message.text.trim();
    const matched = restaurants.find(r => userText.includes(r["店名"]));

    let replyText = "そのお店の情報はありません。勉強しておきます。";
    if (matched) {
      replyText =
        `【${matched["店名"]}】\n` +
        `ジャンル：${matched["ジャンル"]}\n` +
        `住所：${matched["住所"]}\n` +
        `電話：${matched["電話番号"]}\n` +
        `営業時間：${matched["営業時間"]}\n` +
        `定休日：${matched["定休日"]}\n` +
        `Webサイト：${matched["Web URL"]}`;
    }

    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText,
    });
  }));

  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
