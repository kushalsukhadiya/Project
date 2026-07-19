import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MapPicker } from '../components/MapPicker';
import { 
  Leaf, Upload, Sparkles, AlertCircle, 
  Scale, Info, Calendar
} from 'lucide-react';

// Decoupled Impact calculator for frontend use
const getLocalImpact = (category: string, weight: number) => {
  let pointsPerKg = 10;
  let co2SavedPerKg = 1.5;
  let recyclability = 70; // %

  switch (category) {
    case 'PET Bottles':
      pointsPerKg = 15;
      co2SavedPerKg = 1.8;
      recyclability = 92;
      break;
    case 'Plastic Bottles':
      pointsPerKg = 12;
      co2SavedPerKg = 1.6;
      recyclability = 85;
      break;
    case 'Industrial Plastic':
      pointsPerKg = 20;
      co2SavedPerKg = 2.2;
      recyclability = 95;
      break;
    case 'Food Packaging':
      pointsPerKg = 8;
      co2SavedPerKg = 1.2;
      recyclability = 55;
      break;
    default:
      pointsPerKg = 10;
      co2SavedPerKg = 1.4;
      recyclability = 75;
  }

  return {
    points: Math.round(weight * pointsPerKg),
    co2: parseFloat((weight * co2SavedPerKg).toFixed(1)),
    recyclability
  };
};

export const ReportWaste: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [category, setCategory] = useState('PET Bottles');
  const [weight, setWeight] = useState('5');
  const [pickupDate, setPickupDate] = useState(() => {
    // Tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  // AI & Geolocation States
  const [scanning, setScanning] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [nearestCenter, setNearestCenter] = useState<{ name: string; dist: number } | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Mock list of recycling facilities in Mumbai to calculate closest option
  const recyclingCenters = [
    { name: 'GreenTech Recyclers Goregaon', lat: 19.1663, lng: 72.8480 },
    { name: 'EcoSmart Facility Dharavi', lat: 19.0380, lng: 72.8538 },
    { name: 'Mumbai Plastic Eco-Works Kurla', lat: 19.0726, lng: 72.8800 }
  ];

  // Haversine formula to compute closest center
  const calculateNearestCenter = (lat: number, lng: number) => {
    let closestIndex = 0;
    let minDistance = Infinity;

    recyclingCenters.forEach((center, idx) => {
      const R = 6371; // Earth radius in km
      const dLat = (center.lat - lat) * (Math.PI / 180);
      const dLng = (center.lng - lng) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(center.lat * (Math.PI / 180)) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    setNearestCenter({
      name: recyclingCenters[closestIndex].name,
      dist: parseFloat(minDistance.toFixed(1))
    });
  };

  useEffect(() => {
    calculateNearestCenter(latitude, longitude);
  }, [latitude, longitude]);

  // Handle map coordinates selection
  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  // Image upload triggers AI Scanning
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImages([file]);
    
    // Scan Image via AI mock
    setScanning(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.requests.classifyImage(formData);
      setCategory(res.estimatedCategory);
      setAiConfidence(res.confidence);
      setImageUrl(res.imageUrl);
    } catch (err: any) {
      console.error(err);
      setError('AI scanner had trouble classifying. You can still select manually.');
    } finally {
      setScanning(false);
    }
  };

  // Submit report request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Please select a pickup location on the interactive map.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('wasteCategory', category);
      formData.append('estimatedWeight', weight);
      formData.append('pickupDate', pickupDate);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('address', address);
      
      if (images.length > 0) {
        formData.append('images', images[0]);
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      await api.requests.create(formData);
      alert('Waste reported successfully! Collectors have been notified.');
      navigate('/citizen');
    } catch (err: any) {
      setError(err.message || 'Failed to submit waste report.');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic calculations
  const weightNum = parseFloat(weight) || 0;
  const metrics = getLocalImpact(category, weightNum);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <Leaf className="w-6 h-6 text-emerald-500" />
          <span>Report Plastic Waste</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pin your collection location, upload snapshots, and let AI estimate recyclability.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Parameters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          {/* File scan section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Upload Plastic Image (AI scanner)</label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-emerald-450 dark:hover:border-emerald-600 rounded-2xl p-4 text-center cursor-pointer transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 flex flex-col items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl.startsWith('/uploads') ? `http://localhost:5000${imageUrl}` : imageUrl}
                    alt="Uploaded waste"
                    className="h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow"
                  />
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                )}
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {images[0] ? images[0].name : 'Click to upload and scan plastic type'}
                </span>
              </div>
            </div>
            
            {scanning && (
              <div className="flex items-center justify-center space-x-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-600 dark:text-emerald-400 font-bold rounded-xl animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI processing pixel features...</span>
              </div>
            )}

            {aiConfidence && !scanning && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold rounded-xl flex justify-between">
                <span>✓ AI Classification Suggestion: {category}</span>
                <span>Confidence: {aiConfidence}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Waste Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
              >
                {[
                  'PET Bottles', 'Plastic Bottles', 'Food Packaging', 
                  'Containers', 'Plastic Bags', 'Industrial Plastic', 
                  'Mixed Plastic', 'Other'
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Estimated weight */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Estimated Weight (kg)</label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Desired Pickup Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Impact preview panel */}
          <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/10 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Environmental Impact Preview</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400">Recyclability</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-emerald-450 mt-1">{metrics.recyclability}%</div>
              </div>
              <div className="bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400">Reward Points</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-emerald-450 mt-1">+{metrics.points}</div>
              </div>
              <div className="bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400">CO₂ Offset</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-emerald-450 mt-1">{metrics.co2} kg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map picker & nearest center recommendation */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Pin Pickup Location on Map</label>
            <div className="h-72">
              <MapPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>

          {/* Nearest Recycling Facility Panel */}
          {nearestCenter && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center space-x-3 text-xs shadow-sm">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-slate-850 dark:text-slate-300">Closest Recycling Facility Found</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <b>{nearestCenter.name}</b> is approx <b>{nearestCenter.dist} km</b> away from your pin.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/15 flex items-center justify-center space-x-2 text-sm"
          >
            {submitting ? 'Submitting Report...' : 'Confirm & Request Collection'}
          </button>
        </div>
      </form>
    </div>
  );
};
