// Set up mongoose connection
import mongoose from 'mongoose';

export const connect = () => {
  mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('strictQuery', true);
  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
};
