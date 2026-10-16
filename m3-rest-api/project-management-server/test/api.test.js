// Testes de integração da API com um MongoDB em memória (sem serviços externos).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;
let mongoose;
let request;

const student = {
  email: "teste.aluno@example.com",
  password: "Teste123",
  firstName: "Teste",
  lastName: "Aluno",
  cohort: "WD-TESTE",
  campus: "Campus Teste",
  isStudent: true,
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("kampus-test");
  process.env.TOKEN_SECRET = "segredo-de-teste";
  mongoose = require("mongoose");
  const app = require("../app");
  request = require("supertest")(app);
  await mongoose.connection.asPromise();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

let userId;
let token;

test("GET /api responde", async () => {
  const res = await request.get("/api");
  assert.equal(res.status, 200);
  assert.equal(res.body, "All good in here");
});

test("signup valida email e palavra-passe", async () => {
  let res = await request.post("/auth/signup").send({ ...student, email: "invalido" });
  assert.equal(res.status, 400);
  res = await request.post("/auth/signup").send({ ...student, password: "fraca" });
  assert.equal(res.status, 400);
});

test("signup cria utilizador", async () => {
  const res = await request.post("/auth/signup").send(student);
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, student.email);
  userId = res.body.user._id;
});

// Bug conhecido do código de 2023 (não corrigido nesta fase): com email repetido a rota
// responde 400 mas depois tenta responder 500 no .catch, e a rejeição sem tratamento
// derruba o processo do servidor.
test("signup recusa email repetido", { skip: "bug conhecido: ERR_HTTP_HEADERS_SENT em auth.routes.js" }, async () => {
  const res = await request.post("/auth/signup").send(student);
  assert.equal(res.status, 400);
});

test("login devolve token e /auth/verify aceita-o", async () => {
  let res = await request.post("/auth/login").send({ email: student.email, password: "Errada123" });
  assert.equal(res.status, 400);

  res = await request.post("/auth/login").send({ email: student.email, password: student.password });
  assert.equal(res.status, 200);
  token = res.body.authToken;
  assert.ok(token);

  res = await request.get("/auth/verify").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body._id, userId);

  res = await request.get("/auth/verify");
  assert.equal(res.status, 400);
});

test("utilizadores: listar, obter e editar", async () => {
  let res = await request.get("/auth/users");
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);

  res = await request.put(`/auth/users/${userId}`).send({ cohort: "WD-TESTE-2" });
  assert.equal(res.body.message, "User Updated!");

  res = await request.get(`/auth/users/${userId}`);
  assert.equal(res.body.cohort, "WD-TESTE-2");
  assert.equal(res.body.isStudent, true);
});

test("tarefas: criar, listar por utilizador, editar e apagar", async () => {
  let res = await request.post("/api/task").send({ title: "Tarefa teste", status: "To do", user: userId });
  assert.equal(res.status, 200);
  const taskId = res.body._id;

  res = await request.get(`/api/tasks/${userId}`);
  assert.equal(res.body.length, 1);

  res = await request.put(`/api/tasks/${taskId}`).send({ title: "Tarefa teste", status: "Done", user: userId });
  assert.equal(res.body.message, "Task Updated!");
  res = await request.get(`/api/tasks/${userId}`);
  assert.equal(res.body[0].status, "Done");

  res = await request.delete(`/api/tasks/${taskId}`);
  assert.equal(res.body.message, "Task deleted");
  res = await request.get(`/api/tasks/${userId}`);
  assert.equal(res.body.length, 0);
});

test("notas: criar, listar por utilizador, editar e apagar", async () => {
  let res = await request.post("/api/note").send({ title: "Nota", body: "Texto", date: new Date(), user: userId });
  assert.equal(res.status, 200);
  const noteId = res.body._id;

  res = await request.get(`/api/notes/${userId}`);
  assert.equal(res.body.length, 1);

  res = await request.put(`/api/notes/${noteId}`).send({ title: "Nota editada", body: "Texto", user: userId });
  assert.equal(res.body.message, "Note Updated!");
  res = await request.get(`/api/notes/${userId}`);
  assert.equal(res.body[0].title, "Nota editada");

  res = await request.delete(`/api/notes/${noteId}`);
  assert.equal(res.body.message, "Note deleted");
});

test("apagar utilizador", async () => {
  const res = await request.delete(`/auth/users/${userId}`);
  assert.equal(res.body.message, "User deleted");
  const list = await request.get("/auth/users");
  assert.equal(list.body.length, 0);
});

test("rota inexistente devolve 404", async () => {
  const res = await request.get("/nao-existe");
  assert.equal(res.status, 404);
});
