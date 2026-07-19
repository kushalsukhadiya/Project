import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import PlasticRequest from '../models/PlasticRequest';
import User from '../models/User';
import Notification from '../models/Notification';

// @desc    Get all plastic shipments dispatched to this center
// @route   GET /api/recycler/shipments
// @access  Private (Recycler)
export const listShipments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'recycler') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { status } = req.query;
    const filterQuery: any = { recyclingCenter: req.user.id };
    
    if (status) {
      filterQuery.status = status;
    } else {
      filterQuery.status = { $in: ['picked_up', 'received', 'recycled'] };
    }

    const shipments = await PlasticRequest.find(filterQuery)
      .populate('citizen', 'name phoneNumber')
      .populate('collector', 'name phoneNumber')
      .sort({ updatedAt: -1 });

    res.json(shipments);
  } catch (error: any) {
    console.error('List Shipments Error:', error);
    res.status(500).json({ message: 'Server error listing shipments.', error: error.message });
  }
};

// @desc    Confirm receipt of plastic waste shipment from collector
// @route   PUT /api/recycler/shipments/:id/receive
// @access  Private (Recycler)
export const confirmReceipt = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'recycler') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const request = await PlasticRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (request.status !== 'picked_up' || request.recyclingCenter?.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Cannot receive. Request status must be picked_up and assigned to you.' });
    }

    request.status = 'received';
    request.history.push({
      status: 'received',
      updatedBy: new mongoose.Types.ObjectId(req.user.id),
      updatedAt: new Date()
    });

    await request.save();

    // Notify Citizen
    const citizenUser = await User.findById(request.citizen);
    if (citizenUser) {
      await Notification.create({
        user: citizenUser._id,
        title: 'Shipment Received at Recycling Center',
        message: `Your reported plastic waste has been safely delivered to ${req.user.email} (Recycling Center). Processing will begin.`,
        type: 'info'
      });
    }

    // Notify Collector
    if (request.collector) {
      await Notification.create({
        user: request.collector,
        title: 'Shipment Confirmed',
        message: `Recycling Center confirmed receipt of the shipment you delivered.`,
        type: 'success'
      });
    }

    res.json({ message: 'Shipment received status confirmed.', request });
  } catch (error: any) {
    console.error('Confirm Receipt Error:', error);
    res.status(500).json({ message: 'Server error confirming receipt.', error: error.message });
  }
};

// @desc    Update status of waste to processed/recycled
// @route   PUT /api/recycler/shipments/:id/recycle
// @access  Private (Recycler)
export const updateRecyclingStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'recycler') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const request = await PlasticRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (request.status !== 'received' || request.recyclingCenter?.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Cannot mark as recycled. Request must be received first and assigned to you.' });
    }

    request.status = 'recycled';
    request.history.push({
      status: 'recycled',
      updatedBy: new mongoose.Types.ObjectId(req.user.id),
      updatedAt: new Date()
    });

    await request.save();

    // Notify Admins to verify recycling and release rewards
    const admins = await User.find({ role: 'admin' });
    for (const ad of admins) {
      await Notification.create({
        user: ad._id,
        title: 'Recycling Pending Verification',
        message: `Recycling Center has processed a shipment of ${request.estimatedWeight}kg. Pending verification to release citizen points.`,
        type: 'info'
      });
    }

    res.json({ message: 'Waste marked as processed/recycled. Sent to administrator for verification.', request });
  } catch (error: any) {
    console.error('Update Recycling Status Error:', error);
    res.status(500).json({ message: 'Server error updating status.', error: error.message });
  }
};

// @desc    Get dashboard metrics for recycling center
// @route   GET /api/recycler/stats
// @access  Private (Recycler)
export const getRecyclerStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const recycler = await User.findById(req.user.id);
    if (!recycler) return res.status(404).json({ message: 'Recycling center not found.' });

    const incomingCount = await PlasticRequest.countDocuments({
      recyclingCenter: req.user.id,
      status: 'picked_up'
    });

    const receivedCount = await PlasticRequest.countDocuments({
      recyclingCenter: req.user.id,
      status: 'received'
    });

    const recycledCount = await PlasticRequest.countDocuments({
      recyclingCenter: req.user.id,
      status: 'recycled'
    });

    // Calculate total weight recycled
    const totalRecycledWeight = await PlasticRequest.aggregate([
      { $match: { recyclingCenter: recycler._id, status: 'recycled' } },
      { $group: { _id: null, total: { $sum: '$estimatedWeight' } } }
    ]);

    const weightProcessed = totalRecycledWeight[0]?.total || 0;

    res.json({
      facilityName: recycler.recyclerDetails.facilityName,
      capacity: recycler.recyclerDetails.capacity,
      incomingShipments: incomingCount,
      receivedShipments: receivedCount,
      recycledShipments: recycledCount,
      totalRecycledWeight: weightProcessed,
      monthlyProgressPercentage: Math.min(100, Math.round((weightProcessed / recycler.recyclerDetails.capacity) * 100))
    });
  } catch (error: any) {
    console.error('Recycler Stats Error:', error);
    res.status(500).json({ message: 'Server error pulling stats.', error: error.message });
  }
};
