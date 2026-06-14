import { createServer } from "node:http";
import { parse } from "node:url";
import nextEnv from "@next/env";
import next from "next";
import { WebSocketServer } from "ws";
import { attachChatHandler } from "./src/server/websocket";

const dev = process.env.NODE_ENV !== "production";

// Load .env / .env.local into process.env before anything reads ANTHROPIC_API_KEY.
nextEnv.loadEnvConfig(process.cwd(), dev);

const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });

app.prepare().then(() => {
  const handle = app.getRequestHandler();
  const upgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "", true));
  });

  const wss = new WebSocketServer({ noServer: true });
  attachChatHandler(wss);

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "", true);

    if (pathname === "/api/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      // Let Next handle its own upgrades (e.g. HMR websocket in dev).
      upgradeHandler(req, socket, head);
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
