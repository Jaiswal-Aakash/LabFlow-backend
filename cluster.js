const cluster = require("cluster");
const os = require("os");
const dotenv = require("dotenv");

dotenv.config();

const workers = Number(process.env.CLUSTER_WORKERS) || os.cpus().length;
const maxWorkers = Math.min(workers, 4);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} starting ${maxWorkers} workers`);

  for (let i = 0; i < maxWorkers; i += 1) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code) => {
    console.warn(`Worker ${worker.process.pid} exited (${code}) — restarting`);
    cluster.fork();
  });
} else {
  require("./server");
}
