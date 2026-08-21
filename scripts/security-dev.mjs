import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

const npmExecutable = process.env.npm_execpath;
if (!npmExecutable) {
  throw new Error("Run this helper through npm: npm run dev:secure");
}

const npxCli = join(dirname(npmExecutable), "npx-cli.js");
const child = spawn(
  process.execPath,
  [
    npxCli,
    "--yes",
    "vercel@latest",
    "dev",
    "--local-config",
    "vercel.dev.json",
    "--listen",
    "127.0.0.1:3000",
    "--yes",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WISHES_STORAGE_MODE: "mock",
      WISHES_ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      VITE_WISHES_API_URL: "/api/wishes",
    },
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
