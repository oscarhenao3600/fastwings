
const { createWorker } = require('tesseract.js');
async function extractTextFromImage(path){ const worker = createWorker(); await worker.load(); await worker.loadLanguage('spa+eng'); await worker.initialize('spa+eng'); const { data:{text} } = await worker.recognize(path); await worker.terminate(); return text; }
module.exports = { extractTextFromImage };
