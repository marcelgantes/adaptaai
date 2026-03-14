export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { messages, system } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const groqRequest = {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages
      ]
    };
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(groqRequest)
    });
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error('Groq API error:', errorData);
      return res.status(groqResponse.status).json({
        error: 'Error calling Groq API',
        details: errorData
      });
    }
    const data = await groqResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({
      content: [{ type: 'text', text: responseText }],
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0
      }
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
