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
  { firstName: "Ana", lastName: "Exemplo", email: "staff@example.com", role: "Campus Manager" },
  { firstName: "Bruno", lastName: "Ficticio", email: "bruno.staff@example.com", role: "Teacher" },
  { firstName: "Carla", lastName: "Teste", email: "carla.staff@example.com", role: "Career Services" },
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

async function seed(uri) {
  await mongoose.connect(uri);
  await Promise.all([User.deleteMany({}), Task.deleteMany({}), Note.deleteMany({})]);

  const password = bcrypt.hashSync(PASSWORD, 10);
  await User.create(staff.map((u) => ({ ...u, ...common, password, isStudent: false })));
  const createdStudents = await User.create(
    students.map((u) => ({ ...u, ...common, password, role: "Student", isStudent: true }))
  );

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  for (const student of createdStudents) {
    // Task.user é String no modelo original; Note.user é ObjectId.
    await Task.create([
      { title: "Ler o guia de boas-vindas (exemplo)", deadline: new Date(now + 2 * day), status: "To do", user: String(student._id) },
      { title: "Configurar o portátil (exemplo)", deadline: new Date(now + 5 * day), status: "To do", user: String(student._id) },
      { title: "Visita virtual ao campus (exemplo)", deadline: new Date(now - day), status: "Done", user: String(student._id) },
    ]);
    await Note.create([
      { title: "Aula 1 (exemplo)", body: "Notas fictícias da primeira aula.", date: new Date(now - 2 * day), user: student._id },
      { title: "Ideias de projeto (exemplo)", body: "Lista fictícia de ideias.", date: new Date(now - day), user: student._id },
    ]);
  }

  console.log(`Seed concluído: ${staff.length} staff, ${students.length} alunos, palavra-passe "${PASSWORD}".`);
}

module.exports = { seed, PASSWORD };

if (require.main === module) {
  seed(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kampus")
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error(err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
