import { createServer } from "vite";

const port = Number.parseInt(process.env.PORT || "5173", 10);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("Vercel supplied an invalid development port");
}

const server = await createServer({
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
  },
});

await server.listen();
server.printUrls();
