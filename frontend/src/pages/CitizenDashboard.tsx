import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PlasticRequest } from '../types';
import { SkeletonDashboardStats, SkeletonList } from '../components/SkeletonLoader';
import { 
  Plus, Calendar, Trash2, Star, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, Award
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [requests, setRequests] = useState<PlasticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback modal state
  const [feedbackRequest, setFeedbackRequest] = useState<PlasticRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Detail panel state
  const [selectedRequest, setSelectedRequest] = useState<PlasticRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await api.requests.myRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load citizen requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    refreshUser();
  }, []);

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this pickup request?')) return;
    try {
      await api.requests.cancel(id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Cancel failed.');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackRequest) return;

    setFeedbackSubmitting(true);
    try {
      await api.requests.submitFeedback(feedbackRequest._id, rating, comment);
      setFeedbackRequest(null);
      setRating(5);
      setComment('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Feedback submission failed.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Status-styling helper
  const getStatusBadge = (status: PlasticRequest['status']) => {
    const badges = {
      pending: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800',
      accepted: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      picked_up: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      received: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
      recycled: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      cancelled: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    };
    return badges[status] || badges.pending;
  };

  // Points progress calculator
  const getNextTierPoints = (points: number) => {
    if (points < 300) return { next: 'Silver', required: 300, progress: (points / 300) * 100 };
    if (points < 800) return { next: 'Gold', required: 800, progress: ((points - 300) / 500) * 100 };
    if (points < 1500) return { next: 'Platinum', required: 1500, progress: ((points - 800) / 700) * 100 };
    return { next: 'MAX', required: 1500, progress: 100 };
  };

  const nextTier = getNextTierPoints(user?.rewards?.points || 0);

  // Statistics counters
  const totalReportsCount = requests.length;
  const completedCount = requests.filter(r => r.status === 'recycled').length;
  const totalWeightRecycled = requests
    .filter(r => r.status === 'recycled')
    .reduce((sum, r) => sum + r.estimatedWeight, 0);

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
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Hello, {user?.name}!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your pickup requests, oversee plastic points rewards, and help keep Mumbai clean.
          </p>
        </div>
        <Link
          to="/report-waste"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md shadow-emerald-500/10 flex items-center space-x-2 transition hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Report Plastic Waste</span>
        </Link>
      </div>

      {/* Rewards Progress and Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rewards Status Card */}
        <div className="bg-gradient-to-tr from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-850 p-6 rounded-3xl text-white shadow-lg lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute top-0 right-0 p-8 opacity-10 animate-slow-spin">
            <Award size={120} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Eco Rewards Status</span>
              <div className="text-4xl font-extrabold mt-1">{user?.rewards?.points || 0} <span className="text-lg">pts</span></div>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20">
              {user?.rewards?.tier || 'Bronze'} Tier
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            {nextTier.next !== 'MAX' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold opacity-90">
                  <span>Progress to {nextTier.next} Tier</span>
                  <span>{user?.rewards?.points || 0} / {nextTier.required} pts</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${nextTier.progress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold opacity-95 flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span>You have unlocked the highest Platinum Eco Legend tier!</span>
              </div>
            )}
          </div>
        </div>

        {/* Small Metrics Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Weight Recycled</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{totalWeightRecycled.toFixed(1)} kg</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified completed pickups</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Requests</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">
              {requests.filter(r => r.status !== 'recycled' && r.status !== 'cancelled').length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>En route or pending collection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Request Logs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">My Collection Requests</h3>
          {requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-sm text-slate-500 space-y-4 shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-350 mx-auto" />
              <p>You have not reported any plastic waste yet.</p>
              <Link
                to="/report-waste"
                className="inline-flex bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800"
              >
                Create Your First Request
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div 
                  key={req._id}
                  onClick={() => setSelectedRequest(req)}
                  className={`bg-white dark:bg-slate-900 border ${
                    selectedRequest?._id === req._id ? 'border-emerald-500 shadow-md' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  } p-5 rounded-2xl cursor-pointer transition shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{req.wasteCategory}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3 pt-1">
                        <span className="font-semibold">Weight: {req.estimatedWeight} kg</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Pickup: {new Date(req.pickupDate).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {req.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRequest(req._id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-100 transition"
                          title="Cancel request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      {req.status === 'recycled' && !req.feedbackRating && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeedbackRequest(req);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-yellow-500/10 transition"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Rate Pickup</span>
                        </button>
                      )}

                      <span className="text-xs font-bold text-emerald-500 flex items-center space-x-1 pl-2">
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Request Detail Panel */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Live Lifecycle Tracking</h3>
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{selectedRequest.wasteCategory}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedRequest._id.slice(-8)}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status.replace('_', ' ')}
                </span>
              </div>

              {/* Status Timeline */}
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-150 dark:before:bg-slate-800">
                {[
                  { status: 'pending', title: 'Submitted', desc: 'Waste reported and pending collector assignment.' },
                  { status: 'accepted', title: 'Assigned', desc: 'Collector accepted request and is dispatched.' },
                  { status: 'picked_up', title: 'Collected', desc: 'Plastic picked up. Transferred to recycling facility.' },
                  { status: 'received', title: 'Arrived', desc: 'Recycling center confirmed receipt of shipment.' },
                  { status: 'recycled', title: 'Completed & Verified', desc: 'Recycled! Points credited to your account.' }
                ].map((step, idx) => {
                  const stepIndexInHistory = selectedRequest.history.findIndex(h => h.status === step.status);
                  const isDone = stepIndexInHistory !== -1;
                  const stepHistory = isDone ? selectedRequest.history[stepIndexInHistory] : null;

                  return (
                    <div key={idx} className="flex space-x-4 relative z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isDone 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-750 text-slate-400'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold ${isDone ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                          {step.title}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                        {stepHistory && (
                          <span className="text-[10px] text-slate-400 block pt-1">
                            {new Date(stepHistory.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Collector / Proof Section */}
              {selectedRequest.collector && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-350">Collector Details</div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={(selectedRequest.collector as any).profilePicture}
                      alt="Collector"
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">{(selectedRequest.collector as any).name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Phone: {(selectedRequest.collector as any).phoneNumber}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.pickupProofImage && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-350 text-xs">Pickup Proof Image</div>
                  <img
                    src={selectedRequest.pickupProofImage}
                    alt="Proof of Collection"
                    className="w-full h-32 object-cover rounded-2xl border border-slate-200 dark:border-slate-800"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-8 rounded-3xl text-center text-xs text-slate-400">
              Select a request from the list to track its live recycling progress timeline.
            </div>
          )}
        </div>
      </div>

      {/* Collector Rating & Feedback Modal */}
      {feedbackRequest && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-slate-800 dark:text-white">Rate Pickup Service</span>
              <button 
                onClick={() => setFeedbackRequest(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Rate your experience</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= rating 
                            ? 'text-yellow-400 fill-yellow-450' 
                            : 'text-slate-300 dark:text-slate-700'
                        } transition`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Add a comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what went well or how we can improve..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-2"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
