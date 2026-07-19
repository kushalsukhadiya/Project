import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlasticRequest } from '../types';
import { SkeletonDashboardStats, SkeletonList } from '../components/SkeletonLoader';
import { 
  Building, Scale, Package, CheckSquare, 
  ArrowRight, ShieldCheck, AlertCircle, Info, Calendar, Phone
} from 'lucide-react';

export const RecyclerDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    facilityName: '',
    capacity: 10000,
    incomingShipments: 0,
    receivedShipments: 0,
    recycledShipments: 0,
    totalRecycledWeight: 0,
    monthlyProgressPercentage: 0
  });

  const [incoming, setIncoming] = useState<PlasticRequest[]>([]);
  const [received, setReceived] = useState<PlasticRequest[]>([]);
  const [recycled, setRecycled] = useState<PlasticRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsData = await api.recycler.getStats();
      setStats(statsData);

      // Load specific shipment queues
      const incomingData = await api.recycler.getShipments('picked_up');
      setIncoming(incomingData);

      const receivedData = await api.recycler.getShipments('received');
      setReceived(receivedData);

      const recycledData = await api.recycler.getShipments('recycled');
      setRecycled(recycledData);
    } catch (err) {
      console.error('Failed to load recycler dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConfirmReceived = async (id: string) => {
    try {
      await api.recycler.confirmReceipt(id);
      alert('Shipment receipt confirmed! Added to process queue.');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Receive confirmation failed.');
    }
  };

  const handleMarkRecycled = async (id: string) => {
    try {
      await api.recycler.markRecycled(id);
      alert('Plastic processed and recycled! Rewards released to citizen.');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Recycle state update failed.');
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
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl gap-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.facilityName || 'Recycling Center'}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Oversee incoming deliveries, confirm container arrivals, and log recycled plastic quantities.
          </p>
        </div>
      </div>

      {/* Recycler Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Recycled Weight</div>
          <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.totalRecycledWeight} kg</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.monthlyProgressPercentage}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
            <span>Capacity: {stats.capacity} kg</span>
            <span>{stats.monthlyProgressPercentage}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Incoming Deliveries</div>
            <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.incomingShipments}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">In Facility Storage</div>
            <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.receivedShipments}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Recycled Shipments</div>
            <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.recycledShipments}</div>
          </div>
        </div>
      </div>

      {/* Main Queues Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Incoming Dispatches */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Incoming Shipments En Route ({incoming.length})</h3>
          {incoming.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 shadow-sm">
              No incoming dispatches registered. Collectors will notify you upon pick up.
            </div>
          ) : (
            <div className="space-y-4">
              {incoming.map(shipment => (
                <div key={shipment._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm hover:border-slate-350 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{shipment.wasteCategory}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Collector: {(shipment.collector as any)?.name}</div>
                    </div>
                    <span className="text-xs font-extrabold text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 px-2.5 py-1 rounded-xl">
                      {shipment.estimatedWeight} kg
                    </span>
                  </div>

                  {shipment.pickupProofImage && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400">Dispatched Proof Photo</div>
                      <img 
                        src={shipment.pickupProofImage.startsWith('/uploads') ? `http://localhost:5000${shipment.pickupProofImage}` : shipment.pickupProofImage} 
                        alt="Proof"
                        className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner"
                      />
                    </div>
                  )}

                  <div className="flex space-x-3 items-center pt-2">
                    <button
                      onClick={() => handleConfirmReceived(shipment._id)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition shadow shadow-emerald-500/10"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Confirm Package Received</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Process Facility Queue */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Facility Processing Queue ({received.length})</h3>
          {received.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 shadow-sm">
              Storage is currently empty. Verify incoming dispatches first.
            </div>
          ) : (
            <div className="space-y-4">
              {received.map(shipment => (
                <div key={shipment._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm hover:border-slate-350 transition relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-full bg-purple-500" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{shipment.wasteCategory}</span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Received Date: {new Date(shipment.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2.5 py-1 rounded-xl">
                      {shipment.estimatedWeight} kg
                    </span>
                  </div>

                  <button
                    onClick={() => handleMarkRecycled(shipment._id)}
                    className="w-full bg-slate-100 hover:bg-emerald-500 dark:bg-slate-800 dark:hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition border border-transparent hover:border-emerald-450 hover:shadow shadow-emerald-500/10"
                  >
                    <span>Process & Mark Recycled</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Processed History List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Processed Shipments Logs</h3>
        {recycled.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-xs text-slate-400">
            No completed shipments logged.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-extrabold">
                  <th className="p-4">Request Category</th>
                  <th className="p-4">Weight (kg)</th>
                  <th className="p-4">Collector</th>
                  <th className="p-4">Completion Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recycled.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition">
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-250">{r.wasteCategory}</td>
                    <td className="p-4 font-extrabold text-slate-700 dark:text-slate-300">{r.estimatedWeight} kg</td>
                    <td className="p-4">{(r.collector as any)?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-400">{new Date(r.updatedAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                        <span>RECYCLED</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
