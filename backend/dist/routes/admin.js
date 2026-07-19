"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const PlasticRequest_1 = __importDefault(require("../models/PlasticRequest"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use((0, role_1.authorizeRoles)(['admin']));
router.get('/analytics', adminController_1.getAnalytics);
router.get('/users', adminController_1.listUsers);
router.delete('/users/:id', adminController_1.deleteUser);
router.put('/requests/:id/verify', adminController_1.verifyRequest);
router.get('/feedback', adminController_1.listFeedback);
// General admin route to get all requests in the system
router.get('/requests', async (req, res) => {
    try {
        const requests = await PlasticRequest_1.default.find({})
            .populate('citizen', 'name email')
            .populate('collector', 'name email')
            .populate('recyclingCenter', 'name recyclerDetails')
            .sort({ createdAt: -1 });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving all requests.', error: error.message });
    }
});
exports.default = router;
