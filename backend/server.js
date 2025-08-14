const express = require('express');
const app = express();
const port = 3001;

console.log('Starting server setup...');

app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

console.log('Routes configured...');

const server = app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log('Server is ready to accept connections');
});

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

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
