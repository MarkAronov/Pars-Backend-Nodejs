// Set up mongoose connection
import mongoose from 'mongoose';

export const connect = () => {
  mongoose.set('strictQuery', true);
  mongoose.connect(process.env.MONGODB_URL);
  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
};
