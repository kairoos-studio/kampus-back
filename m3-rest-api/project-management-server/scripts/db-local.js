// MongoDB local para desenvolvimento, sem instalar nada no sistema.
// Usa o binário descarregado pelo mongodb-memory-server e guarda os dados em .mongo-data/.
const path = require("path");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server");

const port = Number(process.env.MONGO_PORT || 27017);
const dbPath = path.join(__dirname, "..", ".mongo-data");

(async () => {
  fs.mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { port, dbPath, storageEngine: "wiredTiger" },
  });
  console.log(`MongoDB local em ${server.getUri()} (dados em ${dbPath})`);
  console.log("Ctrl+C para parar.");

  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
})();
