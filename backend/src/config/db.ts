import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  let mongoUri = process.env.MONGO_URI || '';

  if (!mongoUri) {
    console.log('No MONGO_URI specified in environment variables. Starting mongodb-memory-server...');
    mongoMemoryServer = await MongoMemoryServer.create();
    mongoUri = mongoMemoryServer.getUri();
  }

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Trigger seeding if we are in memory
    if (mongoMemoryServer) {
      console.log('Running database seeding on the in-memory database...');
      const { seedDatabase } = await import('../utils/seed');
      await seedDatabase();
    }
    
    return mongoUri;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('Error closing DB', err);
  }
};
