import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LeaderboardUser } from '../types';
import { SkeletonList } from '../components/SkeletonLoader';
import { Award, Trophy, Medal, Star, Shield, ArrowUp } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.auth.getLeaderboard();
        setLeaders(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400 fill-slate-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600 fill-amber-500" />;
      default:
        return <span className="font-extrabold text-sm text-slate-400 w-6 text-center">{rank}</span>;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800';
      case 'Gold': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-250 dark:border-yellow-800';
      case 'Silver': return 'text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/20 p-6 sm:p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800/40 relative overflow-hidden space-y-3">
        <div className="inline-flex p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 animate-pulse">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">EcoCycle Contributor Leaderboard</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Honoring the top citizens who have recycled the most plastic waste and earned environmental reward points.
        </p>
      </div>

      {/* Top 3 Spotlight Cards */}
      {leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end pt-4">
          {/* Rank 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm flex flex-col items-center space-y-2 h-[160px] justify-center relative">
            <div className="absolute top-2 left-2">{getRankIcon(2)}</div>
            <img src={leaders[1].profilePicture} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
            <div className="font-extrabold text-xs text-slate-800 dark:text-white truncate w-full">{leaders[1].name.split(' ')[0]}</div>
            <div className="text-[11px] font-extrabold text-emerald-500">+{leaders[1].rewards.points} pts</div>
          </div>
          
          {/* Rank 1 */}
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 p-5 rounded-3xl text-center shadow-md flex flex-col items-center space-y-2 h-[180px] justify-center relative scale-105">
            <div className="absolute top-2 left-2">{getRankIcon(1)}</div>
            <img src={leaders[0].profilePicture} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500" />
            <div className="font-extrabold text-sm text-slate-800 dark:text-white truncate w-full">{leaders[0].name.split(' ')[0]}</div>
            <div className="text-xs font-extrabold text-emerald-500">+{leaders[0].rewards.points} pts</div>
          </div>

          {/* Rank 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm flex flex-col items-center space-y-2 h-[155px] justify-center relative">
            <div className="absolute top-2 left-2">{getRankIcon(3)}</div>
            <img src={leaders[2].profilePicture} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
            <div className="font-extrabold text-xs text-slate-800 dark:text-white truncate w-full">{leaders[2].name.split(' ')[0]}</div>
            <div className="text-[11px] font-extrabold text-emerald-500">+{leaders[2].rewards.points} pts</div>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {leaders.map((leader, index) => (
            <div 
              key={leader._id} 
              className={`p-4 flex items-center justify-between transition ${
                index < 3 ? 'bg-slate-50/20 dark:bg-slate-850/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="w-6 flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* Avatar */}
                <img 
                  src={leader.profilePicture} 
                  alt="" 
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                />

                {/* Name & Details */}
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{leader.name}</div>
                  <span className="text-[10px] text-slate-400">{leader.area}, {leader.city}</span>
                </div>
              </div>

              {/* Status Points & Tier Badge */}
              <div className="flex items-center space-x-3 text-right">
                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${getTierColor(leader.rewards.tier)}`}>
                  {leader.rewards.tier}
                </span>
                <span className="font-extrabold text-emerald-500 text-xs">
                  {leader.rewards.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
