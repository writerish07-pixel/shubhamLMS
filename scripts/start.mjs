import { spawn } from "node:child_process";

const port = process.env.PORT || "43147";
const child = spawn(
  process.execPath,
  [
    "./node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    String(port),
  ],
  { stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
