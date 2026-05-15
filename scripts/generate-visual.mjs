import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadLocalEnv() {
  const envPath = path.join(projectRoot, '.env.local');
  return fs.readFile(envPath, 'utf8')
    .then((raw) => {
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = value;
      });
    })
    .catch(() => {});
}

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return fallback;
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function usage() {
  console.log(`
Nano Banana local helper

Usage:
  npm run generate:visual -- --prompt "Premium app hero for MasterShopPro"

Options:
  --prompt   Prompt principal
  --aspect   16:9 | 9:16 | 1:1 | 4:5 | 3:4 | 3:2 | 21:9
  --size     1K | 2K | 4K
  --model    gemini-2.5-flash-image | gemini-3.1-flash-image-preview | gemini-3-pro-image-preview
  --out      Chemin de sortie

Env attendu:
  GEMINI_API_KEY ou GOOGLE_API_KEY dans .env.local
`);
}

await loadLocalEnv();

if (hasFlag('--help')) {
  usage();
  process.exit(0);
}

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('Aucune cle Gemini trouvee. Ajoute GEMINI_API_KEY dans .env.local puis relance la commande.');
  process.exit(1);
}

const prompt = getArg('--prompt', '');
if (!prompt) {
  console.error('Prompt manquant. Utilise --prompt "..."');
  process.exit(1);
}

const aspect = getArg('--aspect', '16:9');
const size = getArg('--size', '2K');
const model = getArg('--model', 'gemini-3.1-flash-image-preview');
const customOut = getArg('--out', '');

const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContent({
  model,
  contents: [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ],
  config: {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
    imageConfig: {
      aspectRatio: aspect,
      imageSize: size,
    },
  },
});

const parts = response?.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find((part) => part?.inlineData?.data);
const textPart = parts.find((part) => part?.text);

if (!imagePart?.inlineData?.data) {
  console.error('Gemini n a retourne aucune image.');
  if (textPart?.text) console.error(textPart.text);
  process.exit(1);
}

const mimeType = imagePart.inlineData.mimeType || 'image/png';
const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
const outputPath = customOut
  ? path.resolve(projectRoot, customOut)
  : path.join(projectRoot, 'public', 'generated', `nano-banana-${Date.now()}.${ext}`);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, Buffer.from(imagePart.inlineData.data, 'base64'));

console.log(`Image enregistree: ${outputPath}`);
if (textPart?.text) {
  console.log('\nNotes Gemini:');
  console.log(textPart.text);
}
