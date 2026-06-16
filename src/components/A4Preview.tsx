import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Edit3, Eye, FileText, CheckCircle, Mail, FileSignature, Save } from 'lucide-react';

interface A4PreviewProps {
  value: string;
  onChange: (newValue: string) => void;
  documentType: 'resume' | 'cover-letter' | 'cold-email' | 'ats-report';
}

export default function A4Preview({ value, onChange, documentType }: A4PreviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Return heading label based on document type
  const getHeaderInfo = () => {
    switch (documentType) {
      case 'resume':
        return { title: 'Tailored Resume', icon: <FileText className="w-4 h-4 text-blue-400" /> };
      case 'cover-letter':
        return { title: 'Tailored Cover Letter', icon: <FileSignature className="w-4 h-4 text-emerald-400" /> };
      case 'cold-email':
        return { title: 'Personalized Cold Email', icon: <Mail className="w-4 h-4 text-indigo-400" /> };
      default:
        return { title: 'ATS Analysis Report', icon: <CheckCircle className="w-4 h-4 text-amber-400" /> };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50">
      {/* HEADER BAR FOR CONTROL */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-black/25">
        <div className="flex items-center gap-2">
          {header.icon}
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{header.title}</span>
        </div>
        
        {/* EDIT / PREVIEW TOGGLE */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            onClick={() => setIsEditing(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              !isEditing 
                ? 'bg-white/10 text-white shadow' 
                : 'text-white/60 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isEditing 
                ? 'bg-white/10 text-white shadow' 
                : 'text-white/60 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Text
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center bg-black/40 min-h-[480px]">
        {isEditing ? (
          <div className="w-full max-w-3xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono px-3">
              <span>MARKDOWN EDITOR ACTIVATED</span>
              <span>AUTO-SAVES TO LIVE EXPORTS</span>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 w-full bg-slate-950/70 border border-indigo-500/25 rounded-2xl p-6 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all focus:border-indigo-500"
              placeholder="Enter markdown resume or document text..."
            />
          </div>
        ) : (
          /* FORMAL PAPER SHEET PREVIEW */
          <div 
            id="a4-print-element"
            className="w-full max-w-3xl shadow-2xl rounded-xl border border-gray-200 bg-white p-8 md:p-12 text-slate-900 transition-all font-serif min-h-[750px] relative overflow-hidden"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* CORRESPONDENCE TYPE WATERMARK ACCENT */}
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 rotate-45 w-32 h-32 bg-indigo-50 border-b border-indigo-100/50 pointer-events-none hidden md:block" />
            
            <div className="print-a4-sheet text-[11pt] leading-[1.4] text-black">
              <style>{`
                .print-a4-sheet h1 {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 16pt;
                  font-weight: bold;
                  margin-bottom: 6px;
                  text-align: left;
                  color: #000;
                  line-height: normal;
                }
                .print-a4-sheet p {
                  margin-top: 4px;
                  margin-bottom: 6px;
                }
                .print-a4-sheet p a, .print-a4-sheet a {
                  color: #0000ee !important;
                  text-decoration: underline !important;
                }
                .print-a4-sheet ul {
                  margin-top: 4px;
                  margin-bottom: 8px;
                  padding-left: 20px;
                  list-style-type: disc;
                }
                .print-a4-sheet li {
                  margin-bottom: 3px;
                }
                .print-a4-sheet hr {
                  border: 0;
                  border-top: 1px solid #000;
                  margin: 6px 0;
                }
                .print-a4-sheet h2, .print-a4-sheet h3 {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 11pt;
                  font-weight: bold;
                  margin-top: 12px;
                  margin-bottom: 3px;
                  color: #000;
                }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {value}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
