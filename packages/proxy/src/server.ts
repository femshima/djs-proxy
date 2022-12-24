import { proxyRequests } from '@discordjs/proxy';
import {
  Client,
  GatewayDispatchEvents,
  GatewayGuildCreateDispatchData,
  GatewayOpcodes,
  GatewayReadyDispatchData,
} from 'discord.js';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const server = http.createServer();
const wss = new WebSocketServer({ server });

export function setupServer(
  client: Client<true>,
  ready: GatewayReadyDispatchData,
  guilds: GatewayGuildCreateDispatchData[]
) {
  const proxy = proxyRequests(client.rest);

  let seq = 0;

  const sockets = new Set<WebSocket.WebSocket>();
  client.on('raw', (data) => {
    if (data.op !== GatewayOpcodes.Dispatch) return;
    console.log(data);
    for (const ws of sockets) {
      ws.send(
        JSON.stringify({
          op: GatewayOpcodes.Dispatch,
          s: seq++,
          t: data.t,
          d: data.d,
        })
      );
    }
  });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const d = JSON.parse(data.toString('utf-8')) as { op: number; d: object };
      switch (d.op) {
        case GatewayOpcodes.Heartbeat:
          ws.send(
            JSON.stringify({
              op: GatewayOpcodes.HeartbeatAck,
            })
          );
          break;
        case GatewayOpcodes.Identify:
          ws.send(
            JSON.stringify({
              op: GatewayOpcodes.Dispatch,
              s: seq++,
              t: GatewayDispatchEvents.Ready,
              d: {
                ...ready,
                resume_gateway_url: 'ws://localhost:3000/',
                shard: undefined,
                session_id: 'session_id_1',
              },
            })
          );
          for (const guild of guilds) {
            ws.send(
              JSON.stringify({
                op: GatewayOpcodes.Dispatch,
                s: seq++,
                t: GatewayDispatchEvents.GuildCreate,
                d: guild,
              })
            );
          }
          sockets.add(ws);
          break;
      }
    });
    ws.on('close', () => {
      sockets.delete(ws);
    });
    ws.send(
      JSON.stringify({
        op: GatewayOpcodes.Hello,
        d: {
          heartbeat_interval: 45000,
        },
      })
    );
  });

  server.on('request', async (req, res) => {
    if (req.url === '/api/v10/gateway/bot') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(
        JSON.stringify({
          url: 'ws://localhost:3000/',
          shards: 1,
          session_start_limit: {
            total: 1000,
            remaining: 999,
            reset_after: 14400000,
            max_concurrency: 1,
          },
        })
      );
      return;
    }
    proxy(req, res);
  });

  server.listen(3000);
}
