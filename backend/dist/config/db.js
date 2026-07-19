"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoMemoryServer = null;
const connectDB = async () => {
    let mongoUri = process.env.MONGO_URI || '';
    if (!mongoUri) {
        console.log('No MONGO_URI specified in environment variables. Starting mongodb-memory-server...');
        mongoMemoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        mongoUri = mongoMemoryServer.getUri();
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log(`MongoDB Connected: ${mongoose_1.default.connection.host}`);
        // Trigger seeding if we are in memory
        if (mongoMemoryServer) {
            console.log('Running database seeding on the in-memory database...');
            const { seedDatabase } = await Promise.resolve().then(() => __importStar(require('../utils/seed')));
            await seedDatabase();
        }
        return mongoUri;
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const closeDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
        }
    }
    catch (err) {
        console.error('Error closing DB', err);
    }
};
exports.closeDB = closeDB;
