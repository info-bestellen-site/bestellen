const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  try {
    const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // This is just a test call to see if anything works
    console.log('Testing gemini-1.5-flash...');
    // We can't easily list models without a specific method, 
    // but we can try different names.
  } catch (e) {
    console.error(e.message);
  }
}

listModels();
