"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectorStats = exports.pickupJob = exports.rejectJob = exports.acceptJob = exports.listPendingJobs = exports.toggleAvailability = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlasticRequest_1 = __importDefault(require("../models/PlasticRequest"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const cloudinary_1 = require("../config/cloudinary");
const mailer_1 = require("../config/mailer");
// @desc    Toggle collector availability status
// @route   PUT /api/collector/availability
// @access  Private (Collector)
const toggleAvailability = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'collector') {
            return res.status(403).json({ message: 'Only collectors can toggle availability.' });
        }
        const { availability } = req.body;
        if (availability === undefined) {
            return res.status(400).json({ message: 'Availability boolean value required.' });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'Collector not found.' });
        user.collectorDetails.availability = availability;
        await user.save();
        res.json({
            message: `Availability status updated to ${availability ? 'ACTIVE' : 'INACTIVE'}.`,
            availability: user.collectorDetails.availability
        });
    }
    catch (error) {
        console.error('Toggle Availability Error:', error);
        res.status(500).json({ message: 'Server error updating availability.', error: error.message });
    }
};
exports.toggleAvailability = toggleAvailability;
// @desc    List all nearby/pending pickup requests
// @route   GET /api/collector/jobs/pending
// @access  Private (Collector)
const listPendingJobs = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'collector') {
            return res.status(403).json({ message: 'Access denied.' });
        }
        // Filter optionally by city/area
        const { city, area, wasteCategory } = req.query;
        const filterQuery = { status: 'pending' };
        if (city)
            filterQuery['city'] = city;
        // We can filter by location address keywords
        if (area) {
            filterQuery['location.address'] = { $regex: area, $options: 'i' };
        }
        if (wasteCategory)
            filterQuery['wasteCategory'] = wasteCategory;
        const jobs = await PlasticRequest_1.default.find(filterQuery)
            .populate('citizen', 'name phoneNumber profilePicture')
            .sort({ createdAt: -1 });
        res.json(jobs);
    }
    catch (error) {
        console.error('List Pending Jobs Error:', error);
        res.status(500).json({ message: 'Server error listing available jobs.', error: error.message });
    }
};
exports.listPendingJobs = listPendingJobs;
// @desc    Accept a pickup request
// @route   PUT /api/collector/jobs/:id/accept
// @access  Private (Collector)
const acceptJob = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'collector') {
            return res.status(403).json({ message: 'Access denied. Collector role required.' });
        }
        const request = await PlasticRequest_1.default.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Pickup request not found.' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is no longer available. Already accepted or cancelled.' });
        }
        const collectorUser = await User_1.default.findById(req.user.id);
        if (!collectorUser)
            return res.status(404).json({ message: 'Collector profile not found.' });
        // Update request
        request.status = 'accepted';
        request.collector = collectorUser._id;
        request.history.push({
            status: 'accepted',
            updatedBy: collectorUser._id,
            updatedAt: new Date()
        });
        await request.save();
        // Create notifications for the citizen
        const citizenUser = await User_1.default.findById(request.citizen);
        if (citizenUser) {
            await Notification_1.default.create({
                user: citizenUser._id,
                title: 'Pickup Request Accepted',
                message: `Collector ${collectorUser.name} has accepted your request. Expected pickup soon!`,
                type: 'success'
            });
            // Send Email
            await (0, mailer_1.sendNotificationEmail)(citizenUser.email, 'EcoCycle - Pickup Request Accepted', `Hello ${citizenUser.name},\n\nYour plastic waste collection request has been accepted by collector ${collectorUser.name}. They will contact you shortly at ${collectorUser.phoneNumber}.\n\nThank you for choosing EcoCycle!`);
        }
        res.json({
            message: 'Job accepted. You are now assigned to this collection.',
            request
        });
    }
    catch (error) {
        console.error('Accept Job Error:', error);
        res.status(500).json({ message: 'Server error accepting job.', error: error.message });
    }
};
exports.acceptJob = acceptJob;
// @desc    Reject/release an accepted job (put back to pending)
// @route   PUT /api/collector/jobs/:id/reject
// @access  Private (Collector)
const rejectJob = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'collector') {
            return res.status(403).json({ message: 'Access denied.' });
        }
        const request = await PlasticRequest_1.default.findById(req.params.id);
        if (!request)
            return res.status(404).json({ message: 'Request not found.' });
        if (request.status !== 'accepted' || request.collector?.toString() !== req.user.id) {
            return res.status(400).json({ message: 'You can only release jobs currently assigned to you.' });
        }
        request.status = 'pending';
        request.collector = undefined;
        request.history.push({
            status: 'pending',
            updatedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            updatedAt: new Date()
        });
        await request.save();
        res.json({ message: 'Job released back to public pending queue.', request });
    }
    catch (error) {
        console.error('Release Job Error:', error);
        res.status(500).json({ message: 'Server error releasing job.', error: error.message });
    }
};
exports.rejectJob = rejectJob;
// @desc    Mark a job as picked up (upload proof image & assign recycler)
// @route   PUT /api/collector/jobs/:id/pickup
// @access  Private (Collector)
const pickupJob = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'collector') {
            return res.status(403).json({ message: 'Access denied. Collector role required.' });
        }
        const { recyclingCenterId } = req.body;
        if (!recyclingCenterId) {
            return res.status(400).json({ message: 'Please select a recycling center to deliver the plastic.' });
        }
        const request = await PlasticRequest_1.default.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Pickup request not found.' });
        }
        if (request.status !== 'accepted' || request.collector?.toString() !== req.user.id) {
            return res.status(400).json({ message: 'Request is not accepted by you.' });
        }
        // Verify recycling center
        const recycler = await User_1.default.findOne({ _id: recyclingCenterId, role: 'recycler' });
        if (!recycler) {
            return res.status(400).json({ message: 'Invalid Recycling Center selection.' });
        }
        // Process uploaded proof image
        let proofUrl = '';
        if (req.file) {
            proofUrl = await (0, cloudinary_1.uploadImage)(req.file.path);
        }
        else if (req.body.pickupProofImage) {
            proofUrl = req.body.pickupProofImage;
        }
        else {
            return res.status(400).json({ message: 'Please upload a photo as proof of collection.' });
        }
        const collectorUser = await User_1.default.findById(req.user.id);
        if (!collectorUser)
            return res.status(404).json({ message: 'Collector profile not found.' });
        // Update request details
        request.status = 'picked_up';
        request.recyclingCenter = recycler._id;
        request.pickupProofImage = proofUrl;
        request.history.push({
            status: 'picked_up',
            updatedBy: collectorUser._id,
            updatedAt: new Date()
        });
        await request.save();
        // Increment collector statistics and earnings
        // Standard pay structure: ₹50 base + ₹20 per kg of collected plastic
        const earningsEarned = 50 + Math.round(request.estimatedWeight * 20);
        collectorUser.collectorDetails.earnings += earningsEarned;
        collectorUser.collectorDetails.completedJobsToday += 1;
        await collectorUser.save();
        // Notify Citizen
        const citizenUser = await User_1.default.findById(request.citizen);
        if (citizenUser) {
            await Notification_1.default.create({
                user: citizenUser._id,
                title: 'Waste Collected!',
                message: `Collector ${collectorUser.name} has picked up your plastic. It is being transported to ${recycler.name}.`,
                type: 'info'
            });
        }
        // Notify Recycler
        await Notification_1.default.create({
            user: recycler._id,
            title: 'Incoming Shipment',
            message: `Collector ${collectorUser.name} has picked up ${request.estimatedWeight}kg of plastic and is en route.`,
            type: 'info'
        });
        res.json({
            message: `Status updated to PICKED UP. Added ₹${earningsEarned} to earnings.`,
            request
        });
    }
    catch (error) {
        console.error('Pickup Job Error:', error);
        res.status(500).json({ message: 'Server error marking job as picked up.', error: error.message });
    }
};
exports.pickupJob = pickupJob;
// @desc    Get dashboard summary statistics for collector
// @route   GET /api/collector/stats
// @access  Private (Collector)
const getCollectorStats = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const collector = await User_1.default.findById(req.user.id);
        if (!collector)
            return res.status(404).json({ message: 'Collector profile not found.' });
        const activeJobs = await PlasticRequest_1.default.find({
            collector: req.user.id,
            status: 'accepted'
        }).populate('citizen', 'name phoneNumber address');
        const completedJobsCount = await PlasticRequest_1.default.countDocuments({
            collector: req.user.id,
            status: { $in: ['picked_up', 'received', 'recycled'] }
        });
        res.json({
            availability: collector.collectorDetails.availability,
            earnings: collector.collectorDetails.earnings,
            completedJobsToday: collector.collectorDetails.completedJobsToday,
            totalCompletedJobs: completedJobsCount,
            activeJobs
        });
    }
    catch (error) {
        console.error('Collector Stats Error:', error);
        res.status(500).json({ message: 'Server error pulling stats.', error: error.message });
    }
};
exports.getCollectorStats = getCollectorStats;
