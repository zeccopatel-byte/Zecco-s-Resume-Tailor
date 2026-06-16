import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Send, Sliders, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TweakPanelProps {
  documentType: 'resume' | 'cover-letter' | 'cold-email' | 'ats-report';
  content: string;
  jobDescription: string;
  onRefined: (newContent: string) => void;
}

export default function TweakPanel({ documentType, content, jobDescription, onRefined }: TweakPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Define some fast pre-crafted prompt chips based on the active tab document type
  const getQuickTips = () => {
    switch (documentType) {
      case 'resume':
        return [
          { label: 'One-page fit', text: 'Condense the resume spacing and paragraphs so that it fits exactly onto a single page without losing critical terms.' },
          { label: 'Enrich dynamic verbs', text: 'Rewrite bullet points so that every line starts with a highly engaging, senior action verb instead of simple descriptors.' },
          { label: 'Highlight leadership', text: 'Reframe accomplishments to emphasize team leadership, product ownership, and guiding juniors.' },
          { label: 'Quantify metrics', text: 'Strengthen achievements by adding or highlighting representative quantified business metrics and outcomes.' },
        ];
      case 'cover-letter':
        return [
          { label: 'More enthusiastic', text: 'Make the tone of this cover letter more enthusiastic, highly engaged, and uniquely expressive of personality.' },
          { label: 'Shorter & punchier', text: 'Shorten this cover letter to under 300 words, removing fluff to make it extremely punchy and fast to read.' },
          { label: 'Focus on portfolio', text: 'Naturally mention my custom design system and my professional portfolio URL a second time with enthusiasm.' },
        ];
      case 'cold-email':
        return [
          { label: 'More conversational', text: 'Make the cold email sound extremely conversational and human, like one designer talking to another, avoiding all corporate cliches.' },
          { label: 'Direct follow-up', text: 'Adjust this to be a fast follow-up email assuming I previously applied on their portal.' },
        ];
      default:
        return [];
    }
  };

  const chips = getQuickTips();

  const handleRefine = async (customInstruction?: string) => {
    const finalInstruction = customInstruction || instruction;
    if (!finalInstruction.trim() || !content.trim()) return;

    setIsRefining(true);
    setError('');
    setSuccessMessage(false);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          content,
          instruction: finalInstruction,
          jobDescription,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error while refining. Please try again.');
      }

      const data = await res.json();
      if (data.output) {
        onRefined(data.output);
        setInstruction('');
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        throw new Error('Could not get refined text from AI service.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during dynamic refinement.');
    } finally {
      setIsRefining(false);
    }
  };

  if (documentType === 'ats-report') return null;

  return (
    <div className="flex flex-col gap-4 border border-indigo-500/10 bg-indigo-500/5 rounded-3xl p-5 shadow-inner">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          AI Refine Co-pilot
        </h4>
        <span className="text-[10px] font-mono text-indigo-300 font-semibold px-2 py-0.5 bg-indigo-500/20 rounded border border-indigo-400/20 uppercase">
          Interactive Tweak
        </span>
      </div>

      <p className="text-xs text-white/50">
        Need some revisions? Tell the co-pilot to tweak wording, shorten bullet points, or adapt formatting directly.
      </p>

      {/* QUICK PRESETS CHIPS */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleRefine(chip.text)}
              disabled={isRefining}
              className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 border border-white/5 rounded-lg transition-all text-left flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* INPUT FORM */}
      <div className="relative mt-2 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-1.5 focus-within:border-indigo-500/50 transition-all">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
          placeholder={`Instruct AI to edit this ${documentType}... (e.g. "make it more concise")`}
          disabled={isRefining}
          className="flex-grow bg-transparent text-sm text-slate-100 placeholder:text-white/20 focus:outline-none px-3"
        />
        <button
          onClick={() => handleRefine()}
          disabled={isRefining || !instruction.trim()}
          className="h-8 w-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-white/5 transition-all cursor-pointer"
        >
          {isRefining ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* STATUS AND FEEDBACK MESSAGES */}
      <AnimatePresence mode="wait">
        {isRefining && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-indigo-300 flex items-center gap-2 px-1 py-0.5"
          >
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            Polishing document sentences with your requested constraints...
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-emerald-400 flex items-center gap-2 px-1 py-0.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            AI successfully polished and updated the preview!
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 px-1 py-0.5"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
