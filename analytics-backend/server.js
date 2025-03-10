const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const morgan = require('morgan');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import Gemini
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

let db;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('ecommerce_analytics');
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Could not connect to MongoDB Atlas:', error);
    process.exit(1);
  }
}

// API endpoint for receiving interaction data
app.post('/analyze', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database connection not established' 
      });
    }

    const { interaction, nearbyElements, previousInteractions } = req.body;

    if (!interaction) {
      return res.status(400).json({ 
        error: 'Missing required field: interaction' 
      });
    }

    // Store the interaction data
    await db.collection('interactions').insertOne({
      ...interaction,
      timestamp: new Date(),
      sessionId: req.headers['x-session-id'] || 'anonymous',
      createdAt: new Date()
    });

    // Simple analysis example
    const analysis = {
      suggestedAction: 'show_help',
      helpContent: 'Need help finding something?',
      suggestions: []
    };

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// API endpoint for AI agent
app.post('/api/ask', async (req, res) => {
  try {
    const { query } = req.body;

    // Use Gemini to generate a response
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(query);
    const response = await result.response;
    const answer = response.text();

    res.json({ answer });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ 
      error: 'AI failed to generate a response',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: db ? 'connected' : 'disconnected'
  });
});

// Connect to database and start server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);