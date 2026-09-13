import PlasticRequest from '../models/PlasticRequest';
import Notification from '../models/Notification';
import User from '../models/User';
import mongoose from 'mongoose';

export const runSlaChecks = async () => {
  const now = new Date();
  
  try {
    // 1. Pending -> Reminder Sent (if now > slaDeadline)
    const pendingRequests = await PlasticRequest.find({
      status: 'pending',
      slaDeadline: { $lte: now }
    });

    for (const req of pendingRequests) {
      req.status = 'reminder_sent';
      req.reminderSentAt = now;
      // reminderDeadline is set to current time + 48 hours
      req.reminderDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      req.history.push({
        status: 'reminder_sent',
        updatedAt: now,
        updatedBy: req.citizen
      });
      await req.save();

      console.log(`[SLA SCHEDULER] Complaint ${req._id} transitioned to Reminder Sent.`);

      // Send Reminder Notification to Municipality
      const municipalUsers = await User.find({ role: 'municipal' });
      for (const m of municipalUsers) {
        await Notification.create({
          user: m._id,
          title: 'SLA Reminder: Pending waste Complaint',
          message: `A waste complaint in ${req.location.address} has been pending for 48 hours without response. Please accept immediately.`,
          type: 'warning'
        });
      }

      // Notify Admin
      const adminUsers = await User.find({ role: 'admin' });
      for (const a of adminUsers) {
        await Notification.create({
          user: a._id,
          title: 'SLA Reminder: Complaint Pending',
          message: `Complaint in ${req.location.address} is still pending after 48 hours. Reminder sent to Municipality.`,
          type: 'warning'
        });
      }
    }

    // 2. Reminder Sent -> Escalated (if now > reminderDeadline)
    const reminderRequests = await PlasticRequest.find({
      status: 'reminder_sent',
      reminderDeadline: { $lte: now }
    });

    for (const req of reminderRequests) {
      req.status = 'escalated';
      req.escalatedAt = now;
      req.history.push({
        status: 'escalated',
        updatedAt: now,
        updatedBy: req.citizen
      });
      await req.save();

      console.log(`[SLA SCHEDULER] Complaint ${req._id} escalated to NGOs.`);

      // Notify NGOs (collectors)
      const ngos = await User.find({ role: 'collector' });
      for (const n of ngos) {
        await Notification.create({
          user: n._id,
          title: 'Escalated Waste Complaint Available',
          message: `A complaint in ${req.location.address} has been escalated to registered NGOs. Click to claim it!`,
          type: 'info'
        });
      }

      // Notify Admin
      const admins = await User.find({ role: 'admin' });
      for (const a of admins) {
        await Notification.create({
          user: a._id,
          title: 'Complaint Escalated to NGOs',
          message: `Complaint in ${req.location.address} was escalated to registered NGOs due to no Municipality response.`,
          type: 'error'
        });
      }
    }

  } catch (err) {
    console.error('[SLA SCHEDULER ERROR]:', err);
  }
};

export const startSlaScheduler = () => {
  console.log('[SLA SCHEDULER] Starting SLA background worker loop...');
  // Run checks every 1 minute in background
  setInterval(runSlaChecks, 60 * 1000);
  
  // Run first check immediately on start after database connects
  setTimeout(runSlaChecks, 5000);
};
