import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Leaf, ShieldCheck, MapPin, Award, ArrowRight, 
  Trash2, TrendingUp, Users, Recycle 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'municipal': return '/municipal';
      case 'collector': return '/collector';
      case 'recycler': return '/recycler';
      default: return '/citizen';
    }
  };

  const dashboardLink = getDashboardLink();

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/20 px-6 py-16 sm:px-12 sm:py-24 text-center border border-slate-200/50 dark:border-slate-800/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 animate-slow-spin">
          <Leaf className="w-48 h-48 text-emerald-500" />
        </div>
        
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Leaf className="w-3.5 h-3.5" />
            <span>Join The Smart Recycling Movement</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Connect. Collect.<br/>
            <span className="text-emerald-500 bg-clip-text">Save the Planet.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-350 max-w-2xl mx-auto leading-relaxed">
            EcoCycle connects citizens, local waste collectors, and recycling centers in one seamless, rewards-driven platform to make plastic disposal simple, transparent, and smart.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to={dashboardLink}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#rewards"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl border border-slate-200 dark:border-slate-800 transition hover:-translate-y-0.5"
            >
              Learn Rewards
            </a>
          </div>
        </div>
      </section>

      {/* Environmental Metrics (Live Impact Counters) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-6 hover:shadow-md transition">
          <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-2xl">
            <Trash2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">4,280 kg</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Plastic Waste Collected</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-6 hover:shadow-md transition">
          <div className="p-4 bg-blue-500/10 dark:bg-blue-950/30 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">6,848 kg</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">CO₂ Emissions Prevented</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-6 hover:shadow-md transition">
          <div className="p-4 bg-yellow-500/10 dark:bg-yellow-950/30 rounded-2xl">
            <Users className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">1,500+</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Active Eco-Citizens</div>
          </div>
        </div>
      </section>

      {/* Dynamic Workflow */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">How EcoCycle Works</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            A simple, end-to-end transparent loop linking garbage reporting to industrial recycling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {[
            { step: '01', title: 'Citizen Reports', desc: 'Pin request on the map and scan plastic type using AI estimations.', icon: MapPin },
            { step: '02', title: 'Collector Picks Up', desc: 'Collector accepts, navigates to the location, and uploads proof.', icon: ShieldCheck },
            { step: '03', title: 'Recycling Receipt', desc: 'Recycler confirms receiving shipment and processes the plastic.', icon: Recycle },
            { step: '04', title: 'Verify & Rewards', desc: 'Admin verifies recycling, credits points, and upgrades user tiers.', icon: Award }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 relative space-y-4 shadow-sm hover:-translate-y-1 transition duration-200">
                <div className="flex justify-between items-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-extrabold text-slate-200 dark:text-slate-800">{item.step}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rewards System Info */}
      <section id="rewards" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 space-y-10 shadow-sm">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl">
            <Award className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">EcoCycle Loyalty Tiers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Earn points based on the weight of plastic recycled. Level up your impact status!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tier: 'Bronze', points: '0 - 299 pts', color: 'border-amber-700 bg-amber-500/5 text-amber-700', desc: 'Entry tier. Complete your first recycling report.' },
            { tier: 'Silver', points: '300 - 799 pts', color: 'border-slate-400 bg-slate-500/5 text-slate-500 dark:text-slate-350', desc: 'Level up. Receive exclusive eco badges.' },
            { tier: 'Gold', points: '800 - 1499 pts', color: 'border-yellow-500 bg-yellow-500/5 text-yellow-600 dark:text-yellow-450', desc: 'Top contributor. Eligible for local shopping coupon rewards.' },
            { tier: 'Platinum', points: '1500+ pts', color: 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400', desc: 'Eco Legend. VIP features & zero pickup dispatch fee priorities.' }
          ].map((item, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border-2 ${item.color} text-center space-y-3`}>
              <Award className="w-10 h-10 mx-auto" />
              <h3 className="font-extrabold text-lg">{item.tier}</h3>
              <div className="font-extrabold text-sm opacity-80">{item.points}</div>
              <p className="text-xs opacity-70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
