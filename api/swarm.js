import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (Ensure GEMINI_API_KEY is set in Vercel env variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { chatInput } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      ACT AS: SCORPIO ENTERPRISE AI SWARM.
      TASK: Analyze the input and generate 6 distinct technical reports.
      INPUT: "${chatInput}"
      
      OUTPUT FORMAT: JSON Array of 6 objects. 
      Example: [{"text": "Audit complete..."}, {"text": "IP verified..."}]
      
      Ensure tone is military-grade, technical, and precise.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean raw text to ensure valid JSON
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanJson));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Neural Link Severed", details: error.message });
  }
}