console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET);

const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(config);

const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  if (!events.length) return res.status(200).end();

  await Promise.all(events.map(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: event.message.text }],
      });

      const replyText = response.choices[0].message.content;

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    } catch (error) {
      console.error('ChatGPT error:', error);
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'エラーが発生しました。',
      });
    }
  }));

  res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
