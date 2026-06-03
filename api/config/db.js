import mongoose from 'mongoose';

let cachedConnection = global.mongoose;

if (!cachedConnection) {
  cachedConnection = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    cachedConnection.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected Successfully');
      return mongooseInstance;
    });
  }

  try {
    cachedConnection.conn = await cachedConnection.promise;
  } catch (e) {
    cachedConnection.promise = null;
    throw e;
  }

  return cachedConnection.conn;
}

export default connectDB;
