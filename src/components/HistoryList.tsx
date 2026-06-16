import React from 'react';
import { History, Calendar, Trash2, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';
import { TailorResult } from '../types';

interface HistoryListProps {
  history: TailorResult[];
  activeId: string | null;
  onSelect: (item: TailorResult) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClearNew: () => void;
}

export default function HistoryList({ history, activeId, onSelect, onDelete, onClearNew }: HistoryListProps) {
  return (
    <div className="flex flex-col gap-4 border border-white/10 bg-white/5 rounded-3xl p-5 shadow-inner">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          Tailoring History
        </h3>
        
        {/* NEW APPLICATION RESET KEY */}
        <button
          onClick={onClearNew}
          className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Tailor
        </button>
      </div>

      {history.length === 0 ? (
        <div className="py-6 px-3 text-center text-xs text-white/30 italic flex flex-col items-center justify-center gap-2">
          <p>No recently saved sessions.</p>
          <p className="text-[10px] leading-relaxed">Tailored resumes you generate will be safely saved in your browser history automatically.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto pr-1">
          {history.map((item) => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isActive = activeId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/15 border-indigo-500/40 shadow-md'
                    : 'bg-black/15 border-white/5 hover:bg-black/25 hover:border-white/10'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item);
                  }
                }}
              >
                {/* ACTIVE TAB ACCENT LINE */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}
                
                <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                    {item.jobTitle}
                  </span>
                  <span className="text-[11px] text-white/50 truncate">
                    {item.companyName || 'Target Company'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center text-[9px] text-white/40">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      {formattedDate}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 font-semibold text-[9px] rounded-md border border-indigo-500/10">
                      {item.matchScore}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => onDelete(item.id, e)}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-white/40 transition-all cursor-pointer"
                    title="Delete tailoring record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
