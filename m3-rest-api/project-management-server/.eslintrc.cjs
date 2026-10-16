module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "script" },
  ignorePatterns: ["node_modules", ".mongo-data"],
  rules: {
    // Código de 2023 com imports e parâmetros por usar; não se altera nesta fase.
    "no-unused-vars": "warn",
    // Indentação mista em models/User.model.js (estilo, sem efeito).
    "no-mixed-spaces-and-tabs": "off",
  },
};
