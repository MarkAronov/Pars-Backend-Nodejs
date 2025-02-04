import mongoose from 'mongoose';

export const connectDatabase = async (uri: string): Promise<void> => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
};
