import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using the environment variable MONGODB_URL.
 * Exits the process with a non-zero code if the connection fails or if the URL is not defined.
 */
export const connect = () => {
  mongoose.set('strictQuery', true);

  // Get the MongoDB connection URL from environment variables
  const mongoDBUrl = process.env['MONGODB_URL'];
  if (!mongoDBUrl) {
    console.error('MONGODB_URL is not defined in the environment variables');
    process.exit(1);
  }

  // Connect to MongoDB
  mongoose
    .connect(mongoDBUrl)
    .then(() => {
      console.log('Successfully connected to MongoDB database');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    });

  // Log MongoDB connection errors
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
};
