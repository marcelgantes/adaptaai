export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Remove imagens — só texto por enquanto
    const mensagensLimpas = messages.map(m => ({
      ...m,
      content: Array.isArray(m.content)
        ? m.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
        : m.content
    }));

    // ── Tentativa 1: Groq ──────────────────────
    if (process.env.GROQ_API_KEY) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: mensagensLimpas,
          max_tokens: 2000,
          temperature: 0.7
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const text = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ content: [{ type: 'text', text }] });
      }

      const groqError = await groqRes.text();
      const isRate = groqRes.status === 429 || groqError.includes('rate');

      // Se não for rate limit, tenta Gemini
      if (!isRate) {
        console.error('Groq error:', groqRes.status, groqError);
      }
    }

    // ── Tentativa 2: Gemini ────────────────────
    if (process.env.GEMINI_API_KEY) {
      const geminiMessages = mensagensLimpas.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : '' }]
      }));

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
          }),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ content: [{ type: 'text', text }] });
      }

      const geminiError = await geminiRes.text();
      return res.status(geminiRes.status).json({
        error: `Gemini error: ${geminiRes.status}`,
        message: geminiError
      });
    }

    return res.status(503).json({
      error: 'Nenhuma API disponível. Configure GROQ_API_KEY ou GEMINI_API_KEY.'
    });

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
