import {
  Client,
  Collection,
  GatewayDispatchEvents,
  GatewayGuildCreateDispatchData,
  GatewayIntentBits,
  GatewayOpcodes,
  GatewayReadyDispatchData,
} from 'discord.js';
import dotenv from 'dotenv';
import { setupServer } from './server';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});
dotenv.config();

let ready: GatewayReadyDispatchData | undefined;
const guilds = new Collection<string, GatewayGuildCreateDispatchData>();
client.on('raw', (data) => {
  if (data.op !== GatewayOpcodes.Dispatch) return;
  switch (data.t) {
    case GatewayDispatchEvents.Ready:
      ready = data.d;
      break;
    case GatewayDispatchEvents.GuildCreate:
      guilds.set(data.d.id, data.d);
      break;
    case GatewayDispatchEvents.GuildUpdate:
      guilds.set(data.d.id, data.d);
      break;
    case GatewayDispatchEvents.GuildDelete:
      guilds.delete(data.d.id);
      break;
  }
});

client
  .login(process.env['DISCORD_TOKEN'])
  .then(() => setupServer(client, ready!, guilds));
