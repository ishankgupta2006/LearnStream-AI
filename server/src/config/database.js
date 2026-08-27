const mongoose = require('mongoose');

// By default, Mongoose "buffers" any database operation attempted while
// disconnected - it just silently waits (with no error, no timeout, no log)
// until the connection comes back. If the connection never fully recovers
// after a brief network drop, an in-progress operation (like saving job
// progress mid-video-processing) can hang forever with zero indication of
// what's wrong. Disabling this makes operations fail fast and loudly
// instead, so a dropped connection surfaces as a clear error rather than a
// silent, permanent hang.
mongoose.set('bufferCommands', false);

const connectDB = async (retries = 5) => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('✓ MongoDB already connected');
    return mongoose.connection;
  }

  // Log connection state changes so a mid-session drop/reconnect is visible
  // in the console instead of silently causing hangs elsewhere.
  mongoose.connection.on('disconnected', () => {
    console.error('✗ MongoDB disconnected - will attempt to reconnect automatically');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('✓ MongoDB reconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('✗ MongoDB connection error:', err.message);
  });

  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        // Detect a dropped connection faster (default is 10s) so
        // Mongoose's driver-level reconnect logic kicks in sooner.
        heartbeatFrequencyMS: 5000,
      });
      console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`✗ MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`  Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('✗ Failed to connect to MongoDB after all retries');
        throw new Error('Database connection failed: ' + error.message);
      }
    }
  }
};

module.exports = connectDB;
