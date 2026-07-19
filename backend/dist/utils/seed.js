"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const PlasticRequest_1 = __importDefault(require("../models/PlasticRequest"));
const Reward_1 = __importDefault(require("../models/Reward"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Feedback_1 = __importDefault(require("../models/Feedback"));
const seedDatabase = async () => {
    try {
        // Clear all existing data
        await User_1.default.deleteMany({});
        await PlasticRequest_1.default.deleteMany({});
        await Reward_1.default.deleteMany({});
        await Notification_1.default.deleteMany({});
        await Feedback_1.default.deleteMany({});
        console.log('Old database collections cleared.');
        // Hash default password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('Password123', salt);
        // Create 4 main users (one of each role)
        const citizen = await User_1.default.create({
            name: 'Aarav Patel',
            email: 'citizen@ecocycle.com',
            password: hashedPassword,
            role: 'citizen',
            phoneNumber: '9876543210',
            address: 'Apt 402, Bandra Heights',
            city: 'Mumbai',
            area: 'Bandra',
            rewards: {
                points: 450,
                tier: 'Silver'
            },
            profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
        });
        const collector = await User_1.default.create({
            name: 'Rajesh Kumar',
            email: 'collector@ecocycle.com',
            password: hashedPassword,
            role: 'collector',
            phoneNumber: '9123456789',
            address: 'Colaba Transit Camp',
            city: 'Mumbai',
            area: 'Colaba',
            collectorDetails: {
                availability: true,
                earnings: 1200,
                completedJobsToday: 2
            },
            profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
        });
        const recycler = await User_1.default.create({
            name: 'GreenTech Recycling Center',
            email: 'recycler@ecocycle.com',
            password: hashedPassword,
            role: 'recycler',
            phoneNumber: '9988776655',
            address: 'Goregaon Industrial Estate',
            city: 'Mumbai',
            area: 'Goregaon',
            recyclerDetails: {
                facilityName: 'GreenTech Recyclers Mumbai',
                capacity: 15000
            },
            profilePicture: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&h=150&q=80'
        });
        const admin = await User_1.default.create({
            name: 'Esha Sharma',
            email: 'admin@ecocycle.com',
            password: hashedPassword,
            role: 'admin',
            phoneNumber: '9000000000',
            address: 'EcoCycle Headquarters, BKC',
            city: 'Mumbai',
            area: 'BKC',
            profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
        });
        // Create a secondary citizen for leaderboard variety
        const citizen2 = await User_1.default.create({
            name: 'Sunita Rao',
            email: 'sunita@ecocycle.com',
            password: hashedPassword,
            role: 'citizen',
            phoneNumber: '9888877777',
            address: '7C Sea Breeze Apartments',
            city: 'Mumbai',
            area: 'Juhu',
            rewards: {
                points: 1250,
                tier: 'Gold'
            },
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
        });
        // Create a secondary collector for leaderboard/admin view
        const collector2 = await User_1.default.create({
            name: 'Vikram Singh',
            email: 'collector2@ecocycle.com',
            password: hashedPassword,
            role: 'collector',
            phoneNumber: '9777766666',
            address: 'Andheri West Post',
            city: 'Mumbai',
            area: 'Andheri',
            collectorDetails: {
                availability: false,
                earnings: 350,
                completedJobsToday: 0
            },
            profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
        });
        console.log('Seed users created successfully.');
        // Seed Reward Points Transactions
        await Reward_1.default.create([
            { citizen: citizen._id, points: 200, type: 'credit', description: 'Initial recycling pickup reward (15kg PET)' },
            { citizen: citizen._id, points: 250, type: 'credit', description: 'Second collection pickup reward (20kg Containers)' },
            { citizen: citizen2._id, points: 500, type: 'credit', description: 'Large industrial plastic recycling collection (40kg)' },
            { citizen: citizen2._id, points: 750, type: 'credit', description: 'Monthly contributor bonus' }
        ]);
        // Seed Plastic Requests
        // 1. Pending Request (Citizen submitted, no collector assigned yet)
        const requestPending = await PlasticRequest_1.default.create({
            citizen: citizen._id,
            wasteCategory: 'Plastic Bottles',
            estimatedWeight: 8.5,
            pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
            location: {
                type: 'Point',
                coordinates: [72.8400, 19.0500], // Juhu/Bandra area
                address: 'Bandra Bandstand, Bandra West, Mumbai, 400050'
            },
            images: ['https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80'],
            status: 'pending',
            history: [{ status: 'pending', updatedBy: citizen._id, updatedAt: new Date() }]
        });
        // 2. Accepted Request (Collector assigned, on the way)
        const requestAccepted = await PlasticRequest_1.default.create({
            citizen: citizen2._id,
            wasteCategory: 'Food Packaging',
            estimatedWeight: 14,
            pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in future
            location: {
                type: 'Point',
                coordinates: [72.8633, 19.1136], // Andheri East
                address: 'Marol Pipeline, Andheri East, Mumbai, 400059'
            },
            images: ['https://images.unsplash.com/photo-1526951914846-7a95ebd693f9?auto=format&fit=crop&w=600&q=80'],
            status: 'accepted',
            collector: collector._id,
            history: [
                { status: 'pending', updatedBy: citizen2._id, updatedAt: new Date(Date.now() - 6 * 3600000) },
                { status: 'accepted', updatedBy: collector._id, updatedAt: new Date(Date.now() - 1 * 3600000) }
            ]
        });
        // 3. Picked Up Request (Collector uploaded proof, waiting for Recycler verification)
        const requestPickedUp = await PlasticRequest_1.default.create({
            citizen: citizen._id,
            wasteCategory: 'PET Bottles',
            estimatedWeight: 22,
            pickupDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in past
            location: {
                type: 'Point',
                coordinates: [72.8166, 19.0166], // Worli Sea Face
                address: 'Worli Koliwada, Worli, Mumbai, 400030'
            },
            images: ['https://images.unsplash.com/photo-1595278069441-2cf29f8db310?auto=format&fit=crop&w=600&q=80'],
            status: 'picked_up',
            collector: collector._id,
            recyclingCenter: recycler._id,
            pickupProofImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
            history: [
                { status: 'pending', updatedBy: citizen._id, updatedAt: new Date(Date.now() - 12 * 3600000) },
                { status: 'accepted', updatedBy: collector._id, updatedAt: new Date(Date.now() - 10 * 3600000) },
                { status: 'picked_up', updatedBy: collector._id, updatedAt: new Date(Date.now() - 2 * 3600000) }
            ]
        });
        // 4. Recycled Request (Completed, reward points credited, feedback given)
        const requestRecycled = await PlasticRequest_1.default.create({
            citizen: citizen._id,
            wasteCategory: 'Mixed Plastic',
            estimatedWeight: 18.5,
            pickupDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days in past
            location: {
                type: 'Point',
                coordinates: [72.8777, 19.0760], // Kurla/Central
                address: 'Kurla Station Road, Kurla, Mumbai, 400070'
            },
            images: ['https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80'],
            status: 'recycled',
            collector: collector._id,
            recyclingCenter: recycler._id,
            pickupProofImage: 'https://images.unsplash.com/photo-1591193686104-fddbaafeb55f?auto=format&fit=crop&w=600&q=80',
            feedbackRating: 5,
            feedbackComment: 'Excellent and very prompt pickup! Rajesh was extremely polite.',
            history: [
                { status: 'pending', updatedBy: citizen._id, updatedAt: new Date(Date.now() - 4 * 24 * 3600000) },
                { status: 'accepted', updatedBy: collector._id, updatedAt: new Date(Date.now() - 3.8 * 24 * 3600000) },
                { status: 'picked_up', updatedBy: collector._id, updatedAt: new Date(Date.now() - 3.2 * 24 * 3600000) },
                { status: 'received', updatedBy: recycler._id, updatedAt: new Date(Date.now() - 3 * 24 * 3600000) },
                { status: 'recycled', updatedBy: recycler._id, updatedAt: new Date(Date.now() - 2.8 * 24 * 3600000) }
            ]
        });
        // Add Feedback entry corresponding to the completed request
        await Feedback_1.default.create({
            citizen: citizen._id,
            collector: collector._id,
            request: requestRecycled._id,
            rating: 5,
            comment: 'Excellent and very prompt pickup! Rajesh was extremely polite.'
        });
        // Seed Notifications
        await Notification_1.default.create([
            {
                user: citizen._id,
                title: 'Points Earned!',
                message: 'Congratulations! You earned 250 points for recycling 18.5kg of Mixed Plastic.',
                type: 'success',
                read: false
            },
            {
                user: collector._id,
                title: 'New Job Available',
                message: 'A new plastic waste collection request has been posted in Bandra West.',
                type: 'info',
                read: false
            },
            {
                user: recycler._id,
                title: 'Shipment Incoming',
                message: 'Collector Rajesh Kumar has picked up a waste shipment of 22kg and is bringing it to your facility.',
                type: 'info',
                read: false
            },
            {
                user: admin._id,
                title: 'Weekly Performance Report',
                message: 'GreenTech Recycling Center has reached 85% of its monthly plastic processing capacity.',
                type: 'info',
                read: true
            }
        ]);
        console.log('Sample database seeded with high fidelity mock data successfully.');
    }
    catch (error) {
        console.error('Seeding database failed:', error);
    }
};
exports.seedDatabase = seedDatabase;
// Executable when run directly (e.g. `npm run seed`)
if (require.main === module) {
    const runSeedDirectly = async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecocycle';
        console.log(`Running standalone database seeding tool on URI: ${mongoUri}`);
        await mongoose_1.default.connect(mongoUri);
        await (0, exports.seedDatabase)();
        await mongoose_1.default.connection.close();
        console.log('Seeding process complete. Closed connection.');
    };
    runSeedDirectly();
}
