import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import PlasticRequest from '../models/PlasticRequest';
import User from '../models/User';
import Notification from '../models/Notification';
import { uploadImage } from '../config/cloudinary';
import { sendNotificationEmail } from '../config/mailer';

// @desc    Toggle collector availability status
// @route   PUT /api/collector/availability
// @access  Private (Collector)
export const toggleAvailability = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'collector' && req.user.role !== 'admin' && req.user.role !== 'municipal')) {
      return res.status(403).json({ message: 'Only collectors, admins, or municipal officers can toggle availability.' });
    }

    const { availability } = req.body;
    if (availability === undefined) {
      return res.status(400).json({ message: 'Availability boolean value required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Collector not found.' });

    user.collectorDetails.availability = availability;
    await user.save();

    res.json({
      message: `Availability status updated to ${availability ? 'ACTIVE' : 'INACTIVE'}.`,
      availability: user.collectorDetails.availability
    });
  } catch (error: any) {
    console.error('Toggle Availability Error:', error);
    res.status(500).json({ message: 'Server error updating availability.', error: error.message });
  }
};

// @desc    List all nearby/pending pickup requests
// @route   GET /api/collector/jobs/pending
// @access  Private (Collector)
export const listPendingJobs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'collector' && req.user.role !== 'admin' && req.user.role !== 'municipal')) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { city, area, wasteCategory } = req.query;
    
    const cleanQuery = (val: any) => {
      if (!val || val === 'undefined' || val === 'null' || String(val).trim() === '') return undefined;
      return val;
    };

    const queryCity = cleanQuery(city);
    const queryArea = cleanQuery(area);
    const queryWasteCategory = cleanQuery(wasteCategory);

    const isMunicipal = req.user.role === 'municipal';
    const filterQuery: any = { 
      status: isMunicipal ? { $in: ['pending', 'reminder_sent'] } : 'escalated' 
    };

    if (queryCity) filterQuery['city'] = queryCity;
    if (queryArea) {
      filterQuery['location.address'] = { $regex: queryArea, $options: 'i' };
    }
    if (queryWasteCategory) filterQuery['wasteCategory'] = queryWasteCategory;

    const jobs = await PlasticRequest.find(filterQuery)
      .populate('citizen', 'name phoneNumber profilePicture')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error: any) {
    console.error('List Pending Jobs Error:', error);
    res.status(500).json({ message: 'Server error listing available jobs.', error: error.message });
  }
};

// @desc    Accept a pickup request
// @route   PUT /api/collector/jobs/:id/accept
// @access  Private (Collector)
export const acceptJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'collector' && req.user.role !== 'admin' && req.user.role !== 'municipal')) {
      return res.status(403).json({ message: 'Access denied. Collector, Admin or Municipal role required.' });
    }

    const request = await PlasticRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const collectorUser = await User.findById(req.user.id);
    if (!collectorUser) return res.status(404).json({ message: 'User profile not found.' });

    const now = new Date();

    if (req.user.role === 'municipal') {
      // Municipality responds first (Pending or Reminder Sent)
      if (request.status !== 'pending' && request.status !== 'reminder_sent') {
        return res.status(400).json({ message: 'Municipality can only accept complaints that are Pending or have Reminder Sent status.' });
      }
      
      request.status = 'assigned_municipality';
      request.assignedTo = collectorUser._id as mongoose.Types.ObjectId;
      request.assignedOrganizationType = 'municipality';
      request.assignedAt = now;
      request.acceptedAt = now;
      request.history.push({
        status: 'assigned_municipality',
        updatedBy: collectorUser._id as mongoose.Types.ObjectId,
        updatedAt: now
      });

    } else if (req.user.role === 'collector') {
      // NGO Officer (collector) claims after escalation
      if (request.status !== 'escalated') {
        return res.status(400).json({ message: 'NGOs can only claim complaints that have been Escalated.' });
      }

      request.status = 'assigned_ngo';
      request.assignedTo = collectorUser._id as mongoose.Types.ObjectId;
      request.assignedOrganizationType = 'ngo';
      request.assignedAt = now;
      request.acceptedAt = now;
      request.claimedBy = collectorUser._id as mongoose.Types.ObjectId;
      request.claimTimestamp = now;
      request.history.push({
        status: 'assigned_ngo',
        updatedBy: collectorUser._id as mongoose.Types.ObjectId,
        updatedAt: now
      });
    } else {
      // Admin overrides
      request.status = 'assigned_municipality';
      request.assignedTo = collectorUser._id as mongoose.Types.ObjectId;
      request.assignedOrganizationType = 'municipality';
      request.assignedAt = now;
      request.acceptedAt = now;
      request.history.push({
        status: 'assigned_municipality',
        updatedBy: collectorUser._id as mongoose.Types.ObjectId,
        updatedAt: now
      });
    }

    await request.save();

    // Create notifications for the citizen
    const citizenUser = await User.findById(request.citizen);
    if (citizenUser) {
      await Notification.create({
        user: citizenUser._id,
        title: 'Complaint Accepted',
        message: `Your complaint has been accepted by ${collectorUser.name} (${collectorUser.role === 'municipal' ? 'Municipality' : 'NGO'}).`,
        type: 'success'
      });

      // Send Email
      await sendNotificationEmail(
        citizenUser.email,
        'EcoCycle - Complaint Accepted',
        `Hello ${citizenUser.name},\n\nYour waste complaint has been accepted for clearance by ${collectorUser.name}.\n\nThank you for choosing EcoCycle!`
      );
    }

    res.json({
      message: 'Complaint claimed successfully.',
      request
    });
  } catch (error: any) {
    console.error('Accept Job Error:', error);
    res.status(500).json({ message: 'Server error accepting job.', error: error.message });
  }
};

// @desc    Reject/release an accepted job (put back to pending)
// @route   PUT /api/collector/jobs/:id/reject
// @access  Private (Collector)
export const rejectJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'collector' && req.user.role !== 'admin' && req.user.role !== 'municipal')) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const request = await PlasticRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (request.assignedTo?.toString() !== req.user.id) {
      return res.status(400).json({ message: 'You can only release jobs currently assigned to you.' });
    }

    const previousStatus = request.status;
    const isMunicipal = req.user.role === 'municipal';
    
    request.status = isMunicipal ? 'pending' : 'escalated';
    request.assignedTo = undefined;
    request.assignedOrganizationType = undefined;
    request.assignedAt = undefined;
    request.acceptedAt = undefined;
    request.claimedBy = undefined;
    request.claimTimestamp = undefined;
    request.history.push({
      status: request.status,
      updatedBy: new mongoose.Types.ObjectId(req.user.id),
      updatedAt: new Date()
    });

    await request.save();

    res.json({ message: `Job released back to public ${isMunicipal ? 'pending' : 'escalated'} queue.`, request });
  } catch (error: any) {
    console.error('Release Job Error:', error);
    res.status(500).json({ message: 'Server error releasing job.', error: error.message });
  }
};

// @desc    Mark a job as picked up (upload proof image & assign recycler)
// @route   PUT /api/collector/jobs/:id/pickup
// @access  Private (Collector)
export const pickupJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'collector' && req.user.role !== 'admin' && req.user.role !== 'municipal')) {
      return res.status(403).json({ message: 'Access denied. Collector, Admin or Municipal role required.' });
    }

    const { recyclingCenterId } = req.body;
    if (!recyclingCenterId) {
      return res.status(400).json({ message: 'Please select a recycling center to deliver the plastic.' });
    }

    const request = await PlasticRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found.' });
    }

    // Verify assignment
    if (request.assignedTo?.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Request is not accepted by you.' });
    }

    // Verify recycling center
    const recycler = await User.findOne({ _id: recyclingCenterId, role: 'recycler' });
    if (!recycler) {
      return res.status(400).json({ message: 'Invalid Recycling Center selection.' });
    }

    // Process uploaded proof image
    let proofUrl = '';
    if (req.file) {
      proofUrl = await uploadImage(req.file.path);
    } else if (req.body.pickupProofImage) {
      proofUrl = req.body.pickupProofImage;
    } else {
      return res.status(400).json({ message: 'Please upload a photo as proof of collection.' });
    }

    const collectorUser = await User.findById(req.user.id);
    if (!collectorUser) return res.status(404).json({ message: 'Collector profile not found.' });

    const now = new Date();

    // Update request details
    request.status = 'completed';
    request.recyclingCenter = recycler._id as mongoose.Types.ObjectId;
    request.pickupProofImage = proofUrl;
    request.beforeImage = req.body.beforeImage || request.images[0] || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=400&h=300&q=80';
    request.afterImage = proofUrl;
    request.completedAt = now;
    
    request.history.push({
      status: 'completed',
      updatedBy: collectorUser._id as mongoose.Types.ObjectId,
      updatedAt: now
    });

    await request.save();

    // Increment collector statistics and earnings
    // Standard pay structure: ₹50 base + ₹20 per kg of collected plastic
    const earningsEarned = 50 + Math.round(request.estimatedWeight * 20);
    collectorUser.collectorDetails.earnings += earningsEarned;
    collectorUser.collectorDetails.completedJobsToday += 1;
    await collectorUser.save();

    // Notify Citizen
    const citizenUser = await User.findById(request.citizen);
    if (citizenUser) {
      await Notification.create({
        user: citizenUser._id,
        title: 'Waste Collected!',
        message: `Collector ${collectorUser.name} has picked up your plastic. It is being transported to ${recycler.name}.`,
        type: 'info'
      });
    }

    // Notify Recycler
    await Notification.create({
      user: recycler._id,
      title: 'Incoming Shipment',
      message: `Collector ${collectorUser.name} has picked up ${request.estimatedWeight}kg of plastic and is en route.`,
      type: 'info'
    });

    res.json({
      message: `Status updated to PICKED UP. Added ₹${earningsEarned} to earnings.`,
      request
    });
  } catch (error: any) {
    console.error('Pickup Job Error:', error);
    res.status(500).json({ message: 'Server error marking job as picked up.', error: error.message });
  }
};

// @desc    Get dashboard summary statistics for collector
// @route   GET /api/collector/stats
// @access  Private (Collector)
export const getCollectorStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const collector = await User.findById(req.user.id);
    if (!collector) return res.status(404).json({ message: 'Collector profile not found.' });

    const activeJobs = await PlasticRequest.find({
      assignedTo: req.user.id,
      status: { $in: ['assigned_municipality', 'assigned_ngo', 'in_progress'] }
    }).populate('citizen', 'name phoneNumber address');

    const completedJobsCount = await PlasticRequest.countDocuments({
      assignedTo: req.user.id,
      status: { $in: ['completed', 'verified', 'closed'] }
    });

    res.json({
      availability: true,
      earnings: collector.collectorDetails.earnings,
      completedJobsToday: collector.collectorDetails.completedJobsToday,
      totalCompletedJobs: completedJobsCount,
      activeJobs
    });
  } catch (error: any) {
    console.error('Collector Stats Error:', error);
    res.status(500).json({ message: 'Server error pulling stats.', error: error.message });
  }
};
