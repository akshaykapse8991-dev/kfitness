import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Source {
  title: string;
  uri: string;
}

const RESEARCH_SUGGESTIONS = [
  'Creatine monohydrate timing, dosage, and kidney safety meta-analysis',
  'Rep In Reserve (RIR) vs Training to Failure for hypertrophy',
  'Ashwagandha clinical trials on strength, testosterone, and cortisol',
  'Optimal daily protein distribution for maximal muscle protein synthesis',
  'Fasted cardio vs fed cardio for visceral fat loss comparison',
  'Active recovery vs passive rest on DOMS and muscle glycogen replenishment',
];

export const FitnessScienceSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/search-science', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      if (data.success && data.answer) {
        setAnswer(data.answer);
        setSources(data.sources || []);
        setSearchQueries(data.webSearchQueries || []);
      } else {
        throw new Error(data.error || 'Failed to fetch search-grounded science');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error conducting grounded fitness search');
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
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Fitness & Nutrition Science Grounding
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Google Search Grounded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded real-time scientific citations for supplements, biomechanics, and nutrition meta-analyses.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fitness science (e.g. Creatine safety, RPE vs RIR, optimal protein per meal)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Search Science</span>
          </button>
        </form>
      </div>

      {/* Suggested Research Topics */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 block flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          Popular Research Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {RESEARCH_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sug);
                handleSearch(sug);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-300 transition flex items-center gap-1.5"
            >
              <span>{sug}</span>
              <ArrowRight className="w-3 h-3 text-emerald-400/70" />
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Results Section */}
      {answer && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Main Answer */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Scientifically Grounded Findings
              </h3>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
              {answer}
            </div>
          </div>

          {/* Real Cited Sources from Google Search Grounding */}
          {sources.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                Verified Citations & Sources ({sources.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition flex items-center justify-between gap-2 group"
                  >
                    <span className="truncate font-medium">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Web Search Queries Used */}
          {searchQueries.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Grounding search terms:</span>
              <div className="flex flex-wrap gap-1.5">
                {searchQueries.map((q, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono"
                  >
                    "{q}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
