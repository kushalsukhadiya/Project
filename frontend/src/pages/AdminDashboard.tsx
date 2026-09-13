import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlasticRequest, User, Feedback } from '../types';
import { SkeletonDashboardStats, SkeletonList } from '../components/SkeletonLoader';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, Users, Star, ShieldCheck, 
  Trash2, MapPin
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'verify' | 'users' | 'feedback'>('analytics');
  
  // Analytics State
  const [summary, setSummary] = useState<any>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    activeCollectors: 0,
    totalCollectors: 0,
    totalRecyclers: 0,
    totalCollectedWeight: 0,
    totalRecycledWeight: 0
  });

  const [charts, setCharts] = useState<any>({
    monthlyCollection: [],
    wasteTypeDistribution: [],
    userGrowth: [],
    collectorPerformance: []
  });

  const [verifyQueue, setVerifyQueue] = useState<PlasticRequest[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);



  // Recharts colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

  const fetchAdminData = async () => {
    try {
      // 1. Get Analytics
      const analytics = await api.admin.getAnalytics();
      setSummary(analytics.summary);
      setCharts(analytics.charts);

      // 2. Get Verify Queue (All requests with status 'completed' or 'recycled' that need point release verification)
      const allReqs = await api.admin.getAllRequests();
      setVerifyQueue(allReqs.filter((r: PlasticRequest) => r.status === 'completed' || r.status === 'recycled'));

      // 3. Get Users List
      const users = await api.admin.getUsers();
      setUsersList(users);

      // 4. Get Feedback List
      const feedbacks = await api.admin.getFeedback();
      setFeedbackList(feedbacks);

    } catch (err) {
      console.error('Failed to retrieve admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyRequest = async (id: string) => {
    try {
      await api.admin.verifyRequest(id);
      alert('Complaint verified and closed! Rewards successfully released to Citizen.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.admin.deleteUser(id);
      alert('User deleted.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Deletion failed.');
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
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <BarChart3 className="w-7 h-7 text-emerald-500" />
          <span>EcoCycle Administrator Control Panel</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review system-wide performance dashboards, manage active citizens & collectors, and authorize recycling point releases.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-sm">
        {[
          { id: 'analytics', label: 'Dashboard Stats', icon: BarChart3 },
          { id: 'verify', label: `Verify Pickups (${verifyQueue.length})`, icon: ShieldCheck },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'feedback', label: 'Citizen Reviews', icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 font-bold flex items-center space-x-2 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Total Users', value: summary.totalUsers, desc: `${summary.totalCollectors} collectors, ${summary.totalRecyclers} centers`, color: 'bg-emerald-500/10 text-emerald-500' },
              { label: 'Pending Requests', value: summary.pendingRequests, desc: 'Awaiting collector accepts', color: 'bg-red-500/10 text-red-500' }
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="text-[10px] uppercase font-bold text-slate-400">{card.label}</div>
                <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{card.value}</div>
                <div className="text-[10px] text-slate-400 mt-1">{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly collection */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Monthly Collection Weight (kg)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyCollection}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(34, 197, 94, 0.05)' }} />
                    <Bar dataKey="weight" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Waste type distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Waste Type Distribution (kg)</h4>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.wasteTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {charts.wasteTypeDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="text-[11px] grid grid-cols-2 sm:grid-cols-1 gap-2 sm:w-1/2">
                  {charts.wasteTypeDistribution.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-350 font-medium">
                        {entry.name}: <b>{entry.value}kg</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Growth */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">User Growth Trends</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="citizens" stroke="#22c55e" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="collectors" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collector Performance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Top Collectors Performance (Collections)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.collectorPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Verify Completed Pickups ({verifyQueue.length})</h3>
          {verifyQueue.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-500 rounded-3xl shadow-sm">
              All recycling collection tasks verified. Zero items pending in the queue.
            </div>
          ) : (
            <div className="space-y-4">
              {verifyQueue.map((req) => (
                <div key={req._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{req.wasteCategory}</span>
                      <span className="text-[10px] font-bold text-slate-400">({req.estimatedWeight} kg)</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">recycled</span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p>Citizen: <b className="text-slate-700 dark:text-slate-350">{(req.citizen as any)?.name}</b> ({(req.citizen as any)?.email})</p>
                      <p>Collector: <b className="text-slate-700 dark:text-slate-350">{(req.collector as any)?.name}</b></p>
                      <p className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Address: {req.location.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end gap-3 self-stretch md:self-auto border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                    {req.pickupProofImage && (
                      <a 
                        href={req.pickupProofImage.startsWith('/uploads') ? `http://localhost:5000${req.pickupProofImage}` : req.pickupProofImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-500 hover:underline font-bold"
                      >
                        Inspect Proof Photo
                      </a>
                    )}
                    <button
                      onClick={() => handleVerifyRequest(req._id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1 transition shadow shadow-emerald-500/10"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Credit Points</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">System User Directory ({usersList.length})</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-extrabold">
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Metrics</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {usersList.map((usr) => (
                    <tr key={usr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition">
                      <td className="p-4 flex items-center space-x-3">
                        <img src={usr.profilePicture} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <span className="font-bold text-slate-800 dark:text-slate-250">{usr.name}</span>
                      </td>
                      <td className="p-4">{usr.email}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                          usr.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' 
                            : usr.role === 'collector'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                            : usr.role === 'recycler'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        }`}>
                          {usr.role === 'recycler' ? 'recycler center' : usr.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{usr.area}, {usr.city}</td>
                      <td className="p-4">{usr.phoneNumber || 'N/A'}</td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-350">
                        {usr.role === 'citizen' && `Points: ${usr.rewards?.points} (${usr.rewards?.tier})`}
                        {usr.role === 'collector' && `Earnings: ₹${usr.collectorDetails?.earnings}`}
                        {usr.role === 'recycler' && `Capacity: ${usr.recyclerDetails?.capacity}kg`}
                        {usr.role === 'admin' && 'System Management'}
                      </td>
                      <td className="p-4 text-center">
                        {usr.role !== 'admin' ? (
                          <button
                            onClick={() => handleDeleteUser(usr._id!)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Restricted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Citizen Collector Reviews ({feedbackList.length})</h3>
          {feedbackList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 rounded-3xl shadow-sm">
              No rating logs reported in the database.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feedbackList.map((item) => (
                <div key={item._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.citizen.name}</span>
                      <span className="text-slate-400">rated collector</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.collector.name}</span>
                    </div>
                    <div className="flex space-x-0.5 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-yellow-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    "{item.comment || 'No review text provided.'}"
                  </p>

                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Waste Category: {item.request.wasteCategory} ({item.request.estimatedWeight}kg)</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
};
