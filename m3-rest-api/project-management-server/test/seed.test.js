// O seed cria contas fictícias com que se consegue fazer login.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { seed, PASSWORD } = require("../scripts/seed");
const User = require("../models/User.model");
const Task = require("../models/Task.model");
const Note = require("../models/Note.model");

test("seed cria staff, alunos, tarefas e notas fictícios", async () => {
  const mongo = await MongoMemoryServer.create();
  try {
    await seed(mongo.getUri("kampus-seed"));
    // Correr duas vezes não duplica dados.
    await mongoose.disconnect();
    await seed(mongo.getUri("kampus-seed"));

    const users = await User.find();
    assert.equal(users.length, 6);
    assert.ok(users.every((u) => u.email.endsWith("@example.com")));
    assert.equal(users.filter((u) => u.isStudent).length, 3);

    const staff = await User.findOne({ email: "staff@example.com" });
    assert.ok(bcrypt.compareSync(PASSWORD, staff.password));

    assert.equal(await Task.countDocuments(), 9);
    assert.equal(await Note.countDocuments(), 6);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
