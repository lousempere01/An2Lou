const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const envExamplePath = path.join(root, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('.env existe deja, rien a faire.');
  process.exit(0);
}

if (!fs.existsSync(envExamplePath)) {
  console.error('Fichier .env.example introuvable.');
  process.exit(1);
}

fs.copyFileSync(envExamplePath, envPath);
console.log('Fichier .env cree depuis .env.example');
console.log('Tu peux maintenant lancer: npm start');
