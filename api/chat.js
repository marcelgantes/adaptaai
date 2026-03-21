export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request body' });

    // Detecta se a mensagem contém imagem
    const temImagem = messages.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    // Usa modelo com visão se tiver imagem, senão usa o modelo padrão
    const modelo = temImagem
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelo,
        messages,
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Se falhou com modelo de visão, tenta com modelo padrão
      if (temImagem) {
        const fallback = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages.map(m => ({
              ...m,
              content: Array.isArray(m.content)
                ? m.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
                : m.content
            })),
            max_tokens: 2000,
            temperature: 0.7
          }),
        });
        if (fallback.ok) {
          const fallbackData = await fallback.json();
          const text = fallbackData.choices?.[0]?.message?.content || '';
          return res.status(200).json({ content: [{ type: 'text', text }] });
        }
      }
      return res.status(response.status).json({ error: `Groq API error: ${response.status}`, message: errorText });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
