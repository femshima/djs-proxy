import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  rest: {
    api: 'http://localhost:3000/api',
  },
});
dotenv.config();

console.log('connecting...');

// client.on('debug',console.error);

client.on('messageCreate', async (message) => {
  console.log(message.content);
  if (message.author.id === message.client.user.id) return;
  await message.reply('Ok');
});

client.login('Discord.js.Japan').then(() => console.log('connected'));
