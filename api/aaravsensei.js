// api/aaravsensei.js (or whatever you named this file)

export default async function handler(req, res) {
  // 1. SECURITY CHECK: Only allow POST requests. 
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. EXTRACT THE MESSAGE: Get the text the user typed
  const { message } = req.body;

  // 3. THE VAULT: Get the API key from Vercel's secure environment variables.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on the server.' });
  }

  try {
    // 4. TALK TO GEMINI: We use the free, fast 'gemini-1.5-flash' model.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              // 5. THE PERSONALITY (System Prompt): Updated for Aarav Sensei
              text: `You are Aarav Sensei, a friendly, encouraging, and highly knowledgeable Japanese language teacher. Keep your answers concise, helpful, and tailored to a beginner/intermediate Japanese learner. Use encouraging emojis like 🎌, 📚, or ✨. If the user asks something completely unrelated to Japanese learning, gently steer them back to studying. The user asked: ${message}`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    // 6. RETURN THE ANSWER
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ response: aiResponse });
    } else {
      return res.status(500).json({ error: 'Unexpected response from AI' });
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Failed to get response from AI' });
  }
}