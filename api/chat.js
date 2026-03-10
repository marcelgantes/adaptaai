/**
 * Serverless function for Vercel: /api/chat
 * 
 * This function acts as a secure proxy between the frontend and the Anthropic API.
 * The frontend sends requests to this endpoint instead of calling the Anthropic API directly,
 * preventing CORS issues and keeping the API key secure on the server side.
 * 
 * Request body:
 * {
 *   "messages": [{ "role": "user", "content": "..." }],
 *   "system": "optional system prompt"
 * }
 * 
 * Response:
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build the request body for Anthropic API
    const anthropicRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: messages,
    };

    // Add system prompt if provided
    if (system) {
      anthropicRequest.system = system;
    }

    // Call the Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicRequest),
    });

    // Check if the response is OK
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      console.error('Anthropic API error:', errorData);
      return res.status(anthropicResponse.status).json({
        error: 'Error calling Anthropic API',
        details: errorData,
      });
    }

    // Parse the response from Anthropic
    const data = await anthropicResponse.json();

    // Return the response to the frontend
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
