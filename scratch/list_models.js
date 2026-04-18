const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Manual .env parsing
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GOOGLE_API_KEY=(.*)/);
const GOOGLE_API_KEY = apiKeyMatch ? apiKeyMatch[1].trim().replace(/["']/g, '') : '';

async function run() {
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  
  try {
    const models = await genAI.listModels();
    console.log('Available Models:');
    for await (const model of models) {
      console.log(`- ${model.name} (Methods: ${model.supportedGenerationMethods.join(', ')})`);
    }
  } catch (err) {
    console.error('Failed to list models:', err.message);
  }
}

run();
