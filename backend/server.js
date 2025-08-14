const express = require('express');
const Database = require('./database');

const app = express();
const port = 3001;
const database = new Database();

console.log('Starting server setup...');

app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
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

// Keep the process alive
process.stdin.resume();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


