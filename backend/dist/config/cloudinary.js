"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Cloudinary initialized successfully.');
}
else {
    console.log('Cloudinary credentials missing in env. Falling back to local disk storage for image uploads.');
}
const uploadImage = async (filePath) => {
    if (isCloudinaryConfigured) {
        try {
            const result = await cloudinary_1.v2.uploader.upload(filePath, {
                folder: 'ecocycle',
            });
            return result.secure_url;
        }
        catch (error) {
            console.error('Cloudinary upload failed, falling back to local file URL:', error);
        }
    }
    // Local storage fallback: Extract filename and return route
    const fileName = path_1.default.basename(filePath);
    return `/uploads/${fileName}`;
};
exports.uploadImage = uploadImage;
