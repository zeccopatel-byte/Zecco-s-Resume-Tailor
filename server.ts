import express from 'express';
import path from 'path';
import multer from 'multer';
import * as mammoth from 'mammoth';
import { createRequire } from 'module';
const customRequire = typeof require !== 'undefined'
  ? require
  : createRequire(import.meta.url || 'file://' + __filename);
const pdfParse = customRequire('pdf-parse');
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import htmlToDocx from 'html-to-docx';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use((req, res, next) => {
    console.log(`[Express Incoming] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Init Gemini
  const getAi = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY environment variable is required');
    return new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const masterPromptTemplate = (resumeText: string, jobDescriptionText: string) => `You are an expert US resume writer and career coach specializing in ATS (Applicant Tracking System) optimization. Your job is to tailor resumes and write cover letters for US job applications.

---

INPUTS YOU WILL RECEIVE:
1. RESUME CONTENT: Extracted text from the user's uploaded resume (PDF or DOCX)
2. JOB DESCRIPTION: Plain text of the target job posting

---

YOUR TASK — OUTPUT THREE DOCUMENTS:

### DOCUMENT 1: TAILORED RESUME

STRICT US RESUME FORMAT RULES:
- ALWAYS USE THIS EXACT HEADER FORMAT VERBATIM, in Markdown:

# Zalak (Zecco) Patel
**AI-Aware UX/UI Designer (10+ Years of Experience)**
**Chicago, Illinois, USA · [zalipatel7777@gmail.com](mailto:zalipatel7777@gmail.com) · 630.816.1489 · [LinkedIn](https://www.linkedin.com/in/zalak-zecco-patel-3a618890/) · [Website](https://www.zalak-patel.com/) · [Dribbble](https://dribbble.com/zalak_patel77)**
---

- Sections in this order: SUMMARY:, SKILLS:, PROFESSIONAL EXPERIENCE:, EDUCATION:, CERTIFICATES:
- EVERY section title must be ALL CAPS and BOLD with a colon. Example: **SUMMARY:**
- Add a horizontal line divider (\`---\`) immediately below EVERY section title. You MUST include blank lines around it. Example:

**SUMMARY:**

---

- Use standard section headers (not creative ones like "Where I've Worked")
- Dates: Month Year - Month Year format (e.g., Jan 2021 - Mar 2024). Use "Present" for current roles
- DO NOT use the "—" (em dash) sign anywhere. Always use standard hyphens "-".
- **Crucial:** EVERY bullet point in "Professional Experience" and "Education" must start with a Markdown bullet point (\`-\` or \`*\`). You MUST add a blank line before starting any bulleted list so that it formats correctly in Markdown. Do NOT output plain text paragraphs for job duties.
- Bullet points start with strong action verbs (past tense for old roles, present tense for current)
- Quantify achievements wherever possible (use numbers from original resume; do not fabricate)
- Keep to 1 page if under 10 years experience, 2 pages max for 10+ years
- Font-safe formatting using standard Markdown. DO NOT use HTML tags. 
- Ensure all hyperlinks and URLs in the original document (e.g., portfolios, LinkedIn, especially Certificate URLs like [View Certificate](https://...)) are EXACTLY preserved and formatting as Markdown links. DO NOT break, change, or remove the links.
- File output label: [TAILORED RESUME]

ATS OPTIMIZATION RULES:
- Extract exact keywords, skills, tools, technologies, and phrases from the job description
- Mirror the language of the job description naturally throughout the resume
- Prioritize matching: job title keywords, required skills, preferred skills, industry terms
- Do NOT keyword-stuff — integrate naturally into bullet points and summary
- Spell out acronyms at least once (e.g., "Search Engine Optimization (SEO)")
- Avoid headers that ATS cannot parse (no icons, symbols, or decorative characters)
- Use standard US section headers only
- Include a dedicated Skills section with comma-separated keywords (not a word cloud or rating bars)

LEGAL / US COMPLIANCE LAYER:
- Do NOT include: Age, Date of Birth, Marital Status, Religion, Race, National Origin, Photo, Social Security Number, Height, Weight
- These are prohibited under US employment law (Title VII, ADEA, ADA)
- If any of the above appear in the original resume, silently remove them
- Work authorization status (e.g., "Authorized to work in the US") is optional — only include if it was in the original resume

CONTENT RULES:
- Do NOT invent jobs, degrees, skills, or accomplishments not in the original resume
- You MAY rewrite, reframe, and strengthen existing bullet points using stronger language
- You MAY reorder bullet points to lead with most relevant experience for this specific job
- You MAY update the professional summary to target this specific role and company
- Preserve company names, job titles, dates, all live project links, certificate links, and all factual information exactly. DO NOT remove or alter the live projects or certificate links, include them verbatim in the tailored resume.

---

### DOCUMENT 2: COVER LETTER

FORMAT RULES (US Standard):
- Today's date (use the date provided or write [DATE])
- Hiring Manager's name if available in job description; otherwise use "Dear Hiring Manager,"
- Company name and address if available; otherwise omit address block
- 3-4 paragraphs, under 400 words
- Closing: "Sincerely," followed by candidate's full name
- Do NOT include candidate's address (optional in modern US cover letters)
- File output label: [COVER LETTER]

CONTENT RULES:
- Paragraph 1: Hook — state the role, where you found it, and one powerful reason you're the right fit
- Paragraph 2: Match — connect 2-3 of your strongest relevant achievements to the job's key requirements
- Paragraph 3: Company fit — show you've read the job description; reference their mission, product, or values if mentioned
- Paragraph 4: Call to action — express enthusiasm, request an interview, thank them for their time
- Mirror keywords from the job description naturally
- Do NOT repeat the resume verbatim — tell a story, add personality
- Tone: Professional, confident, warm — avoid clichés like "I am a hardworking team player"
- Use elevated, professional language specifically tailored to the UX/UI Design industry. Where applicable, emphasize terms like "User-Centered Design", "Information Architecture", "Usability Testing", "Design Systems", and "Cross-functional collaboration".

---

### DOCUMENT 3: COLD EMAIL

FORMAT RULES:
- Subject line at the very top.
- Addressed to the Head of People, Design Director, or Hiring Manager.
- Short, human-sounding, punchy paragraphs (2-3 very short paragraphs).
- Output label: [COLD EMAIL]

CONTENT RULES:
- Tone must be conversational, warm, and highly humanized (not robotic or overly formal).
- Introduce yourself, state your interest in the position and company.
- Highlight one key standout achievement relevant to the role.
- MUST explicitly include the portfolio link: https://zalak-patel.com/
- Call to action: ask for a brief chat or direct them to your portfolio and resume.

---

OUTPUT FORMAT:

Return your response in this exact structure:

========================================
[TAILORED RESUME]
========================================

[Full resume text here in Markdown formatting]

========================================
[COVER LETTER]
========================================

[Full cover letter text here in Markdown formatting]

========================================
[COLD EMAIL]
========================================

[Full cold email text here in Markdown formatting]

========================================
[ATS KEYWORD MATCH REPORT]
========================================

KEYWORDS FOUND IN JOB DESCRIPTION AND ADDED/MATCHED IN RESUME:
- [keyword 1]
- [keyword 2]
...

KEYWORDS IN JOB DESCRIPTION NOT ADDRESSABLE (skills/experience not in original resume):
- [keyword A] — Reason: not in candidate's background
...

MATCH SCORE ESTIMATE: [X]% keyword alignment

========================================

---

IMPORTANT REMINDERS:
- Never fabricate. Never hallucinate credentials or experience.
- Preserve every URL and hyperlink from the original resume exactly.
- Remove any EEO-prohibited personal data silently.
- Output MUST be beautifully formatted Markdown. Use bold, headers, horizontal rules (\`---\`), bullet points. Do NOT use HTML tables or HTML tags.
- Use only standard hyphens (-), NOT em-dashes (—).

[RESUME TEXT START]
${resumeText}
[RESUME TEXT END]

[JOB DESCRIPTION START]
${jobDescriptionText}
[JOB DESCRIPTION END]
`;

  // API route for extracting file text
  app.post('/api/extract-resume', upload.single('resume'), async (req, res): Promise<any> => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let extractedText = '';
      const buffer = req.file.buffer;
      const mimetype = req.file.mimetype;
      const originalname = req.file.originalname;

      if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalname.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimetype === 'text/plain' || originalname.endsWith('.txt')) {
        extractedText = buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' });
      }

      res.json({ text: extractedText });
    } catch (e: any) {
      console.error('Extraction error:', e);
      res.status(500).json({ error: e.message || 'Error extracting file' });
    }
  });

  // API route for processing with Gemini
  app.post('/api/tailor', async (req, res): Promise<any> => {
    try {
      const { resumeText, jobDescription } = req.body;
      if (!resumeText || !jobDescription) {
        return res.status(400).json({ error: 'Resume text and Job description are required' });
      }

      let ai;
      try {
        ai = getAi();
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }

      const prompt = masterPromptTemplate(resumeText, jobDescription);

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2, // Low temp for more factual adherence
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE',
            }
          ]
        }
      });

      const responseText = response.text || '';
      
      // Basic parsing of the output based on separators
      // We expect the blocks [TAILORED RESUME], [COVER LETTER], [ATS KEYWORD MATCH REPORT]
      res.json({ output: responseText });

    } catch (e: any) {
      console.error('Tailor error:', e);
      let errorMessage = 'Error communicating with AI service. High demand may cause temporary issues. Please try again.';
      try {
        if (e.message) {
          const parsed = JSON.parse(e.message);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          } else {
            errorMessage = e.message;
          }
        }
      } catch (parseError) {
        errorMessage = e.message || errorMessage;
      }

      const status = errorMessage.includes('high demand') || errorMessage.toLowerCase().includes('quota') ? 429 : 500;
      res.status(status).json({ error: errorMessage });
    }
  });

  // API route for refining a specific document section interactively
  app.post('/api/refine', async (req, res): Promise<any> => {
    try {
      const { documentType, content, instruction, jobDescription } = req.body;
      if (!content || !instruction) {
        return res.status(400).json({ error: 'Content and instruction are required' });
      }

      let ai;
      try {
        ai = getAi();
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }

      const prompt = `You are an expert career coach and elite resume writer specializing in ATS (Applicant Tracking System) optimization.
I have a tailored ${documentType} that I want to adjust or refine.

Current Document Content:
"""
${content}
"""

Target Job Description (for context):
"""
${jobDescription || ''}
"""

User refinement instruction:
"${instruction}"

STRICT GUIDELINES:
1. Revise the provided document according to the user instruction, maintaining standard professional formatting.
2. Return ONLY the complete revised markdown document content itself.
3. Completely omit any opening/closing conversation, preambles, notes, or explanations (e.g., do NOT start with "Here is your updated resume", "Sure, I adjusted that for you", or similar. Do NOT wrap output with code blocks like \`\`\`markdown).
4. Preserve candidate details, professional links (including all live project URLs), certificates and their URLs, and dates EXACTLY as provided unless the instruction explicitly asks to change them. Do not remove or alter hyperlinks.
5. If the document type is a resume, maintain the required ALL CAPS and BOLD header structures and bulleted list hierarchies.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });

      res.json({ output: response.text || '' });
    } catch (e: any) {
      console.error('Refine error:', e);
      let errorMessage = 'Error refining document. High demand may cause temporary issues.';
      try {
        if (e.message) {
          const parsed = JSON.parse(e.message);
          errorMessage = parsed?.error?.message || e.message;
        }
      } catch (parseError) {
        errorMessage = e.message || errorMessage;
      }
      
      const status = errorMessage.includes('high demand') || errorMessage.toLowerCase().includes('quota') ? 429 : 500;
      res.status(status).json({ error: errorMessage });
    }
  });

  app.post('/api/download-docx', async (req, res): Promise<any> => {
    try {
      const { html } = req.body;
      if (!html) {
        return res.status(400).json({ error: 'HTML content missing' });
      }

      const fileBuffer = await htmlToDocx(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        font: 'Times New Roman',
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=tailored.docx');
      res.send(fileBuffer);
    } catch (e: any) {
      console.error('Docx generation error:', e);
      res.status(500).json({ error: e.message || 'Error generating DOCX' });
    }
  });

  // API Catch-all to prevent Vite from returning HTML for API requests
  app.use('/api', (req, res, next) => {
    console.error(`[API Fallthrough] Method: ${req.method}, URL: ${req.originalUrl}, Content-Type: ${req.headers['content-type']}`);
    res.status(404).json({ error: `API route not found or not matched: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Global Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
