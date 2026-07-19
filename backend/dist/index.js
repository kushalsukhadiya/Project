"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for local development and testing
    credentials: true
}));
// Express middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Setup static uploads folder serving (for Cloudinary fallback)
const uploadsDir = path_1.default.join(__dirname, '../public/uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
// Connect to Database and start server
(0, db_1.connectDB)().then((uri) => {
    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(` EcoCycle Backend Server running on port ${PORT}`);
        console.log(` Database: ${uri.startsWith('mongodb://127.0.0.1') ? 'In-Memory Mock Server' : 'External Connection'}`);
        console.log(` API Base URL: http://localhost:${PORT}/api`);
        console.log(`===============================================`);
    });
}).catch(err => {
    console.error('Database connection failed to initialize', err);
    process.exit(1);
});
// Import routers
const auth_1 = __importDefault(require("./routes/auth"));
const requests_1 = __importDefault(require("./routes/requests"));
const collector_1 = __importDefault(require("./routes/collector"));
const recycler_1 = __importDefault(require("./routes/recycler"));
const admin_1 = __importDefault(require("./routes/admin"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Bind API routes
app.use('/api/auth', auth_1.default);
app.use('/api/requests', requests_1.default);
app.use('/api/collector', collector_1.default);
app.use('/api/recycler', recycler_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/notifications', notifications_1.default);
// Base route healthcheck
app.get('/api', (req, res) => {
    res.json({
        status: 'ONLINE',
        message: 'Welcome to EcoCycle API Portal. Systems operational.',
        timestamp: new Date()
    });
});
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(err.status || 500).json({
        message: err.message || 'An internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
