import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary initialized successfully.');
} else {
  console.log('Cloudinary credentials missing in env. Falling back to local disk storage for image uploads.');
}

export const uploadImage = async (filePath: string): Promise<string> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'ecocycle',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local file URL:', error);
    }
  }

  // Local storage fallback: Extract filename and return route
  const fileName = path.basename(filePath);
  return `/uploads/${fileName}`;
};
