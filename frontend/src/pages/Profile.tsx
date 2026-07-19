import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, ShieldCheck, Mail, Phone, MapPin, 
  Building, Award, Edit3, Image, AlertCircle 
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState(user?.area || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');

  // Recycler states
  const [facilityName, setFacilityName] = useState(user?.recyclerDetails?.facilityName || '');
  const [capacity, setCapacity] = useState(user?.recyclerDetails?.capacity?.toString() || '10000');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!name || !phoneNumber || !city || !area) {
      setError('Please fill in all standard required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name,
        phoneNumber,
        address,
        city,
        area,
        profilePicture
      };

      if (user?.role === 'recycler') {
        payload.facilityName = facilityName;
        payload.capacity = capacity;
      }

      const updatedUser = await api.auth.updateProfile(payload);
      updateUserProfile(updatedUser);
      setMessage('Profile settings saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <Edit3 className="w-6 h-6 text-emerald-500" />
          <span>My Profile Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Modify contact information and role configurations in the portal.
        </p>
      </div>

      {/* Success/Error Callout */}
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-center space-y-4">
          <div className="relative inline-block mx-auto">
            <img 
              src={profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
              alt={user?.name}
              className="w-24 h-24 rounded-3xl object-cover mx-auto ring-4 ring-emerald-500/20"
            />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{user?.name}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role}</span>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-left space-y-2 text-slate-500 dark:text-slate-400">
            {user?.role === 'citizen' && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-450">Rewards Tier:</span>
                <span className="font-extrabold text-emerald-500">{user.rewards?.tier} ({user.rewards?.points} pts)</span>
              </div>
            )}
            {user?.role === 'collector' && (
              <>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-450">Total Earnings:</span>
                  <span className="font-extrabold text-emerald-500">₹{user.collectorDetails?.earnings}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-450">Daily Jobs Today:</span>
                  <span className="font-extrabold text-emerald-500">{user.collectorDetails?.completedJobsToday}</span>
                </div>
              </>
            )}
            {user?.role === 'recycler' && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-450">Processing Cap:</span>
                <span className="font-extrabold text-emerald-500">{user.recyclerDetails?.capacity} kg/month</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold flex items-center space-x-1.5"><Mail className="w-3.5 h-3.5" /> <span>Email:</span></span>
              <span className="font-medium truncate max-w-[120px]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Profile Settings form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-400">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-400">Area</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Avatar Photo Link</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Conditional Recycler Facility Settings */}
          {user?.role === 'recycler' && (
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
              <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Facility Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-400 block">Facility Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-400 block">Monthly Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2 text-sm"
          >
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
