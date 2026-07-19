"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_1 = require("../controllers/requestController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Apply auth middleware to all requests routes
router.use(auth_1.authenticateToken);
router.post('/', upload_1.upload.array('images', 5), requestController_1.createRequest);
router.post('/classify-image', upload_1.upload.single('image'), requestController_1.classifyImage);
router.get('/my', requestController_1.listMyRequests);
router.get('/:id', requestController_1.getRequestById);
router.put('/:id/cancel', requestController_1.cancelRequest);
router.post('/:id/feedback', requestController_1.rateRequest);
exports.default = router;
