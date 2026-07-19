import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlasticRequest, User } from '../types';
import { MapViewer } from '../components/MapViewer';
import { SkeletonDashboardStats, SkeletonList } from '../components/SkeletonLoader';
import { 
  User as UserIcon, Scale, MapPin, CheckCircle, 
  Trash2, ShieldCheck, Navigation, Award, DollarSign, Camera, AlertCircle
} from 'lucide-react';

export const CollectorDashboard: React.FC = () => {
  // Collector profile metrics
  const [stats, setStats] = useState({
    availability: false,
    earnings: 0,
    completedJobsToday: 0,
    totalCompletedJobs: 0
  });

  const [activeJobs, setActiveJobs] = useState<PlasticRequest[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PlasticRequest[]>([]);
  const [recyclers, setRecyclers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Complete job modal
  const [completingJob, setCompletingJob] = useState<PlasticRequest | null>(null);
  const [selectedRecyclerId, setSelectedRecyclerId] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [mockProofUrl, setMockProofUrl] = useState('');
  const [completingSubmitting, setCompletingSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const statsData = await api.collector.getStats();
      setStats({
        availability: statsData.availability,
        earnings: statsData.earnings,
        completedJobsToday: statsData.completedJobsToday,
        totalCompletedJobs: statsData.totalCompletedJobs
      });
      setActiveJobs(statsData.activeJobs);

      // Fetch public available pending jobs
      const jobsData = await api.collector.getPendingJobs();
      setPendingJobs(jobsData);

      // Fetch all recyclers for complete-job dropdown
      const usersList = await api.auth.getLeaderboard(); // leaderboard gets citizens, we need a list of recyclers
      // We can fetch recyclers by hitting our custom API or query all users
      // Let's call a fetch directly to /api/auth/me/../recyclers (or write fallback mock)
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/recyclers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const recyclersData = await response.json();
        setRecyclers(recyclersData);
        if (recyclersData.length > 0) setSelectedRecyclerId(recyclersData[0]._id);
      } else {
        // Fallback standard recycler details
        setRecyclers([
          { _id: 'recycler_fallback_id', name: 'GreenTech Recycling Center', role: 'recycler', email: 'recycler@ecocycle.com', profilePicture: '', phoneNumber: '', address: '', city: 'Mumbai', area: 'Goregaon' }
        ]);
        setSelectedRecyclerId('recycler_fallback_id');
      }
    } catch (err) {
      console.error('Failed to load collector dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAvailabilityToggle = async () => {
    try {
      const nextStatus = !stats.availability;
      const data = await api.collector.toggleAvailability(nextStatus);
      setStats(prev => ({ ...prev, availability: data.availability }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptJob = async (id: string) => {
    try {
      await api.collector.acceptJob(id);
      alert('Job accepted! It is added to your active jobs list.');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Accept failed.');
    }
  };

  const handleRejectJob = async (id: string) => {
    if (!window.confirm('Release this job back to the public queue?')) return;
    try {
      await api.collector.rejectJob(id);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Release failed.');
    }
  };

  // Proof image select
  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofImage(e.target.files[0]);
      setMockProofUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCompleteJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!selectedRecyclerId) {
      setModalError('Please select a recycling facility for delivery.');
      return;
    }

    if (!proofImage) {
      setModalError('Please capture/upload proof of collection.');
      return;
    }

    setCompletingSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('recyclingCenterId', selectedRecyclerId);
      formData.append('pickupProofImage', proofImage);

      await api.collector.pickupJob(completingJob!._id, formData);
      alert('Job complete! Delivered to recycler queue. Added pay to earnings.');
      setCompletingJob(null);
      setProofImage(null);
      setMockProofUrl('');
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit pickup proof.');
    } finally {
      setCompletingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <SkeletonDashboardStats />
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl gap-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Collector Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle your active tracking availability and collect reported plastic waste containers near you.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-250/20">
          <span className={`text-xs font-bold ${stats.availability ? 'text-emerald-500' : 'text-slate-400'}`}>
            {stats.availability ? 'ACTIVE TO DISPATCH' : 'INACTIVE'}
          </span>
          <button
            onClick={handleAvailabilityToggle}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              stats.availability ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
              stats.availability ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Collector Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center space-x-5 shadow-sm">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-450">My Earnings</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">₹{stats.earnings}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center space-x-5 shadow-sm">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-450">Completed Jobs Today</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.completedJobsToday}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center space-x-5 shadow-sm">
          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-450">Total Career Collections</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.totalCompletedJobs}</div>
          </div>
        </div>
      </div>

      {/* Map of nearby jobs */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Nearby Waste Bins Map</h3>
        <div className="h-80 relative rounded-3xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
          <MapViewer requests={[...pendingJobs, ...activeJobs]} />
        </div>
      </div>

      {/* Jobs Lists grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Active accepted jobs */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Active Jobs Queue ({activeJobs.length})</h3>
          {activeJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 shadow-sm">
              You are not assigned to any active jobs. Accept a job from the public list.
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map(job => (
                <div key={job._id} className="bg-white dark:bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{job.wasteCategory}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Reported by: {(job.citizen as any)?.name}</div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl">
                      {job.estimatedWeight} kg
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-350 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                      <span>{job.location.address}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setCompletingJob(job)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-500/10 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Collection</span>
                    </button>
                    <button
                      onClick={() => handleRejectJob(job._id)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600 dark:bg-slate-800 dark:hover:bg-red-950/20 dark:text-slate-350 rounded-xl text-xs font-bold transition border border-transparent hover:border-red-100"
                      title="Release job back to queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public pending list */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Public Pending Jobs ({pendingJobs.length})</h3>
          {pendingJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 shadow-sm">
              No pending jobs reported in your region. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingJobs.map(job => (
                <div key={job._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{job.wasteCategory}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">District Area: {job.location.address.split(',').slice(1,3).join(',')}</div>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-xl">
                      {job.estimatedWeight} kg
                    </span>
                  </div>

                  <div className="flex space-x-3 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-400 font-medium">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleAcceptJob(job._id)}
                      disabled={!stats.availability}
                      className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Job & Upload Proof Modal */}
      {completingJob && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-slate-800 dark:text-white">Complete Collection Pickup</span>
              <button 
                onClick={() => {
                  setCompletingJob(null);
                  setProofImage(null);
                  setMockProofUrl('');
                }} 
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteJobSubmit} className="space-y-4">
              {/* Recycler Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Destination Recycling Facility</label>
                <select
                  value={selectedRecyclerId}
                  onChange={(e) => setSelectedRecyclerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white font-semibold"
                >
                  {recyclers.map((rec) => (
                    <option key={rec._id} value={rec._id}>
                      {rec.name} ({rec.area || 'Mumbai'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Proof Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Photo Proof of Pickup</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-emerald-450 dark:hover:border-emerald-600 rounded-2xl p-4 text-center cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleProofImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 flex flex-col items-center justify-center">
                    {mockProofUrl ? (
                      <img
                        src={mockProofUrl}
                        alt="Proof preview"
                        className="h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {proofImage ? proofImage.name : 'Select or snap camera proof photo'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={completingSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white font-extrabold py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-2"
              >
                {completingSubmitting ? 'Uploading Proof...' : 'Complete Collection'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
