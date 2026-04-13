const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { incomes: [], expenses: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { incomes: [], expenses: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/data', (req, res) => {
  res.json(readDb());
});

app.post('/api/data', (req, res) => {
  writeDb(req.body);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n✅  API rodando em http://localhost:${PORT}\n`);
});
