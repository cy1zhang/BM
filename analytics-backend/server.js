// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
const MongoClient = require('mongodb').MongoClient;
// Replace this with your MongoDB connection string
// If running MongoDB locally, use: "mongodb://localhost:27017"
const uri = "mongodb://localhost:27017";
let db;

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db('ecommerce_analytics');
    console.log('Connected to Database');
  })
  .catch(error => {
    console.error('Database connection error:', error);
  });

// API endpoint for receiving interaction data
app.post('/analyze', async (req, res) => {
  try {
    const { interaction, nearbyElements, previousInteractions } = req.body;
    
    // Store the interaction data
    await db.collection('interactions').insertOne({
      ...interaction,
      timestamp: new Date(),
      sessionId: req.headers['x-session-id']
    });

    // Basic analysis example
    const analysis = {
      suggestedAction: 'show_help',
      helpContent: 'Need help finding something?',
      suggestions: []
    };
    
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});