import mongoose from 'mongoose';

export const connect = () => {
  mongoose.set('strictQuery', true);

  const mongoDBUrl = process.env['MONGODB_URL'];
  if (!mongoDBUrl) {
    console.error('MONGODB_URL is not defined in the environment variables');
    process.exit(1);
  }

  mongoose
    .connect(mongoDBUrl)
    .then(() => {
      console.log('Successfully connected to MongoDB database');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
};
