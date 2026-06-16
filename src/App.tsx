import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  Briefcase, 
  FileSignature, 
  Copy, 
  Download, 
  Loader2, 
  Sparkles, 
  FileDown, 
  Mail, 
  Layout, 
  Lightbulb, 
  Compass, 
  ShieldCheck,
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { cn } from './lib/utils';
import { saveAs } from 'file-saver';
import * as marked from 'marked';

// Import newly created features
import ATSReportView from './components/ATSReportView';
import A4Preview from './components/A4Preview';
import TweakPanel from './components/TweakPanel';
import HistoryList from './components/HistoryList';
import { demoProfiles } from './samples';
import { TailorResult, DemoProfile } from './types';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  
  const [resumeOutput, setResumeOutput] = useState('');
  const [coverLetterOutput, setCoverLetterOutput] = useState('');
  const [coldEmailOutput, setColdEmailOutput] = useState('');
  const [atsReportOutput, setAtsReportOutput] = useState('');

  const [activeTab, setActiveTab] = useState('resume');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  
  // Local storage history
  const [history, setHistory] = useState<TailorResult[]>(() => {
    try {
      const saved = localStorage.getItem('zecco_tailor_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animate processing step statements while tailoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      const steps = [
        'Analyzing core skills and historical background...',
        'Extracting job keywords and structural guidelines...',
        'Optimizing professional resume headings and bulleted metrics...',
        'Drafting executive, high-impact cover letter paragraphs...',
        'Formulating conversational cold email draft with portfolio integration...',
        'Calculating final ATS match score and compiling report details...',
        'Polishing markdown files for secure print downloads...'
      ];
      let currentIdx = 0;
      setGenerationStep(steps[0]);
      interval = setInterval(() => {
        currentIdx = (currentIdx + 1) % steps.length;
        setGenerationStep(steps[currentIdx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/extract-resume', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`[extract-resume] Server returned status ${res.status} with content-type ${contentType}. Body snippet: ${text.substring(0, 100)}`);
      }

      if (res.ok) {
        setResumeText(data.text);
      } else {
        alert(data.error || 'Failed to extract text from file.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = (profile: DemoProfile) => {
    setResumeText(profile.resumeText);
    setJobDescription(profile.jobDescription);
    setActiveHistoryId(null);
  };

  const handleGenerate = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert('Please provide both resume text and a job description.');
      return;
    }

    setIsGenerating(true);
    setResumeOutput('');
    setCoverLetterOutput('');
    setColdEmailOutput('');
    setAtsReportOutput('');

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response from server (Status ${res.status}, Type ${contentType}). If this persists, the AI service might be overloaded.`);
      }

      if (!res.ok) {
        let errorMessage = 'Failed to generate content';
        if (data.error) {
          if (typeof data.error === 'string') errorMessage = data.error;
          else if (data.error.message) errorMessage = data.error.message;
          else errorMessage = JSON.stringify(data.error);
        }
        throw new Error(errorMessage);
      }

      const fullOutput = data.output;
      
      // Parse output blocks based on the master prompt structure
      const extractSection = (markerStart: string) => {
        const marker = `[${markerStart}]`;
        const startIdx = fullOutput.indexOf(marker);
        if (startIdx === -1) return '';
        
        let content = fullOutput.substring(startIdx + marker.length);
        content = content.replace(/^\s*=+\s*/, '').trim();
        
        const nextMarkerRegex = /\n\s*(?:={3,}\s*)?\[(?:TAILORED RESUME|COVER LETTER|COLD EMAIL|ATS KEYWORD MATCH REPORT)\]/i;
        const nextMatch = content.match(nextMarkerRegex);
        
        if (nextMatch && nextMatch.index !== undefined) {
          content = content.substring(0, nextMatch.index);
        }
        
        content = content.replace(/\s*=+\s*$/, '').trim();
        return content;
      };

      const extractedResume = extractSection('TAILORED RESUME');
      const extractedCL = extractSection('COVER LETTER');
      const extractedEmail = extractSection('COLD EMAIL');
      const extractedATS = extractSection('ATS KEYWORD MATCH REPORT');

      // Style cleanups
      const parsedResume = extractedResume.replace(/^=+\n/g, '').trim() || 'Could not parse resume part correctly:\n' + fullOutput;
      const parsedCL = extractedCL.replace(/^=+\n/g, '').trim();
      const parsedEmail = extractedEmail.replace(/^=+\n/g, '').trim();
      const parsedATS = extractedATS.replace(/^=+\n/g, '').trim();

      setResumeOutput(parsedResume);
      setCoverLetterOutput(parsedCL);
      setColdEmailOutput(parsedEmail);
      setAtsReportOutput(parsedATS);
      
      // Parse Score Estimation
      let score = 75;
      const scoreMatch = parsedATS.match(/MATCH SCORE ESTIMATE:\s*(\d+)%/i);
      if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1], 10);
      }

      // Read target company and job title
      let companyName = 'Target Company';
      const companyMatch = jobDescription.match(/(?:Company|Employer):\s*([^\n]+)/i);
      if (companyMatch) {
         companyName = companyMatch[1].trim();
      } else {
         const firstLines = jobDescription.split('\n').filter(l => l.trim());
         if (firstLines.length > 0) {
            companyName = firstLines[0].substring(0, 30).trim();
         }
      }

      let jobTitle = 'Target Role';
      const titleMatch = jobDescription.match(/(?:Position|Title|Job Title|Role):\s*([^\n]+)/i);
      if (titleMatch) {
         jobTitle = titleMatch[1].trim();
      } else {
         const firstLines = jobDescription.split('\n').filter(l => l.trim());
         if (firstLines.length > 1) {
            jobTitle = firstLines[1].substring(0, 30).trim();
         } else if (firstLines.length > 0) {
            jobTitle = firstLines[0].substring(0, 30).trim();
         }
      }

      // Add to local storage history
      const newId = Math.random().toString(36).substring(2, 11);
      const newResult: TailorResult = {
         id: newId,
         timestamp: new Date().toISOString(),
         jobTitle,
         companyName,
         resumeOutput: parsedResume,
         coverLetterOutput: parsedCL,
         coldEmailOutput: parsedEmail,
         atsReportOutput: parsedATS,
         originalResume: resumeText,
         originalJobDesc: jobDescription,
         matchScore: score
      };

      const updatedHistory = [newResult, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('zecco_tailor_history', JSON.stringify(updatedHistory));
      setActiveHistoryId(newId);
      setActiveTab('resume');

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (item: TailorResult) => {
    setActiveHistoryId(item.id);
    setResumeText(item.originalResume);
    setJobDescription(item.originalJobDesc);
    setResumeOutput(item.resumeOutput);
    setCoverLetterOutput(item.coverLetterOutput);
    setColdEmailOutput(item.coldEmailOutput);
    setAtsReportOutput(item.atsReportOutput);
    setActiveTab('resume');
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('zecco_tailor_history', JSON.stringify(updated));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleClearNew = () => {
    setActiveHistoryId(null);
    setResumeText('');
    setJobDescription('');
    setResumeOutput('');
    setCoverLetterOutput('');
    setColdEmailOutput('');
    setAtsReportOutput('');
  };

  const currentOutput = 
    activeTab === 'resume' ? resumeOutput : 
    activeTab === 'cover-letter' ? coverLetterOutput : 
    activeTab === 'cold-email' ? coldEmailOutput :
    atsReportOutput;

  const handleUpdateCurrentOutput = (newValue: string) => {
    if (activeTab === 'resume') setResumeOutput(newValue);
    else if (activeTab === 'cover-letter') setCoverLetterOutput(newValue);
    else if (activeTab === 'cold-email') setColdEmailOutput(newValue);
    else if (activeTab === 'ats') setAtsReportOutput(newValue);

    // Save edited output to history if currently active
    if (activeHistoryId) {
      const updatedHistory = history.map(item => {
        if (item.id === activeHistoryId) {
          return {
            ...item,
            resumeOutput: activeTab === 'resume' ? newValue : item.resumeOutput,
            coverLetterOutput: activeTab === 'cover-letter' ? newValue : item.coverLetterOutput,
            coldEmailOutput: activeTab === 'cold-email' ? newValue : item.coldEmailOutput,
            atsReportOutput: activeTab === 'ats' ? newValue : item.atsReportOutput,
          };
        }
        return item;
      });
      setHistory(updatedHistory);
      localStorage.setItem('zecco_tailor_history', JSON.stringify(updatedHistory));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput);
    alert('Copied to clipboard successfully!');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([currentOutput], { type: 'text/plain;charset=utf-8' });
    const fileName = activeTab === 'resume' 
      ? `Zalak-Patel-UXUI-Designer-10Y-Experience.txt` 
      : activeTab === 'cover-letter' ? `Zalak-Patel-UXUI-Designer-10Y-Experience-CoverLetter.txt`
      : activeTab === 'cold-email' ? `Zalak-Patel-UXUI-Designer-10Y-Experience-ColdEmail.txt`
      : `Zalak-Patel-UXUI-Designer-10Y-Experience-ATS-Report.txt`;
    saveAs(blob, fileName);
  };

  const getHtmlFromMarkdown = () => {
    const rawHtml = marked.parse(currentOutput, { async: false }) as string;
    return `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; background-color: #fff; padding: 20px;">
        <style>
          .pdf-content h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: left;
            color: #000;
          }
          .pdf-content h2, .pdf-content h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 16px;
            margin-bottom: 4px;
            color: #000;
          }
          .pdf-content a {
            color: #0000FF !important;
            text-decoration: underline !important;
          }
          .pdf-content hr {
            display: block;
            border: 0;
            border-top: 1px solid #000;
            margin: 8px 0;
            padding: 0;
          }
          .pdf-content ul {
            margin-top: 4px;
            margin-bottom: 8px;
            padding-left: 20px;
            list-style-type: disc;
          }
          .pdf-content li {
            display: list-item;
            margin-bottom: 4px;
          }
          .pdf-content p {
            margin-top: 4px;
            margin-bottom: 4px;
          }
        </style>
        <div class="pdf-content">
          ${rawHtml}
        </div>
      </div>
    `;
  };

  const handleDownloadDocx = async () => {
    try {
      const htmlString = getHtmlFromMarkdown();
      const response = await fetch('/api/download-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlString }),
      });

      if (!response.ok) throw new Error('Failed to generate DOCX');

      const blob = await response.blob();
      const fileName = activeTab === 'resume' 
        ? 'Zalak-Patel-UXUI-Designer-10Y-Experience.docx' 
        : activeTab === 'cover-letter' ? 'Zalak-Patel-UXUI-Designer-10Y-Experience-CoverLetter.docx'
        : 'Zalak-Patel-UXUI-Designer-10Y-Experience-ColdEmail.docx';
      saveAs(blob, fileName);
    } catch (e) {
      console.error(e);
      alert('Error extracting Microsoft Word DOCX document.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const htmlString = getHtmlFromMarkdown();
      const fileName = activeTab === 'resume' 
        ? 'Zalak-Patel-UXUI-Designer-10Y-Experience.pdf' 
        : activeTab === 'cover-letter' ? 'Zalak-Patel-UXUI-Designer-10Y-Experience-CoverLetter.pdf'
        : 'Zalak-Patel-UXUI-Designer-10Y-Experience-ColdEmail.pdf';

      const opt = {
        margin:       0.5,
        filename:     fileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set(opt).from(htmlString).save();
    } catch (e) {
      console.error(e);
      alert('Error creating PDF presentation.');
    }
  };

  // Icon mapping helper for Demo Chips
  const getDemoIcon = (id: string) => {
    if (id === 'uxui') return <Layout className="w-4 h-4 text-emerald-400" />;
    if (id === 'swe') return <Compass className="w-4 h-4 text-amber-400" />;
    return <Lightbulb className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col p-4 sm:p-8 selection:bg-indigo-505/30">
      
      {/* PROFESSIONAL TITLE HEADER */}
      <header className="max-w-6xl w-full mx-auto mb-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 mb-5 shadow-2xl"
        >
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 bg-gradient-to-br from-white to-white/50 text-transparent bg-clip-text font-sans"
        >
          Zecco's Resume Tailor
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 max-w-xl text-md leading-relaxed"
        >
          Optimize your profile for passing Applicant Tracking Systems instantly. Generate tailored single-page resumes, targeted cover letters, and personalized recruitment outreach.
        </motion.p>

        {/* DEMO PLAYGROUND LAUNCHER BAR */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 p-4 w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2.5 items-center justify-center text-center backdrop-blur-xl"
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-white/50 flex items-center gap-1.5 justify-center">
            <Compass className="w-3.5 h-3.5" />
            Try Playground Demo Profiles
          </span>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {demoProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleLoadDemo(p)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-black/30 hover:bg-black/50 text-white/80 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:border-indigo-400/50"
              >
                {getDemoIcon(p.id)}
                {p.name} ({p.role})
              </button>
            ))}
          </div>
        </motion.div>
      </header>

      {/* TWO COLUMN INTERACTIVE BODY CONTAINER */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
        
        {/* INPUT AND HISTORY COLUMN (LEFT) */}
        <motion.div 
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          {/* HISTORY BAR */}
          <HistoryList
            history={history}
            activeId={activeHistoryId}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onClearNew={handleClearNew}
          />

          {/* BASE PROFILE INPUT CARD */}
          <div className="flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-400" />
              Original Resume
            </h2>
            
            <div className="flex flex-col gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt,.pdf,.docx" 
                className="hidden" 
              />
              
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full justify-start text-white/70 h-12 bg-black/10 border-white/10 hover:bg-white/5"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2 text-indigo-400" />}
                {isUploading ? 'Extracting Resume Data...' : 'Upload Resume Document (PDF / Word)'}
              </Button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] uppercase font-bold tracking-widest">or paste structured markdown</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your past accomplishments, skills, history and links..."
                className="w-full h-44 bg-black/35 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all focus:border-indigo-500"
              />
            </div>
          </div>

          {/* TARGET JOB DESCRIPTION CARD */}
          <div className="flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              Target Job Description
            </h2>
            
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the recruiter's job details, preferred requirements and credentials..."
              className="w-full h-44 bg-black/35 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all focus:border-indigo-500"
            />
          </div>

          {/* ENGAGE TAILOR BUTTON */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !resumeText.trim() || !jobDescription.trim()}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold shadow-[0_0_40px_-10px_rgba(99,102,241,0.35)] transition-all cursor-pointer",
              isGenerating 
                ? "bg-indigo-500/35 text-indigo-200" 
                : "bg-indigo-500 hover:bg-indigo-400 text-white"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin"/> Tailoring Materials...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3"/> Tailor My Application
              </>
            )}
          </Button>
        </motion.div>

        {/* DYNAMIC OUTPUT WORKSPACE COLUMN (RIGHT) */}
        <motion.div 
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-7 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[640px]"
        >
          {resumeOutput ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              
              {/* DOCUMENT WORKSPACE TAB BAR */}
              <div className="p-4 border-b border-white/10 bg-black/20 flex flex-wrap gap-4 items-center justify-between">
                <TabsList className="bg-white/5 p-1 rounded-xl">
                  <TabsTrigger value="resume" className="gap-2 text-xs py-1.5 px-3">
                    <FileText className="w-3.5 h-3.5" /> Resume
                  </TabsTrigger>
                  <TabsTrigger value="cover-letter" className="gap-2 text-xs py-1.5 px-3">
                    <FileSignature className="w-3.5 h-3.5" /> Cover Letter
                  </TabsTrigger>
                  <TabsTrigger value="ats" className="gap-2 text-xs py-1.5 px-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> ATS Report
                  </TabsTrigger>
                  <TabsTrigger value="cold-email" className="gap-2 text-xs py-1.5 px-3">
                    <Mail className="w-3.5 h-3.5" /> Cold Email
                  </TabsTrigger>
                </TabsList>

                {/* EXPORT OPTIONS BAR */}
                <div className="flex gap-1.5">
                  <button 
                    className="h-8 group px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all" 
                    onClick={handleCopy} 
                    title="Copy markup text"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105" />
                    Copy
                  </button>
                  <button 
                    className="h-8 group px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all" 
                    onClick={handleDownloadTxt} 
                    title="Download txt file"
                  >
                    <span className="font-semibold text-white/40 group-hover:text-white/85 text-[10px]">TXT</span> 
                    <Download className="w-3 h-3 text-indigo-400 group-hover:translate-y-0.5" />
                  </button>
                  {activeTab !== 'ats' && (
                    <>
                      <button 
                        className="h-8 group px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all" 
                        onClick={handleDownloadDocx} 
                        title="Export standard MS Word"
                      >
                        <span className="font-semibold text-white/40 group-hover:text-white/85 text-[10px]">DOCX</span> 
                        <FileDown className="w-3 h-3 text-emerald-400 group-hover:translate-y-0.5" />
                      </button>
                      <button 
                        className="h-8 group px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all" 
                        onClick={handleDownloadPdf} 
                        title="Download standard PDF"
                      >
                        <span className="font-semibold text-white/40 group-hover:text-white/85 text-[10px]">PDF</span> 
                        <FileDown className="w-3 h-3 text-rose-400 group-hover:translate-y-0.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* DISPLAY RENDER PANELS */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'ats' ? (
                  <ATSReportView reportText={atsReportOutput} />
                ) : (
                  <div className="flex flex-col gap-6 h-full">
                    {/* CORE A4 PRINT DESIGN AND WYSIWYG PREVIEW FOR MARKDOWN COMPATIBILITY */}
                    <A4Preview
                      value={currentOutput}
                      onChange={handleUpdateCurrentOutput}
                      documentType={activeTab as any}
                    />
                    
                    {/* TWEAK CONTROL PANE */}
                    <TweakPanel
                      documentType={activeTab as any}
                      content={currentOutput}
                      jobDescription={jobDescription}
                      onRefined={handleUpdateCurrentOutput}
                    />
                  </div>
                )}
              </div>
            </Tabs>
          ) : (
            
            /* EMPTY/WELCOME PRE-TAILOR DASHBOARD PLACEHOLDER */
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-white/30 my-auto min-h-[500px]">
              <div className="w-24 h-24 mb-6 rounded-3xl border border-white/5 flex items-center justify-center bg-black/25 relative">
                {isGenerating ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
                    className="absolute inset-2 border-2 border-dashed border-indigo-400/30 rounded-full"
                  />
                ) : null}
                {isGenerating ? (
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                ) : (
                  <FileText className="w-10 h-10 text-white/20" />
                )}
              </div>
              
              <h3 className="text-xl font-medium text-white/80 mb-2">
                {isGenerating ? 'AI Tailor Workspace Active' : 'Document Tailoring Workspace'}
              </h3>
              
              {isGenerating ? (
                <div className="max-w-md flex flex-col items-center gap-2">
                  <p className="text-sm text-indigo-300 font-medium flex items-center gap-2">
                     <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                     {generationStep}
                  </p>
                  <p className="text-xs text-white/40 max-w-sm mt-3 leading-relaxed">
                    Analyzing constraints, WCAG requirements, keywords, and drafting cover letters... Please hold tight.
                  </p>
                </div>
              ) : (
                <div className="max-w-md">
                  <p className="text-sm text-white/45 mb-4 leading-relaxed">
                    Select one of our pre-populated playground profiles in the header to preview the tailoring tool instantly, or upload your own resume file to begin editing.
                  </p>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white/40 inline-flex items-center gap-1.5 max-w-sm font-sans mx-auto">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    WCAG/Title VII EEO compliant checks are completed on upload.
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      <footer className="text-center mt-auto mb-6 text-white/40 text-[11px] font-sans">
        Design and Architecture by <a href="https://www.linkedin.com/in/zalak-zecco-patel-3a618890/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4 font-semibold">Zecco Patel</a>. Crafted under modern React & Google Gemini Workspace.
      </footer>
    </div>
  );
}
