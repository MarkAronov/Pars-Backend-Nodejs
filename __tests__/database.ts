import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const connect = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const closeDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod?.stop();
  }
};

export const clearDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.syncIndexes();
};