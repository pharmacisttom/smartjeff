import { startWorkerLoop, stopWorkerLoop } from "./event.worker";

process.on("SIGTERM", () => {
  console.log("[Worker] SIGTERM received. Initiating graceful shutdown...");
  stopWorkerLoop();
  setTimeout(() => process.exit(0), 1000);
});

process.on("SIGINT", () => {
  console.log("[Worker] SIGINT received. Initiating graceful shutdown...");
  stopWorkerLoop();
  setTimeout(() => process.exit(0), 1000);
});

if (require.main === module) {
  startWorkerLoop();
}

export { startWorkerLoop, stopWorkerLoop };
