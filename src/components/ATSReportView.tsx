import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface ATSReportViewProps {
  reportText: string;
}

export default function ATSReportView({ reportText }: ATSReportViewProps) {
  // Parse the report text
  const parseReport = () => {
    const matched: string[] = [];
    const unmatched: { keyword: string; reason: string }[] = [];
    let score = 75; // Default score

    if (!reportText) return { matched, unmatched, score };

    // Try to extract score
    const scoreMatch = reportText.match(/MATCH SCORE ESTIMATE:\s*(\d+)%/i);
    if (scoreMatch && scoreMatch[1]) {
      score = parseInt(scoreMatch[1], 10);
    }

    // Try to split sections
    const lines = reportText.split('\n');
    let currentSection: 'none' | 'matched' | 'unmatched' = 'none';

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.toLowerCase().includes('keywords found') || trimmed.toLowerCase().includes('added/matched')) {
        currentSection = 'matched';
        continue;
      } else if (trimmed.toLowerCase().includes('not addressable') || trimmed.toLowerCase().includes('keywords in job description not')) {
        currentSection = 'unmatched';
        continue;
      } else if (trimmed.toLowerCase().includes('match score estimate')) {
        currentSection = 'none';
        continue;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.substring(1).trim();
        if (currentSection === 'matched') {
          matched.push(itemText);
        } else if (currentSection === 'unmatched') {
          // Check for reason separator "—" or "-" or ":"
          const separatorIdx = itemText.search(/(?:—|-|:)\s*Reason:/i);
          if (separatorIdx !== -1) {
            const keyword = itemText.substring(0, separatorIdx).trim();
            const reasonPart = itemText.substring(separatorIdx).replace(/^(?:—|-|:)/, '').trim();
            const reason = reasonPart.replace(/Reason:\s*/i, '').trim();
            unmatched.push({ keyword, reason });
          } else {
            unmatched.push({ keyword: itemText, reason: 'Not in candidate background' });
          }
        }
      }
    }

    // Edge case: if parsing found nothing on lines, back it up with simplified extraction
    if (matched.length === 0 && unmatched.length === 0) {
      // Fallback regex parsers
      const matchBlock = reportText.match(/ADDED\/MATCHED IN RESUME:([\s\S]*?)(?:KEYWORDS IN JOB|$)/i);
      if (matchBlock) {
        const matches = matchBlock[1].match(/-\s*([^\n]+)/g);
        if (matches) {
          matches.forEach(m => matched.push(m.replace(/^-\s*/, '').trim()));
        }
      }
    }

    return { matched, unmatched, score };
  };

  const { matched, unmatched, score } = parseReport();

  // Color logic for score gauge
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400 stroke-emerald-400';
    if (val >= 70) return 'text-indigo-400 stroke-indigo-400';
    return 'text-amber-400 stroke-amber-400';
  };

  const getScoreBg = (val: number) => {
    if (val >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (val >= 70) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  // SVG calculations for radial progress wheel
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div id="ats-report-container" className="flex flex-col gap-8">
      {/* SCORE HEADER HERO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white/5 border border-white/10 p-6 rounded-2xl">
        {/* RADIAL CIRCLE */}
        <div className="flex flex-col items-center justify-center relative">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-white/5"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              className={getScoreColor(score)}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight text-white">{score}%</span>
            <span className="text-[10px] uppercase font-semibold text-white/50 tracking-wider">Match-Score</span>
          </div>
        </div>

        {/* METRIC ANALYSIS CARD */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getScoreBg(score)}`}>
              {score >= 85 ? 'Highly Compatible' : score >= 70 ? 'ATS Optimized' : 'Needs Optimization'}
            </span>
          </div>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Applicant Tracking System Check
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {score >= 85 
              ? 'Excellent keyword alignment! Your tailored resume matches the target job description naturally with proper density, significantly maximizing your chance of passing automatic screeners.'
              : score >= 70 
              ? 'Good keyword match. We successfully integrated a major subset of design skills and technologies. You can further adjust the bullet points using specific achievements to increase this score.'
              : 'Moderate match alignment. Consider manually editing or refining your profile text to incorporate more keywords listed in the missing section below.'}
          </p>
        </div>
      </div>

      {/* KEYWORD SECTIONS SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MATCHED BADGES */}
        <div className="flex flex-col bg-black/20 border border-white/10 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-3">
            <CheckCircle2 className="w-4 h-4" />
            Matched Keywords ({matched.length})
          </h4>
          {matched.length === 0 ? (
            <p className="text-xs text-white/40 italic p-4 text-center">No exact keywords extracted.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto pr-1">
              {matched.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium transition-all hover:bg-emerald-500/15"
                >
                  <Zap className="w-3 h-3 text-emerald-400 mr-1 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* UNMATCHED BADGES */}
        <div className="flex flex-col bg-black/20 border border-white/10 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 uppercase tracking-wider mb-4 border-b border-amber-500/10 pb-3">
            <AlertTriangle className="w-4 h-4" />
            Missing/Gap Keywords ({unmatched.length})
          </h4>
          {unmatched.length === 0 ? (
            <p className="text-xs text-emerald-400 font-medium italic p-4 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              Incredible! You matched 100% of primary requirements.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {unmatched.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col bg-amber-500/5 text-amber-300 border border-amber-500/10 px-3 py-2 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>{item.keyword}</span>
                    <span className="text-[10px] text-amber-400/60 uppercase font-semibold">Skill Gap</span>
                  </div>
                  <span className="text-[11px] text-white/50">{item.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
