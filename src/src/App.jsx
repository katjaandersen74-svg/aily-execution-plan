import { useState, useRef, useEffect } from "react";

const COLORS = {
  dark: "#2C2420",
  blush: "#F4B4B2",
  blushDark: "#e89a98",
  greige: "#B0A496",
  greigeDark: "#8a7e72",
  offwhite: "#FAF8F6",
  white: "#ffffff",
  lightGrey: "#f0ede9",
  midGrey: "#d4cfc9",
};

const PROXY = "https://aily-api-proxy.katjaandersen74.workers.dev";

const QUESTIONS = [
  { id: "industry", label: "What industry are you in?", placeholder: "e.g. Law firm, Manufacturing, Finance, Retail..." },
  { id: "size", label: "How large is your organisation?", placeholder: "e.g. 50 employees, 500 employees..." },
  { id: "aiMaturity", label: "How would you describe your current AI maturity?", placeholder: "e.g. We use no AI today / We experiment with ChatGPT / We have some tools in production..." },
  { id: "urgency", label: "What is your urgency for AI action?", placeholder: "e.g. We need quick wins in 3 months / We are planning a 1-year transformation..." },
  { id: "budget", label: "What is your appetite for investment?", placeholder: "e.g. Low – we want to use existing tools / Medium – willing to buy tools / High – open to custom builds..." },
  { id: "biggestChallenge", label: "What is your single biggest challenge today?", placeholder: "e.g. Too much manual work, losing clients to competitors, lack of data quality..." },
];

const STEP_LABELS = ["Upload Strategy", "Quick Questions", "Generating Plan", "Your Plan"];

function Stepper({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {STEP_LABELS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < step ? COLORS.greige : i === step ? COLORS.dark : COLORS.midGrey,
              color: i <= step ? COLORS.white : COLORS.greigeDark,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13,
            }}>{i < step ? "✓" : i + 1}</div>
            <span style={{ fontSize: 11, color: i === step ? COLORS.dark : COLORS.greigeDark, fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && <div style={{ width: 48, height: 2, background: i < step ? COLORS.greige : COLORS.midGrey, margin: "0 4px", marginBottom: 20 }} />}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, color }) {
  return (
    <div style={{ background: color || COLORS.greige, color: COLORS.white, padding: "8px 16px", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 0 }}>
      {title}
    </div>
  );
}

function EditableField({ value, onChange, multiline, placeholder, style }) {
  const base = {
    width: "100%", border: "1px solid " + COLORS.midGrey, borderRadius: 4,
    padding: "8px 10px", fontSize: 13, color: COLORS.dark, background: COLORS.white,
    fontFamily: "inherit", resize: multiline ? "vertical" : "none", boxSizing: "border-box",
    ...style
  };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, minHeight: 72 }} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, height: 36 }} />;
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.dark, cursor: "pointer", marginRight: 12 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: COLORS.dark, width: 14, height: 14 }} />
      {label}
    </label>
  );
}

const defaultPlan = {
  ambition: "",
  useCases: {
    daily: [{ name: "", tool: "", buy: false, configure: false, build: false, dataSource: "", dataReady: false, dataNeeds: false, dataGap: false, gdpr: false, confidentiality: false, errors: false, security: false, top5: false }],
    operational: [{ name: "", tool: "", buy: false, configure: false, build: false, dataSource: "", dataReady: false, dataNeeds: false, dataGap: false, gdpr: false, confidentiality: false, errors: false, security: false, top5: false }],
    strategic: [{ name: "", tool: "", buy: false, configure: false, build: false, dataSource: "", dataReady: false, dataNeeds: false, dataGap: false, gdpr: false, confidentiality: false, errors: false, security: false, top5: false }],
  },
  people: { who: "", training: { intro: false, prompt: false, toolSpecific: false, leadership: false }, adoption: { guidelines: false, champions: false, workshops: false, support: false } },
  success: { after90: "", metrics: { time: false, quality: false, adoption: false, revenue: false, risk: false }, baseline: "" },
  actions: {
    days30: [{ action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }],
    days90: [{ action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }],
    days180: [{ action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }, { action: "", owner: "", deadline: "" }],
  },
  maturity: {
    retning: { score: "", gap: "" },
    viden: { score: "", gap: "" },
    data: { score: "", gap: "" },
    teknologi: { score: "", gap: "" },
    governance: { score: "", gap: "" },
    resultater: { score: "", gap: "" },
  }
};

export default function App() {
  const [step, setStep] = useState(0);
  const [strategyText, setStrategyText] = useState("");
  const [fileName, setFileName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [plan, setPlan] = useState(null);
  const [backgroundPaper, setBackgroundPaper] = useState("");
  const [activeTab, setActiveTab] = useState("plan");
  const [company, setCompany] = useState("");
  const [owner, setOwner] = useState("");
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const callProxy = async (body) => {
    let res;
    try {
      res = await fetch(PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new Error(`Network error — could not reach the Worker. Is it deployed? (${networkErr.message})`);
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Worker returned ${res.status}: ${txt}`);
    }
    const json = await res.json().catch(() => { throw new Error("Worker response was not valid JSON"); });
    if (json.error) throw new Error(`Anthropic API error: ${JSON.stringify(json.error)}`);
    return json;
  };

  // Dynamically load PptxGenJS parser (pizzip + jszip for pptx text extraction)
  const extractPptxText = async (file) => {
    // Load JSZip from CDN
    if (!window.JSZip) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const zip = await window.JSZip.loadAsync(file);
    const slideFiles = Object.keys(zip.files).filter(n => n.match(/ppt\/slides\/slide[0-9]+\.xml$/));
    slideFiles.sort();
    let allText = "";
    for (const sf of slideFiles) {
      const xml = await zip.files[sf].async("string");
      // Extract all <a:t> text nodes
      const matches = [...xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)];
      const slideText = matches.map(m => m[1]).join(" ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
      if (slideText.trim()) allText += slideText.trim() + "\n";
    }
    return allText.trim();
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setLoadingMsg("Reading your strategy document...");
    const isPptx = file.name.toLowerCase().endsWith(".pptx");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");

    try {
      if (isPptx) {
        // Extract text client-side from PPTX, then summarise via API
        const rawText = await extractPptxText(file);
        if (!rawText) throw new Error("No text found in presentation.");
        const data = await callProxy({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Extract and summarise the key strategic priorities, goals, challenges, and context from this presentation content. Return a concise plain text summary of maximum 400 words. Focus on: main priorities, biggest challenges, market context, and any stated ambitions.\n\nPRESENTATION CONTENT:\n${rawText.slice(0, 6000)}`
          }]
        });
        const txt = data.content?.map(b => b.text || "").join("\n") || "";
        setStrategyText(txt);
      } else if (isPdf) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target.result.split(",")[1];
          try {
            const data = await callProxy({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [{
                role: "user",
                content: [
                  { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
                  { type: "text", text: "Extract and summarise the key strategic priorities, goals, challenges, and context from this document. Return a concise plain text summary of maximum 400 words. Focus on: main priorities, biggest challenges, market context, and any stated ambitions." }
                ]
              }]
            });
            const txt = data.content?.map(b => b.text || "").join("\n") || "";
            setStrategyText(txt);
          } catch {
            setStrategyText("Could not extract text automatically. Please describe your strategy below.");
          }
          setLoading(false);
        };
        reader.readAsDataURL(file);
        return; // loading set to false inside reader.onload
      } else {
        setError("Please upload a PDF or PowerPoint (.pptx) file.");
      }
    } catch (err) {
      console.error(err);
      setStrategyText("Could not extract text automatically. Please describe your strategy below.");
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setStep(2);
    setLoading(true);
    setError("");

    const msgs = [
      "Researching your market and competitive landscape...",
      "Identifying high-impact AI use cases...",
      "Designing your 30/90/180 day action plan...",
      "Compiling your background intelligence paper...",
    ];
    let mi = 0;
    setLoadingMsg(msgs[mi]);
    const interval = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      setLoadingMsg(msgs[mi]);
    }, 3500);

    const context = `
STRATEGY SUMMARY: ${strategyText}
INDUSTRY: ${answers.industry || "Not specified"}
SIZE: ${answers.size || "Not specified"}
AI MATURITY: ${answers.aiMaturity || "Not specified"}
URGENCY: ${answers.urgency || "Not specified"}
BUDGET: ${answers.budget || "Not specified"}
BIGGEST CHALLENGE: ${answers.biggestChallenge || "Not specified"}
    `.trim();

    try {
      const planData = await callProxy({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are an expert AI strategy consultant. Given a company's context, generate a concrete AI Execution Plan. 
Return ONLY valid JSON, no markdown, no preamble. Use this exact structure:
{
  "ambition": "string - bold one-paragraph AI ambition statement",
  "maturity": {
    "retning": {"score": "2", "gap": "string"},
    "viden": {"score": "2", "gap": "string"},
    "data": {"score": "2", "gap": "string"},
    "teknologi": {"score": "2", "gap": "string"},
    "governance": {"score": "2", "gap": "string"},
    "resultater": {"score": "2", "gap": "string"}
  },
  "useCases": {
    "daily": [
      {"name": "string", "tool": "string", "buy": true, "configure": false, "build": false, "dataSource": "string", "dataReady": true, "dataNeeds": false, "dataGap": false, "gdpr": true, "confidentiality": false, "errors": false, "security": false, "top5": true},
      {"name": "string", "tool": "string", "buy": true, "configure": false, "build": false, "dataSource": "string", "dataReady": true, "dataNeeds": false, "dataGap": false, "gdpr": false, "confidentiality": true, "errors": false, "security": false, "top5": false},
      {"name": "string", "tool": "string", "buy": false, "configure": true, "build": false, "dataSource": "string", "dataReady": false, "dataNeeds": true, "dataGap": false, "gdpr": true, "confidentiality": false, "errors": true, "security": false, "top5": true}
    ],
    "operational": [
      {"name": "string", "tool": "string", "buy": false, "configure": true, "build": false, "dataSource": "string", "dataReady": false, "dataNeeds": true, "dataGap": false, "gdpr": true, "confidentiality": true, "errors": false, "security": false, "top5": true},
      {"name": "string", "tool": "string", "buy": false, "configure": true, "build": false, "dataSource": "string", "dataReady": true, "dataNeeds": false, "dataGap": false, "gdpr": false, "confidentiality": true, "errors": true, "security": false, "top5": false},
      {"name": "string", "tool": "string", "buy": false, "configure": false, "build": true, "dataSource": "string", "dataReady": false, "dataNeeds": false, "dataGap": true, "gdpr": true, "confidentiality": false, "errors": false, "security": true, "top5": true}
    ],
    "strategic": [
      {"name": "string", "tool": "string", "buy": false, "configure": false, "build": true, "dataSource": "string", "dataReady": false, "dataNeeds": false, "dataGap": true, "gdpr": false, "confidentiality": true, "errors": true, "security": true, "top5": false},
      {"name": "string", "tool": "string", "buy": false, "configure": true, "build": false, "dataSource": "string", "dataReady": false, "dataNeeds": true, "dataGap": false, "gdpr": true, "confidentiality": false, "errors": false, "security": false, "top5": true},
      {"name": "string", "tool": "string", "buy": true, "configure": false, "build": false, "dataSource": "string", "dataReady": true, "dataNeeds": false, "dataGap": false, "gdpr": false, "confidentiality": true, "errors": true, "security": false, "top5": false}
    ]
  },
  "people": {
    "who": "string",
    "training": {"intro": true, "prompt": true, "toolSpecific": false, "leadership": true},
    "adoption": {"guidelines": true, "champions": true, "workshops": false, "support": true}
  },
  "success": {
    "after90": "string",
    "metrics": {"time": true, "quality": true, "adoption": true, "revenue": false, "risk": false},
    "baseline": "string"
  },
  "actions": {
    "days30": [
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"}
    ],
    "days90": [
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"}
    ],
    "days180": [
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"},
      {"action": "string", "owner": "string", "deadline": "string"}
    ]
  }
}
Be specific and concrete. Use cases should be real and actionable. 3 use cases per category. Daily = everyday AI productivity. Operational = process automation. Strategic = competitive advantage / innovation.`,
        messages: [{ role: "user", content: context }]
      });

      const planText = planData.content?.map(b => b.text || "").join("") || "{}";
      const parsed = JSON.parse(planText.replace(/```json|```/g, "").trim());
      setPlan({ ...defaultPlan, ...parsed });

      const bgData = await callProxy({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are an expert AI strategy analyst. Write a rich, inspiring intelligence background paper that supports an AI Execution Plan. Use markdown formatting with headers. Be concrete, cite real trends, tools, and competitor movements. Write in the same language as the strategy context (default English unless context is clearly in another language).",
        messages: [{
          role: "user",
          content: `Write a background intelligence paper (600-800 words) for this company's AI Execution Plan.
Context: ${context}

Cover:
## Market & AI Trends
What is happening in their industry with AI. What competitors are doing. What customers expect.

## Biggest AI Opportunities
The 3-5 most impactful AI opportunities for this specific company and industry right now.

## Technology Landscape
What tools and platforms are leading in this space (name real products and vendors).

## Risks & Governance
Key risks to manage — GDPR, accuracy, change resistance.

## Why Act Now
A compelling case for urgency — what they risk losing if they wait 12 months.

Be specific, inspiring, and grounded in real market intelligence.`
        }]
      });

      setBackgroundPaper(bgData.content?.map(b => b.text || "").join("") || "");

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}`);
      setStep(1);
    }

    clearInterval(interval);
    setLoading(false);
    setStep(prev => prev === 2 ? 3 : prev);
  };

  const updateUseCase = (cat, idx, field, val) => {
    setPlan(p => {
      const updated = p.useCases[cat].map((uc, i) => i === idx ? { ...uc, [field]: val } : uc);
      return { ...p, useCases: { ...p.useCases, [cat]: updated } };
    });
  };

  const updateAction = (phase, idx, field, val) => {
    setPlan(p => {
      const updated = p.actions[phase].map((a, i) => i === idx ? { ...a, [field]: val } : a);
      return { ...p, actions: { ...p.actions, [phase]: updated } };
    });
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/## (.*)/g, `<h3 style="color:${COLORS.dark};margin:20px 0 8px;font-size:15px;border-bottom:2px solid ${COLORS.blush};padding-bottom:4px">$1</h3>`)
      .replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`)
      .replace(/\n/g, "<br/>");
  };

  const handlePrint = () => window.print();

  // STEP 0 - Upload
  if (step === 0) return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: COLORS.offwhite, minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: COLORS.greigeDark, letterSpacing: "0.12em", textTransform: "uppercase" }}>aily.dk</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.dark, margin: "4px 0 0" }}>AI Execution Plan Generator</h1>
          <p style={{ color: COLORS.greigeDark, fontSize: 14, margin: "6px 0 0" }}>Upload your strategy document and receive a tailored AI execution plan in minutes.</p>
        </div>
        <Stepper step={step} />
        <div style={{ background: COLORS.white, borderRadius: 8, padding: 32, boxShadow: "0 2px 12px rgba(44,36,32,0.07)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginTop: 0 }}>Step 1 — Upload your strategy</h2>
          <div
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${COLORS.greige}`, borderRadius: 8, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: COLORS.offwhite, marginBottom: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600, color: COLORS.dark, fontSize: 14 }}>Click to upload PDF or PowerPoint</div>
            <div style={{ fontSize: 12, color: COLORS.greigeDark, marginTop: 4 }}>Accepts .pdf and .pptx — strategy document, annual report, business plan...</div>
            {fileName && <div style={{ marginTop: 10, color: COLORS.blushDark, fontWeight: 600, fontSize: 13 }}>✓ {fileName}</div>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.pptx" onChange={handleFile} style={{ display: "none" }} />
          {loading && <div style={{ color: COLORS.greigeDark, fontSize: 13, marginBottom: 12, textAlign: "center" }}>⏳ {loadingMsg}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>Or describe your strategy here:</label>
            <textarea
              value={strategyText}
              onChange={e => setStrategyText(e.target.value)}
              placeholder="Paste or type your key strategic priorities, goals, challenges..."
              style={{ width: "100%", minHeight: 100, border: `1px solid ${COLORS.midGrey}`, borderRadius: 6, padding: "10px 12px", fontSize: 13, color: COLORS.dark, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 4 }}>Company name</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme A/S" style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 4 }}>Owner / Contact</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Your name" style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Privacy consent */}
          <div style={{ marginTop: 20, background: COLORS.lightGrey, borderRadius: 8, padding: "14px 16px", border: `1px solid ${COLORS.midGrey}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" id="consent" checked={consented} onChange={e => setConsented(e.target.checked)}
                style={{ accentColor: COLORS.dark, width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <label htmlFor="consent" style={{ fontSize: 12, color: COLORS.dark, lineHeight: 1.6, cursor: "pointer" }}>
                <strong>Privacy notice:</strong> Your document is sent to Anthropic's API for processing. It is <strong>not stored by AILY</strong>. Anthropic's API does not use your data for model training. Please do not upload documents classified as <em>strictly confidential</em> without consulting your organisation's data policy. By continuing, you confirm you have the right to share this document for AI processing.
              </label>
            </div>
            <div style={{ marginTop: 8, paddingLeft: 26, fontSize: 11, color: COLORS.greigeDark }}>
              🔒 No data is stored by AILY · Processed via Anthropic API · Session only
            </div>
          </div>

          {error && <div style={{ marginTop: 12, background: "#fde8e8", border: "1px solid #f4b4b2", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#8b0000" }}>⚠️ {error}</div>}

          <button
            onClick={() => strategyText.trim() && consented ? setStep(1) : null}
            disabled={!strategyText.trim() || !consented}
            style={{ marginTop: 14, background: strategyText.trim() && consented ? COLORS.dark : COLORS.midGrey, color: COLORS.white, border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: strategyText.trim() && consented ? "pointer" : "not-allowed", width: "100%" }}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  // STEP 1 - Questions
  if (step === 1) return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: COLORS.offwhite, minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: COLORS.greigeDark, letterSpacing: "0.12em", textTransform: "uppercase" }}>aily.dk</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.dark, margin: "4px 0 0" }}>AI Execution Plan Generator</h1>
        </div>
        <Stepper step={step} />
        <div style={{ background: COLORS.white, borderRadius: 8, padding: 32, boxShadow: "0 2px 12px rgba(44,36,32,0.07)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginTop: 0 }}>Step 2 — A few quick questions</h2>
          <p style={{ fontSize: 13, color: COLORS.greigeDark, marginBottom: 20 }}>Your answers help us tailor the plan and research your specific market context.</p>
          {error && <div style={{ marginBottom: 16, background: "#fde8e8", border: "1px solid #f4b4b2", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#8b0000" }}>⚠️ {error}</div>}
          {QUESTIONS.map(q => (
            <div key={q.id} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>{q.label}</label>
              <input
                value={answers[q.id] || ""}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                placeholder={q.placeholder}
                style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "9px 12px", fontSize: 13, color: COLORS.dark, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setStep(0)} style={{ background: COLORS.offwhite, color: COLORS.dark, border: `1px solid ${COLORS.midGrey}`, borderRadius: 6, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
            <button onClick={handleGenerate} style={{ flex: 1, background: COLORS.dark, color: COLORS.white, border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Generate My AI Execution Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 2 - Loading
  if (step === 2) return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: COLORS.offwhite, minHeight: "100vh", padding: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.dark, marginBottom: 8 }}>Building your AI Execution Plan</h2>
        <p style={{ fontSize: 14, color: COLORS.greigeDark, marginBottom: 24 }}>{loadingMsg}</p>
        <div style={{ background: COLORS.midGrey, borderRadius: 100, height: 6, overflow: "hidden" }}>
          <div style={{ background: COLORS.blush, height: "100%", width: "70%", borderRadius: 100, animation: "pulse 1.5s infinite" }} />
        </div>
        <style>{`@keyframes pulse { 0%{width:20%} 50%{width:80%} 100%{width:20%} }`}</style>
      </div>
    </div>
  );

  // STEP 3 - Plan
  if (step === 3 && plan) {
    const UCRow = ({ uc, cat, idx }) => (
      <div style={{ borderBottom: `1px solid ${COLORS.lightGrey}`, padding: "10px 0", display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr auto", gap: 8, alignItems: "start" }}>
        <EditableField value={uc.name} onChange={v => updateUseCase(cat, idx, "name", v)} placeholder="Use case name..." />
        <div>
          <EditableField value={uc.tool} onChange={v => updateUseCase(cat, idx, "tool", v)} placeholder="Tool / approach" />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {["buy", "configure", "build"].map(opt => (
              <label key={opt} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                <input type="checkbox" checked={uc[opt]} onChange={e => updateUseCase(cat, idx, opt, e.target.checked)} style={{ accentColor: COLORS.dark }} />
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <EditableField value={uc.dataSource} onChange={v => updateUseCase(cat, idx, "dataSource", v)} placeholder="Data source" />
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {[["dataReady", "Ready"], ["dataNeeds", "Needs work"], ["dataGap", "Gap"]].map(([k, l]) => (
              <label key={k} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                <input type="checkbox" checked={uc[k]} onChange={e => updateUseCase(cat, idx, k, e.target.checked)} style={{ accentColor: COLORS.dark }} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["gdpr", "GDPR"], ["confidentiality", "Conf."], ["errors", "Errors"], ["security", "Security"]].map(([k, l]) => (
            <label key={k} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
              <input type="checkbox" checked={uc[k]} onChange={e => updateUseCase(cat, idx, k, e.target.checked)} style={{ accentColor: COLORS.dark }} />
              {l}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <label style={{ cursor: "pointer", fontSize: 18 }}>
            <input type="checkbox" checked={uc.top5} onChange={e => updateUseCase(cat, idx, "top5", e.target.checked)} style={{ display: "none" }} />
            <span style={{ color: uc.top5 ? "#e5a800" : COLORS.midGrey }}>★</span>
          </label>
        </div>
      </div>
    );

    const maturityLabels = [
      ["retning", "Retning & Strategi"],
      ["viden", "Viden & Træning"],
      ["data", "Data"],
      ["teknologi", "Teknologi & Systemer"],
      ["governance", "Governance & Ansvar"],
      ["resultater", "Resultater & Fremdrift"],
    ];

    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: COLORS.offwhite, minHeight: "100vh" }}>
        <div style={{ background: COLORS.dark, color: COLORS.white, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.greige, letterSpacing: "0.1em", textTransform: "uppercase" }}>aily.dk</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: "2px 0 0", color: COLORS.white }}>AI Execution Plan</h1>
            {company && <div style={{ fontSize: 12, color: COLORS.greige, marginTop: 2 }}>{company}{owner ? ` · ${owner}` : ""} · {new Date().toLocaleDateString("en-GB")}</div>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(0)} style={{ background: "transparent", color: COLORS.greige, border: `1px solid ${COLORS.greige}`, borderRadius: 5, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>← Start over</button>
            <button onClick={handlePrint} style={{ background: COLORS.blush, color: COLORS.dark, border: "none", borderRadius: 5, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🖨 Print / Save PDF</button>
          </div>
        </div>

        <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.midGrey}`, padding: "0 32px", display: "flex", gap: 0 }}>
          {[["plan", "📋 AI Execution Plan"], ["background", "📚 Background Paper"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              background: "transparent", border: "none", borderBottom: activeTab === id ? `3px solid ${COLORS.dark}` : "3px solid transparent",
              padding: "14px 20px", fontSize: 13, fontWeight: activeTab === id ? 700 : 400, color: activeTab === id ? COLORS.dark : COLORS.greigeDark, cursor: "pointer"
            }}>{label}</button>
          ))}
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>
          {activeTab === "plan" && <>
            <div style={{ background: COLORS.white, borderRadius: 8, marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
              <SectionHeader title="AI Ambition" color={COLORS.blush} />
              <div style={{ padding: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Our AI Ambition</label>
                <textarea value={plan.ambition} onChange={e => setPlan(p => ({ ...p, ambition: e.target.value }))}
                  style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "10px 12px", fontSize: 14, color: COLORS.dark, fontFamily: "inherit", resize: "vertical", minHeight: 60, boxSizing: "border-box", fontStyle: "italic" }} />
              </div>
            </div>

            <div style={{ background: COLORS.white, borderRadius: 8, marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
              <SectionHeader title="AI Maturity Assessment" color={COLORS.greige} />
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {maturityLabels.map(([k, label]) => (
                  <div key={k} style={{ background: COLORS.lightGrey, borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
                    <label style={{ fontSize: 11, color: COLORS.greigeDark, display: "block", marginBottom: 4 }}>Score (1-5):</label>
                    <input value={plan.maturity[k]?.score || ""} onChange={e => setPlan(p => ({ ...p, maturity: { ...p.maturity, [k]: { ...p.maturity[k], score: e.target.value } } }))}
                      style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, boxSizing: "border-box", marginBottom: 8 }} />
                    <label style={{ fontSize: 11, color: COLORS.greigeDark, display: "block", marginBottom: 4 }}>Biggest gap:</label>
                    <textarea value={plan.maturity[k]?.gap || ""} onChange={e => setPlan(p => ({ ...p, maturity: { ...p.maturity, [k]: { ...p.maturity[k], gap: e.target.value } } }))}
                      style={{ width: "100%", border: `1px solid ${COLORS.midGrey}`, borderRadius: 4, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", resize: "vertical", minHeight: 48, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: COLORS.white, borderRadius: 8, marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
              <SectionHeader title="Use Cases · Technology · Data · Governance" color={COLORS.greige} />
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr auto", gap: 8, padding: "10px 0 6px", borderBottom: `2px solid ${COLORS.midGrey}` }}>
                  {["Use Case", "Technology", "Data", "Governance", "★"].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                  ))}
                </div>
                {[["daily", "Daily Productivity", COLORS.lightGrey], ["operational", "Operational", COLORS.offwhite], ["strategic", "Strategic", COLORS.lightGrey]].map(([cat, catLabel, bg]) => (
                  <div key={cat} style={{ background: bg }}>
                    <div style={{ padding: "6px 0 2px", fontSize: 11, fontWeight: 800, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.1em" }}>{catLabel}</div>
                    {(plan.useCases[cat] || []).map((uc, idx) => <UCRow key={idx} uc={uc} cat={cat} idx={idx} />)}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: COLORS.white, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
                <SectionHeader title="People, Training & Change Management" color={COLORS.greige} />
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Who needs to change how they work?</label>
                    <EditableField multiline value={plan.people?.who || ""} onChange={v => setPlan(p => ({ ...p, people: { ...p.people, who: v } }))} placeholder="Teams and roles..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Training</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[["intro", "Intro"], ["prompt", "Prompt Skills"], ["toolSpecific", "Tool-specific"], ["leadership", "Leadership"]].map(([k, l]) => (
                        <CheckRow key={k} label={l} checked={plan.people?.training?.[k] || false} onChange={v => setPlan(p => ({ ...p, people: { ...p.people, training: { ...p.people.training, [k]: v } } }))} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Adoption</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[["guidelines", "Guidelines"], ["champions", "Champions"], ["workshops", "Workshops"], ["support", "Support Channel"]].map(([k, l]) => (
                        <CheckRow key={k} label={l} checked={plan.people?.adoption?.[k] || false} onChange={v => setPlan(p => ({ ...p, people: { ...p.people, adoption: { ...p.people.adoption, [k]: v } } }))} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: COLORS.white, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
                <SectionHeader title="How We Measure Success" color={COLORS.greige} />
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>After 90 days we've succeeded if:</label>
                    <EditableField multiline value={plan.success?.after90 || ""} onChange={v => setPlan(p => ({ ...p, success: { ...p.success, after90: v } }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Key Metrics</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[["time", "Time saved"], ["quality", "Quality"], ["adoption", "Adoption"], ["revenue", "Revenue"], ["risk", "Risk"]].map(([k, l]) => (
                        <CheckRow key={k} label={l} checked={plan.success?.metrics?.[k] || false} onChange={v => setPlan(p => ({ ...p, success: { ...p.success, metrics: { ...p.success.metrics, [k]: v } } }))} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Baseline / Starting point</label>
                    <EditableField value={plan.success?.baseline || ""} onChange={v => setPlan(p => ({ ...p, success: { ...p.success, baseline: v } }))} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: COLORS.white, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 6px rgba(44,36,32,0.06)", marginBottom: 20 }}>
              <SectionHeader title="Action Plan · 30 / 90 / 180 Days" color={COLORS.dark} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
                {[["days30", "30 Days — Quick wins & foundation", COLORS.blush], ["days90", "90 Days — First use cases live", COLORS.greige], ["days180", "180 Days — Scale & learn", COLORS.dark]].map(([phase, label, col]) => (
                  <div key={phase} style={{ borderRight: `1px solid ${COLORS.midGrey}` }}>
                    <div style={{ background: col, color: col === COLORS.dark ? COLORS.white : COLORS.dark, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ padding: "12px 14px" }}>
                      {(plan.actions[phase] || []).map((a, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.greigeDark, marginBottom: 3 }}>{idx + 1}.</div>
                          <EditableField multiline value={a.action} onChange={v => updateAction(phase, idx, "action", v)} placeholder="Action..." style={{ minHeight: 52 }} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 5 }}>
                            <EditableField value={a.owner} onChange={v => updateAction(phase, idx, "owner", v)} placeholder="Owner" />
                            <EditableField value={a.deadline} onChange={v => updateAction(phase, idx, "deadline", v)} placeholder="Deadline" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", padding: "12px 0", borderTop: `1px solid ${COLORS.midGrey}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ width: 20, height: 20, background: COLORS.dark, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: COLORS.white, fontSize: 9, fontWeight: 800 }}>A</span>
              </div>
              <span style={{ fontSize: 11, color: COLORS.greigeDark, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>AILY · aily.dk</span>
            </div>
          </>}

          {activeTab === "background" && (
            <div style={{ background: COLORS.white, borderRadius: 8, padding: 32, boxShadow: "0 1px 6px rgba(44,36,32,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `2px solid ${COLORS.blush}`, paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.dark, margin: 0 }}>Background Intelligence Paper</h2>
                  <p style={{ fontSize: 12, color: COLORS.greigeDark, margin: "4px 0 0" }}>Supporting research and market context for your AI Execution Plan</p>
                </div>
                <button onClick={handlePrint} style={{ background: COLORS.dark, color: COLORS.white, border: "none", borderRadius: 5, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🖨 Print</button>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: COLORS.dark }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(backgroundPaper) }} />
              <div style={{ marginTop: 32, borderTop: `1px solid ${COLORS.midGrey}`, paddingTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, background: COLORS.dark, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: COLORS.white, fontSize: 9, fontWeight: 800 }}>A</span>
                </div>
                <span style={{ fontSize: 11, color: COLORS.greigeDark, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>AILY · aily.dk</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
