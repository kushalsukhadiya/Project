import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PlasticRequest } from '../types';
import { SkeletonDashboardStats, SkeletonList } from '../components/SkeletonLoader';
import { 
  Plus, Calendar, Trash2, Star, CheckCircle2,
  AlertCircle, ArrowUpRight
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
      if (data.length > 0) {
        setSelectedRequest(data[0]);
      }
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
    const badges: Record<string, string> = {
      pending: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800',
      reminder_sent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      assigned_municipality: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      escalated: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      assigned_ngo: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
      in_progress: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
      completed: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
      verified: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      closed: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      rejected: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800',
      duplicate: 'bg-slate-100 text-slate-500 border border-slate-200 dark:border-slate-800'
    };
    return badges[status] || badges.pending;
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

      <div className="mt-4" />

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
                {(() => {
                  const baseSteps = [
                    { status: 'pending', title: 'Submitted', desc: 'Waste complaint reported by Citizen.' }
                  ];

                  if (selectedRequest.history.some(h => h.status === 'reminder_sent')) {
                    baseSteps.push({ status: 'reminder_sent', title: 'Reminder Sent', desc: 'No response in 48h. Warning issued.' });
                  }
                  if (selectedRequest.history.some(h => h.status === 'escalated')) {
                    baseSteps.push({ status: 'escalated', title: 'Escalated to NGO', desc: 'Escalated to registered NGOs.' });
                  }

                  if (selectedRequest.history.some(h => h.status === 'assigned_municipality')) {
                    baseSteps.push({ status: 'assigned_municipality', title: 'Assigned to Municipality', desc: 'Municipal crew claimed responsibility.' });
                  } else if (selectedRequest.history.some(h => h.status === 'assigned_ngo')) {
                    baseSteps.push({ status: 'assigned_ngo', title: 'Assigned to NGO', desc: 'NGO crew claimed responsibility.' });
                  } else {
                    baseSteps.push({ status: 'assigned_municipality', title: 'Assigned', desc: 'Assigned to cleanup crew.' });
                  }

                  baseSteps.push(
                    { status: 'in_progress', title: 'In Progress', desc: 'Cleanup crew currently resolving issue.' },
                    { status: 'completed', title: 'Completed', desc: 'Waste cleared. Awaiting Admin verification.' },
                    { status: 'closed', title: 'Closed & Verified', desc: 'Admin verified and closed complaint.' }
                  );

                  return baseSteps.map((step, idx) => {
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
                          <span className={`text-xs font-bold ${isDone ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-650'}`}>
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
                  });
                })()}
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
