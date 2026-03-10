/**
 * Serverless function for Vercel: /api/chat
 * 
 * This function acts as a secure proxy between the frontend and the Google Gemini API.
 * The frontend sends requests to this endpoint instead of calling the Gemini API directly,
 * preventing CORS issues and keeping the API key secure on the server side.
 * 
 * Request body:
 * {
 *   "messages": [{ "role": "user", "content": "..." }],
 *   "system": "optional system prompt"
 * }
 * 
 * Response (converted to Anthropic-compatible format):
 * {
 *   "content": [{ "type": "text", "text": "..." }],
 *   "usage": { "input_tokens": 123, "output_tokens": 456 }
 * }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    // Get the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Convert messages from Anthropic format to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Build the request body for Google Gemini API
    const geminiRequest = {
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    };

    // Add system prompt if provided
    if (system) {
      geminiRequest.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    // Call the Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      }
    );

    // Check if the response is OK
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return res.status(geminiResponse.status).json({
        error: 'Error calling Gemini API',
        details: errorData,
      });
    }

    // Parse the response from Gemini
    const data = await geminiResponse.json();

    // Convert Gemini response to Anthropic-compatible format
    // This ensures the frontend doesn't need to change its response parsing logic
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const convertedResponse = {
      content: [
        {
          type: 'text',
          text: responseText,
        }
      ],
      usage: {
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      }
    };

    // Return the converted response to the frontend
    return res.status(200).json(convertedResponse);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
