"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_ecocycle_2026';
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role, phoneNumber, address, city, area, facilityName, capacity } = req.body;
        // Check if user exists
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email address.' });
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Prepare role-specific details
        const collectorDetails = role === 'collector' ? {
            availability: false,
            earnings: 0,
            completedJobsToday: 0
        } : undefined;
        const recyclerDetails = role === 'recycler' ? {
            facilityName: facilityName || `${name} Recycling Center`,
            capacity: capacity ? parseInt(capacity) : 10000
        } : undefined;
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'citizen',
            phoneNumber: phoneNumber || '',
            address: address || '',
            city: city || '',
            area: area || '',
            rewards: role === 'citizen' ? { points: 0, tier: 'Bronze' } : undefined,
            collectorDetails,
            recyclerDetails
        });
        // Create JWT Token
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                phoneNumber: user.phoneNumber,
                address: user.address,
                city: user.city,
                area: user.area,
                rewards: user.rewards,
                collectorDetails: user.collectorDetails,
                recyclerDetails: user.recyclerDetails
            }
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};
exports.register = register;
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials. User not found.' });
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
        }
        // Create JWT Token
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                phoneNumber: user.phoneNumber,
                address: user.address,
                city: user.city,
                area: user.area,
                rewards: user.rewards,
                collectorDetails: user.collectorDetails,
                recyclerDetails: user.recyclerDetails
            }
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};
exports.login = login;
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }
        const user = await User_1.default.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User profile not found.' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error retrieving user data.', error: error.message });
    }
};
exports.getMe = getMe;
// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }
        const { name, phoneNumber, address, city, area, profilePicture, facilityName, capacity, availability } = req.body;
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Update general fields
        if (name)
            user.name = name;
        if (phoneNumber)
            user.phoneNumber = phoneNumber;
        if (address)
            user.address = address;
        if (city)
            user.city = city;
        if (area)
            user.area = area;
        if (profilePicture)
            user.profilePicture = profilePicture;
        // Update role specific fields
        if (user.role === 'collector' && availability !== undefined) {
            user.collectorDetails.availability = availability;
        }
        if (user.role === 'recycler') {
            if (facilityName)
                user.recyclerDetails.facilityName = facilityName;
            if (capacity)
                user.recyclerDetails.capacity = parseInt(capacity);
        }
        await user.save();
        // Exclude password from response
        const updatedUser = await User_1.default.findById(user._id).select('-password');
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error updating user profile.', error: error.message });
    }
};
exports.updateProfile = updateProfile;
