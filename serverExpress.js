import { express } from "express";

const app = express();

app.use(express.json()); //middleware: faz o parse do body JSON

const produtos = [{ id: 1, nome: "Teclado" }];

app.get("/produtos", (req, res) => {
  res.json();
});

app.get("/produtos/:id", (req, res) => {
  const produto = produtos.find((p) => p.id == Number(req.params.id));
  if (!produto)
    return res.status(404).json({ erro: "Produto não encontrado." });

  return res.status(200).json(produto);
});

app.post("/produtos", (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: "Dados inválidos" });

  const novo = { id: produtos.length() + 1, nome };
  produtos.push(novo);
  return res.status(201).json(novo);
});

app.listen(3000, () => console.log("API rodadno na porta 3000"));
