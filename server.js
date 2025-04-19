const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');

dotenv.config();

const app = express();

// Enable CORS for all origins temporarily (for debugging purposes)
app.use(cors({
  origin: '*', // Temporarily allow all origins
}));

app.use(bodyParser.json());

// Create the OpenAI API client properly
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Use environment variable, not hardcoded key
});
const openai = new OpenAIApi(configuration);

// API endpoint for code review
app.post('/api/review', async (req, res) => {
  const { code, language } = req.body;
  
  console.log('Received code for review:', code.substring(0, 100) + '...'); // Log for debugging (truncated)
  console.log('Language:', language);
  
  const systemMessage = {
    role: "system",
    content: `You are a code review assistant. Review the following ${language} code and return only a JSON object with:
    {
      "summary": "...",
      "issues": [
        {
          "severity": "critical/major/minor",
          "title": "...",
          "description": "...",
          "suggestion": "..."
        }
      ],
      "bestPractices": ["...", "..."],
      "improvementSuggestions": "..."
    }`
  };

  const userMessage = {
    role: "user",
    content: `\`\`\`${language}\n${code}\n\`\`\``
  };

  try {
    console.log('Sending request to OpenAI...');
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      temperature: 0.4,
    });

    const textResponse = response.data.choices[0].message.content;
    console.log('Received response from OpenAI:', textResponse.substring(0, 100) + '...');
    
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return res.json(JSON.parse(jsonMatch[0]));
    }

    res.status(400).json({ error: 'Could not parse GPT response.' });
  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to analyze code. Try again.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
});