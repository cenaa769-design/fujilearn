// api/nekosensei.js

export default async function handler(req, res) {
  // 1. SECURITY CHECK: Only allow POST requests. 
  // This prevents people from just typing the URL in their browser to trigger it.
  if (req.method !== 'POST') {
    // We also add CORS headers here so your frontend is allowed to talk to this backend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. EXTRACT THE MESSAGE: Get the text the user typed from the request body
  const { message } = req.body;

  // 3. THE VAULT: Get the API key from Vercel's secure environment variables.
  // It is NOT written in this file. It is injected securely by Vercel when the app runs.
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
              // 5. THE PERSONALITY (System Prompt): 
              // We tell the AI exactly how to behave before it even sees the user's message.
              text: `You are Neko Sensei, a friendly, encouraging, and knowledgeable Japanese language teacher. You occasionally end sentences with "nyaa" 🐾 or use cat emojis. Keep your answers concise, helpful, and tailored to a beginner/intermediate Japanese learner. If the user asks something completely unrelated to Japanese learning, gently steer them back to studying, nyaa! The user asked: ${message}`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    // 6. RETURN THE ANSWER: Extract the text from Gemini's complex response and send it back to your frontend.
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Add CORS headers to the successful response too
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