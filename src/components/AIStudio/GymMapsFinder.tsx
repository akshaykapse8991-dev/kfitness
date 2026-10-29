import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Star,
  ExternalLink,
  Dumbbell,
  Sparkles,
  Search,
  MessageSquare,
  Building,
} from 'lucide-react';

interface Place {
  title: string;
  uri: string;
  snippets: string[];
}

const CATEGORIES = [
  { id: 'Gyms & Heavy Lifting Centers', label: 'Gyms & Crossfit', icon: Dumbbell },
  { id: 'Yoga & Pilates Studios', label: 'Yoga & Pilates', icon: Compass },
  { id: 'Swimming Pools & Athletic Running Tracks', label: 'Pools & Tracks', icon: Navigation },
  { id: 'Healthy Nutrition & Sports Supplement Stores', label: 'Nutrition & Supplements', icon: Building },
];

export const GymMapsFinder: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [locationInput, setLocationInput] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [overviewText, setOverviewText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto detect user location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationInput(`GPS: (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMessage('Could not fetch precise GPS location. Enter your city or area manually.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSearchPlaces = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        category: selectedCategory,
        locationName: locationInput.trim() || undefined,
      };

      if (userCoords) {
        payload.latitude = userCoords.lat;
        payload.longitude = userCoords.lng;
      }

      const res = await fetch('/api/ai/nearby-fitness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setOverviewText(data.answer);
        setPlaces(data.places || []);
      } else {
        throw new Error(data.error || 'Failed to search nearby facilities');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error querying Google Maps Grounding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-6 gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Nearby Gyms & Fitness Facilities
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Google Maps Grounded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Find verified local gyms, crossfit boxes, running tracks, and supplement stores with real Maps data.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Location Input Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => {
              setLocationInput(e.target.value);
              setUserCoords(null);
            }}
            placeholder="Enter city, neighborhood, or postal code (e.g. Pune, Bandra Mumbai, Indiranagar Bangalore)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-300 font-semibold flex items-center justify-center gap-2 transition shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS'}</span>
        </button>

        <button
          type="button"
          onClick={handleSearchPlaces}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition shrink-0"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Search Maps</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Grounded Overview Text */}
      {overviewText && (
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            AI Facility Analysis
          </div>
          {overviewText}
        </div>
      )}

      {/* Verified Google Maps Place Cards */}
      {places.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Direct Google Maps Locations ({places.length}):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {places.map((place, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition">
                      {place.title}
                    </h4>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                  </div>

                  {place.snippets && place.snippets.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {place.snippets.slice(0, 2).map((snip, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2 text-xs text-slate-400 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-850"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                          <span>"{snip}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={place.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
