const express = require('express');
const Database = require('./database');

const app = express();
const port = 3002;
const database = new Database();

// Middleware for parsing JSON requests
app.use(express.json());

console.log('Starting server setup...');

app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

// Get all mood entries
app.get('/api/entries', async (req, res) => {
  try {
    console.log('GET /api/entries called');
    const entries = await database.getAllEntries();
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Create a new mood entry
app.post('/api/entries', async (req, res) => {
  try {
    console.log('POST /api/entries called with data:', req.body);
    const { entry_date, koko_mood, momo_mood, komo_score, note } = req.body;
    
    // Basic validation
    if (!entry_date) {
      return res.status(400).json({ error: 'entry_date is required' });
    }
    
    const newEntry = await database.insertEntry({
      entry_date,
      koko_mood,
      momo_mood,
      komo_score,
      note
    });
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Entry for this date already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

console.log('Routes configured...');

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await database.initialize();
    console.log('Database initialized successfully');
    
    const server = app.listen(port, () => {
      console.log(`Backend server listening at http://localhost:${port}`);
      console.log('Server is ready to accept connections');
    });

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      database.close();
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


