import React from 'react';
import { Navbar } from './Navbar';
import { Leaf } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-150 transition-colors duration-200">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="fade-in">
          {children}
        </div>
      </main>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500 font-extrabold text-sm">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>EcoCycle Portal</span>
          </div>
          <p className="font-medium text-[11px] tracking-wide">
            © {new Date().getFullYear()} EcoCycle. Helping citizens and collectors clean plastic waste together.
          </p>
          <div className="flex space-x-4 font-semibold text-[11px]">
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
