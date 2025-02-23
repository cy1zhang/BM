const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Replace this with your actual connection string from MongoDB Atlas
// It should look something like:
// mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
const uri = "mongodb+srv://alexcy1zhang:t4ywplVLi5FnE5BN@cluster0.edqkg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('ecommerce_analytics');
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Could not connect to MongoDB Atlas:', error);
  }
}

// Connect to database when server starts
connectToDatabase();

// API endpoint for receiving interaction data
app.post('/analyze', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database connection not established' 
      });
    }

    const { interaction, nearbyElements, previousInteractions } = req.body;
    
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: db ? 'connected' : 'disconnected'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});