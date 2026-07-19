"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateRequest = exports.cancelRequest = exports.getRequestById = exports.listMyRequests = exports.createRequest = exports.classifyImage = exports.calculateImpact = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlasticRequest_1 = __importDefault(require("../models/PlasticRequest"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Feedback_1 = __importDefault(require("../models/Feedback"));
const cloudinary_1 = require("../config/cloudinary");
// Calculate points and CO2 offsets based on weight and category
const calculateImpact = (category, weight) => {
    let pointsPerKg = 10;
    let co2SavedPerKg = 1.5; // kg of CO2 offset per kg of recycled plastic
    switch (category) {
        case 'PET Bottles':
            pointsPerKg = 15;
            co2SavedPerKg = 1.8;
            break;
        case 'Plastic Bottles':
            pointsPerKg = 12;
            co2SavedPerKg = 1.6;
            break;
        case 'Industrial Plastic':
            pointsPerKg = 20;
            co2SavedPerKg = 2.2;
            break;
        case 'Food Packaging':
            pointsPerKg = 8;
            co2SavedPerKg = 1.2;
            break;
        default:
            pointsPerKg = 10;
            co2SavedPerKg = 1.4;
    }
    const points = Math.round(weight * pointsPerKg);
    const co2Offset = parseFloat((weight * co2SavedPerKg).toFixed(2));
    return { points, co2Offset };
};
exports.calculateImpact = calculateImpact;
// @desc    Simulate AI classification of uploaded plastic waste image
// @route   POST /api/requests/classify-image
// @access  Private
const classifyImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image to classify.' });
        }
        // Process image path (mock upload or actual local/cloud upload)
        const imageUrl = await (0, cloudinary_1.uploadImage)(req.file.path);
        // Simulate AI classification behavior
        const categories = [
            'PET Bottles',
            'Plastic Bottles',
            'Food Packaging',
            'Containers',
            'Plastic Bags',
            'Mixed Plastic'
        ];
        // Select one randomly based on filename characters to appear deterministic
        const charCodeSum = req.file.originalname.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        const categoryIndex = charCodeSum % categories.length;
        const estimatedCategory = categories[categoryIndex];
        const confidence = 85 + (charCodeSum % 15); // 85% to 99%
        const recyclablePercentage = 75 + (charCodeSum % 21); // 75% to 95%
        res.json({
            imageUrl,
            estimatedCategory,
            confidence,
            recyclablePercentage,
            message: 'AI image scan complete. Type identified with high confidence.'
        });
    }
    catch (error) {
        console.error('AI Classification error:', error);
        res.status(500).json({ message: 'Image classification simulation failed.', error: error.message });
    }
};
exports.classifyImage = classifyImage;
// @desc    Submit a new plastic waste pickup request
// @route   POST /api/requests
// @access  Private (Citizen)
const createRequest = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'citizen') {
            return res.status(403).json({ message: 'Only citizens can report plastic waste.' });
        }
        const { wasteCategory, estimatedWeight, pickupDate, latitude, longitude, address } = req.body;
        if (!wasteCategory || !estimatedWeight || !pickupDate || !latitude || !longitude || !address) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }
        // Process uploaded file URLs if any files were uploaded, otherwise use dummy array or text body values
        const images = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const url = await (0, cloudinary_1.uploadImage)(file.path);
                images.push(url);
            }
        }
        else if (req.body.imageUrl) {
            images.push(req.body.imageUrl);
        }
        const pickupDateObj = new Date(pickupDate);
        // Create request
        const plasticRequest = await PlasticRequest_1.default.create({
            citizen: req.user.id,
            wasteCategory,
            estimatedWeight: parseFloat(estimatedWeight),
            pickupDate: pickupDateObj,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                address
            },
            images,
            status: 'pending',
            history: [{ status: 'pending', updatedBy: new mongoose_1.default.Types.ObjectId(req.user.id), updatedAt: new Date() }]
        });
        // Notify nearby active collectors (simulate notification creation)
        const activeCollectors = await User_1.default.find({ role: 'collector', 'collectorDetails.availability': true });
        for (const coll of activeCollectors) {
            await Notification_1.default.create({
                user: coll._id,
                title: 'New Pickup Job Available',
                message: `A new collection job for ${estimatedWeight}kg of ${wasteCategory} has been reported in ${req.body.area || 'your city'}.`,
                type: 'info'
            });
        }
        res.status(201).json({
            message: 'Waste reported successfully. A collector will be notified.',
            request: plasticRequest
        });
    }
    catch (error) {
        console.error('Create Request Error:', error);
        res.status(500).json({ message: 'Failed to create plastic request.', error: error.message });
    }
};
exports.createRequest = createRequest;
// @desc    Get all requests made by the logged-in citizen
// @route   GET /api/requests/my
// @access  Private (Citizen)
const listMyRequests = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const requests = await PlasticRequest_1.default.find({ citizen: req.user.id })
            .populate('collector', 'name phoneNumber profilePicture')
            .populate('recyclingCenter', 'name recyclerDetails')
            .sort({ createdAt: -1 });
        res.json(requests);
    }
    catch (error) {
        console.error('List My Requests Error:', error);
        res.status(500).json({ message: 'Server error listing requests.', error: error.message });
    }
};
exports.listMyRequests = listMyRequests;
// @desc    Get details of a single request
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
    try {
        const request = await PlasticRequest_1.default.findById(req.params.id)
            .populate('citizen', 'name email phoneNumber profilePicture')
            .populate('collector', 'name phoneNumber profilePicture')
            .populate('recyclingCenter', 'name recyclerDetails');
        if (!request) {
            return res.status(404).json({ message: 'Recycling request not found.' });
        }
        // Authorization: User must be either the citizen, the assigned collector, the assigned recycler, or an admin
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const isOwner = request.citizen._id.toString() === userId;
        const isAssignedCollector = request.collector?._id.toString() === userId;
        const isAssignedRecycler = request.recyclingCenter?._id.toString() === userId;
        const isAdmin = userRole === 'admin';
        if (!isOwner && !isAssignedCollector && !isAssignedRecycler && !isAdmin) {
            return res.status(403).json({ message: 'Access denied. Unauthorized to view this request.' });
        }
        // Append calculated points and CO2 metrics
        const impact = (0, exports.calculateImpact)(request.wasteCategory, request.estimatedWeight);
        res.json({
            ...request.toJSON(),
            metrics: {
                pointsToEarn: impact.points,
                co2ReductionKg: impact.co2Offset
            }
        });
    }
    catch (error) {
        console.error('Get Request Error:', error);
        res.status(500).json({ message: 'Server error retrieving request details.', error: error.message });
    }
};
exports.getRequestById = getRequestById;
// @desc    Cancel a request (only if still pending)
// @route   PUT /api/requests/:id/cancel
// @access  Private (Citizen)
const cancelRequest = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const request = await PlasticRequest_1.default.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        // Check ownership
        if (request.citizen.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. You can only cancel your own requests.' });
        }
        // Check status
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel request once it has been accepted by a collector.' });
        }
        request.status = 'cancelled';
        request.history.push({
            status: 'cancelled',
            updatedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            updatedAt: new Date()
        });
        await request.save();
        res.json({ message: 'Request cancelled successfully.', request });
    }
    catch (error) {
        console.error('Cancel Request Error:', error);
        res.status(500).json({ message: 'Server error cancelling request.', error: error.message });
    }
};
exports.cancelRequest = cancelRequest;
// @desc    Submit rating/feedback for a completed request
// @route   POST /api/requests/:id/feedback
// @access  Private (Citizen)
const rateRequest = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'citizen') {
            return res.status(403).json({ message: 'Only citizens can provide collector feedback.' });
        }
        const { rating, comment } = req.body;
        if (!rating) {
            return res.status(400).json({ message: 'Rating is required.' });
        }
        const request = await PlasticRequest_1.default.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        // Check ownership
        if (request.citizen.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        // Check status - request must be completed (recycled or received)
        if (request.status !== 'recycled' && request.status !== 'received') {
            return res.status(400).json({ message: 'Feedback can only be given for completed pickups.' });
        }
        if (!request.collector) {
            return res.status(400).json({ message: 'No collector assigned to this request.' });
        }
        request.feedbackRating = rating;
        request.feedbackComment = comment || '';
        await request.save();
        // Create Feedback document
        await Feedback_1.default.create({
            citizen: req.user.id,
            collector: request.collector,
            request: request._id,
            rating,
            comment: comment || ''
        });
        // Notify Collector
        await Notification_1.default.create({
            user: request.collector,
            title: 'New Feedback Received!',
            message: `Citizen rated your pickup service with ${rating} stars.`,
            type: 'success'
        });
        res.json({ message: 'Feedback submitted successfully. Thank you!', request });
    }
    catch (error) {
        console.error('Submit Feedback Error:', error);
        res.status(500).json({ message: 'Server error submitting feedback.', error: error.message });
    }
};
exports.rateRequest = rateRequest;
