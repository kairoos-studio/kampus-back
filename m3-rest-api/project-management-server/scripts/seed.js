// Popula a base de dados local com dados fictícios.
// Uso: npm run seed  (lê MONGODB_URI do .env; apaga os dados existentes).
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");
const Task = require("../models/Task.model");
const Note = require("../models/Note.model");

// Palavra-passe comum a todas as contas de teste (cumpre a regra do signup).
const PASSWORD = "Kampus123";

const staff = [
  { firstName: "Ana", lastName: "Exemplo", email: "staff@example.com", role: "[POR CONFIRMAR: cargo]" },
  { firstName: "Bruno", lastName: "Ficticio", email: "bruno.staff@example.com", role: "[POR CONFIRMAR: cargo]" },
  { firstName: "Carla", lastName: "Teste", email: "carla.staff@example.com", role: "[POR CONFIRMAR: cargo]" },
];

const students = [
  { firstName: "Diana", lastName: "Aluna", email: "aluno@example.com" },
  { firstName: "Eduardo", lastName: "Exemplo", email: "eduardo.aluno@example.com" },
  { firstName: "Filipa", lastName: "Ficticia", email: "filipa.aluna@example.com" },
];

const common = {
  cohort: "WD-2023-EXEMPLO",
  campus: "Campus Exemplo",
  manager: "Ana Exemplo",
  teacher: "Bruno Ficticio",
};

// O seed apaga utilizadores, tarefas e notas: só corre contra um MongoDB nesta máquina
// e numa base de demonstração dedicada ("kampus" ou "kampus-<sufixo>").
const HOSTS_LOCAIS = ["127.0.0.1", "localhost", "[::1]"];
const BASE_DEMO = /^kampus(-[a-z0-9]+)*$/;
const COLECOES_DO_SEED = ["users", "tasks", "notes"];

function recusar(motivo) {
  throw new Error(`Seed recusado: ${motivo}. Nada foi apagado.`);
}

function assertDestinoLocal(uri) {
  const match = /^mongodb:\/\/(?:[^@/]*@)?([^/?]+)(?:\/([^?]*))?/.exec(uri || "");
  const hosts = match ? match[1].split(",").map((h) => h.replace(/:\d+$/, "")) : [];
  if (!hosts.length || !hosts.every((h) => HOSTS_LOCAIS.includes(h))) {
    recusar("MONGODB_URI tem de apontar para um MongoDB local (mongodb://127.0.0.1 ou mongodb://localhost)");
  }
  const base = match[2] || "";
  if (!BASE_DEMO.test(base)) {
    recusar(`a base "${base}" não é uma base de demonstração (usar "kampus" ou "kampus-<sufixo>")`);
  }
}

async function seed(uri, { agora = Date.now() } = {}) {
  assertDestinoLocal(uri);
  await mongoose.connect(uri);
  // Segunda barreira: a base só pode ter as coleções que o próprio seed cria.
  const existentes = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
  const estranhas = existentes.filter((c) => !COLECOES_DO_SEED.includes(c));
  if (estranhas.length) {
    await mongoose.disconnect();
    recusar(`a base tem coleções que não são do Kampus (${estranhas.join(", ")})`);
  }
  await Promise.all([User.deleteMany({}), Task.deleteMany({}), Note.deleteMany({})]);

  const password = bcrypt.hashSync(PASSWORD, 10);
  await User.insertMany(staff.map((u) => ({ ...u, ...common, password, isStudent: false })));
  const createdStudents = await User.insertMany(
    students.map((u) => ({ ...u, ...common, password, isStudent: true }))
  );

  const now = agora;
  const day = 24 * 60 * 60 * 1000;
  for (const student of createdStudents) {
    // Task.user é String no modelo original; Note.user é ObjectId.
    await Task.insertMany([
      { title: "Ler o guia de boas-vindas (exemplo)", deadline: new Date(now + 2 * day), status: "To do", user: String(student._id) },
      { title: "Configurar o portátil (exemplo)", deadline: new Date(now + 5 * day), status: "To do", user: String(student._id) },
      { title: "Visita virtual ao campus (exemplo)", deadline: new Date(now - day), status: "Done", user: String(student._id) },
    ]);
    await Note.insertMany([
      { title: "Aula 1 (exemplo)", body: "Notas fictícias da primeira aula.", date: new Date(now - 2 * day), user: student._id },
      { title: "Ideias de projeto (exemplo)", body: "Lista fictícia de ideias.", date: new Date(now - day), user: student._id },
    ]);
  }

  console.log(`Seed concluído: ${staff.length} staff, ${students.length} alunos, palavra-passe "${PASSWORD}".`);
}

module.exports = { seed, assertDestinoLocal, PASSWORD };

if (require.main === module) {
  // SEED_DATE (opcional, ISO) fixa a data base das tarefas e notas, para prints reprodutíveis.
  const agora = process.env.SEED_DATE ? Date.parse(process.env.SEED_DATE) : Date.now();
  if (Number.isNaN(agora)) {
    console.error("SEED_DATE inválida");
    process.exit(1);
  }
  seed(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kampus", { agora })
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error(err.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}
