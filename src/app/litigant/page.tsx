"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface HearingHistory {
  hearing_no: number;
  date: string;
  stage: string;
  description: string;
  presiding_officer: string;
  next_date: string | null;
  adjourned: boolean;
}

interface CaseData {
  cnr: string;
  case_title: string;
  case_type: string;
  court: string;
  judge: string;
  filing_date: string;
  status: string;
  current_stage: string;
  next_hearing_date: string | null;
  scheduling_rationale_tags: string[];
  judgment_reference?: {
    pdf_link: string;
    summary: string;
  } | null;
  hearing_history: HearingHistory[];
  readiness_indicators: {
    total_hearings_held: number;
    adjournments: number;
    adjournment_rate: number;
    procedural_progress_pct: number;
    current_stage: string;
    is_final_stage: boolean;
  };
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  time: string;
}

// All 22 Eighth Schedule languages + English
const LANGUAGE_OPTIONS: { code: string; name: string; native: string }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "ks", name: "Kashmiri", native: "कॉशुर" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
];

import { Suspense } from "react";

export default function LitigantPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">Loading portal...</div>}>
      <LitigantPortalContent />
    </Suspense>
  );
}

function LitigantPortalContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [error, setError] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Multilingual state
  const [selectedLang, setSelectedLang] = useState("en");

  // WhatsApp modal state
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);

  // NyayaDrishti Summarizer modal state
  const [summarizerOpen, setSummarizerOpen] = useState(false);
  const [summarizerText, setSummarizerText] = useState("");
  const [summarizerFile, setSummarizerFile] = useState<File | null>(null);
  const [summarizerLoading, setSummarizerLoading] = useState(false);
  const [summarizerResult, setSummarizerResult] = useState("");
  const summarizerFileRef = useRef<HTMLInputElement>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const searchParams = useSearchParams();

  // Load case from URL automatically
  useEffect(() => {
    const cnr = searchParams.get("cnr");
    if (cnr) {
      setSearchQuery(cnr);
      const loadCase = async () => {
        setLoading(true);
        try {
          const res = await fetch(`http://localhost:8000/api/public/case/${cnr}`);
          if (res.ok) {
            const data = await res.json();
            setCaseData(data);
          } else {
             setError("Case not found.");
          }
        } catch (err) {
          setError("Error fetching case.");
        } finally {
          setLoading(false);
        }
      };
      loadCase();
    }
  }, [searchParams]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [chatOpen]);

  // Toast auto-hide
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ message: "", visible: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setCaseData(null);

    try {
      const res = await fetch(`http://localhost:8000/api/public/case/${searchQuery}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Case not found. Please check the CNR." : "Error fetching case.");
      }
      const data = await res.json();
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || "Failed to search case");
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => setChatOpen(!chatOpen);

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !caseData) return;

    const userText = chatInput.trim();
    const newMsg: ChatMessage = { sender: "user", text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnr: caseData.cnr, message: userText, language: selectedLang }),
      });
      if (!res.ok) throw new Error("Chat error");
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I am unable to connect to the legal reasoning engine at this moment.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // WhatsApp handler
  const handleWhatsAppSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !whatsappPhone.trim()) return;

    setWhatsappSending(true);
    try {
      const res = await fetch("http://localhost:8000/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnr: caseData.cnr,
          phone: whatsappPhone.trim(),
          hearing_date: caseData.next_hearing_date || "To be scheduled",
        }),
      });
      if (!res.ok) throw new Error("WhatsApp API error");
      const data = await res.json();
      setWhatsappSuccess(true);
      showToast(`✅ ${data.message}`);
      setTimeout(() => {
        setWhatsappOpen(false);
        setWhatsappSuccess(false);
        setWhatsappPhone("");
      }, 2000);
    } catch (err) {
      showToast("❌ Failed to subscribe. Please try again.");
    } finally {
      setWhatsappSending(false);
    }
  };

  // NyayaDrishti Summarizer handler
  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summarizerText.trim() && !summarizerFile) return;

    setSummarizerLoading(true);
    setSummarizerResult("");

    try {
      const formData = new FormData();
      if (summarizerFile) {
        formData.append("file", summarizerFile);
      }
      if (summarizerText.trim()) {
        formData.append("text", summarizerText.trim());
      }

      const res = await fetch("http://localhost:8000/api/summarize", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Summarization failed");
      }
      const data = await res.json();
      setSummarizerResult(data.summary);
    } catch (err: any) {
      setSummarizerResult(`Error: ${err.message || "Failed to summarize document."}`);
    } finally {
      setSummarizerLoading(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summarizerResult);
    showToast("✅ Summary copied to clipboard");
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".txt"))) {
      setSummarizerFile(file);
    } else {
      showToast("❌ Only .pdf and .txt files are supported");
    }
  };

  return (
    <>
      {/* TopNavBar (Web) */}
      <nav className="bg-surface-container-lowest border-b border-outline-variant docked full-width top-0 z-40 relative">
        <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-container-max mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-stack-md">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"><img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-sm mix-blend-multiply" /><span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span></div>
            </Link>
          </div>
          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-stack-lg h-full">
            <Link className="h-full flex items-center text-primary border-b-2 border-primary pb-1 font-headline-md text-headline-md" href="/litigant">
              Dashboard
            </Link>
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant/causelist">
              Cause-list
            </Link>
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant/analytics">
              Analytics
            </Link>
            {/* NyayaDrishti Trigger */}
            <button
              onClick={() => setSummarizerOpen(true)}
              className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Simplify Document
            </button>
          </div>
          {/* Right Actions */}
          <div className="flex items-center gap-stack-md">
            <form onSubmit={handleSearch} className="hidden md:flex items-center border border-outline-variant px-stack-md py-unit bg-surface-bright focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-unit">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 p-0 text-body-md w-48 font-body-md text-on-surface placeholder:text-outline outline-none"
                placeholder="Search cases..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="w-8 h-8 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant flex items-center justify-center">
              <img
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOQtr-lcjLAUElpllsCtVKl6QfboGCHeFbrK7S7RGZ2LnbooT3mRJdx6Ema9C2uzrFFkCcAGT-M1cqngwLyEtz2u2nf_l0MNtsKKCyZ--Cd-avz04-jO5Y3JW09sCUox_THT_Q-CSo-SxenDXJeX2USTXXMnZ_25a5HxXsytBr5C9aP0wvZ3XuJnal0-82XclMEoY1h4D4llS-tzV6TyuJINtFl1azBEd2yrr0R0ndjHtd91hl4gpmQg"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max w-full mx-auto pb-32 md:pb-stack-lg">
        {/* Search Interface */}
        <div className="w-full max-w-3xl mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-center mb-stack-md">Track Your Case</h1>
          <form onSubmit={handleSearch} className="relative w-full">
            <label className="sr-only" htmlFor="caseSearch">
              Enter Case Number or CNR
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-4 border border-outline-variant bg-surface-lowest text-on-surface font-body-lg text-body-lg focus:outline-none focus:ring-0 focus:border-tertiary focus:border-2 transition-all outline-none"
              id="caseSearch"
              placeholder="Enter Case Number or CNR (e.g., DLCT822018000002)"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute inset-y-2 right-2 px-stack-md bg-tertiary text-on-tertiary font-label-caps text-label-caps hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "SEARCHING..." : "SEARCH"}
            </button>
          </form>
          <p className="font-data-tabular text-data-tabular text-secondary text-center mt-unit">
            Example: DLCT822018000002
          </p>
          {error && <p className="text-error text-center mt-4 font-body-md">{error}</p>}
        </div>

        {/* Bento Grid for Results */}
        {caseData && (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Result Card 2: Scheduling Rationale / Judgment Reference */}
            <div className="md:col-span-12 border border-outline-variant bg-surface-lowest p-stack-md flex flex-col justify-between items-start gap-stack-sm">
              <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-sm mb-stack-sm">
                <div>
                  <h2 className="font-headline-md text-headline-md mb-unit">{caseData.case_title}</h2>
                  <p className="font-body-md text-body-md text-secondary">
                    Case CNR: {caseData.cnr} | {caseData.case_type} | {caseData.court}
                  </p>
                </div>
                <div className="flex flex-wrap gap-unit">
                  <div className="flex flex-col items-start md:items-end gap-unit">
                    <p className="font-body-md text-body-md text-secondary mb-unit">
                      Next Hearing: {caseData.next_hearing_date ? caseData.next_hearing_date : "None"} • {caseData.current_stage}
                    </p>
                    <div className="flex flex-wrap gap-unit">
                      {caseData.scheduling_rationale_tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-surface-container-high text-secondary font-label-caps text-label-caps border border-outline-variant">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="w-full flex flex-wrap gap-stack-sm mt-stack-sm border-t border-outline-variant pt-stack-sm">
                <button
                  onClick={() => setWhatsappOpen(true)}
                  className="flex items-center gap-2 px-stack-md py-unit bg-surface-lowest text-primary border border-outline-variant hover:bg-surface-container transition-colors font-label-caps text-label-caps"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Get WhatsApp Updates
                </button>
                <button
                  onClick={() => setSummarizerOpen(true)}
                  className="flex items-center gap-2 px-stack-md py-unit bg-surface-lowest text-primary border border-outline-variant hover:bg-surface-container transition-colors font-label-caps text-label-caps"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Simplify Legal Document
                </button>
              </div>

              {/* Judgment Reference Block */}
              {caseData.status === "Closed" && caseData.judgment_reference && (
                <div className="w-full mt-stack-md border-t border-outline-variant pt-stack-md">
                  <h3 className="font-label-caps text-label-caps text-primary mb-unit">FINAL JUDGMENT</h3>
                  <div className="flex flex-col md:flex-row gap-stack-md items-start md:items-center bg-surface-bright p-stack-sm border border-outline-variant">
                    <p className="flex-1 font-body-md text-body-md text-on-surface-variant">
                      {caseData.judgment_reference.summary}
                    </p>
                    <a 
                      href={caseData.judgment_reference.pdf_link}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="whitespace-nowrap px-stack-md py-unit bg-primary text-on-primary font-label-md hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                      View Judgment
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Result Card 1: Vertical Timeline Stepper */}
            <div className="md:col-span-7 border border-outline-variant bg-surface-lowest p-stack-md flex flex-col h-full">
              <h3 className="font-label-caps text-label-caps text-secondary mb-stack-md border-b border-outline-variant pb-unit">
                CASE HISTORY
              </h3>
              <div className="flex-grow">
                <ul className="relative border-l border-outline-variant ml-3 space-y-stack-md">
                  {[...caseData.hearing_history].reverse().map((hearing, idx) => (
                    <li key={idx} className="pl-stack-md relative">
                      <span className={`absolute w-3 h-3 ${idx === 0 ? "bg-tertiary ring-surface-lowest" : "bg-surface-container ring-surface-lowest border border-outline-variant"} -left-[6.5px] top-1.5 ring-4`}></span>
                      <div className="flex justify-between items-baseline mb-unit">
                        <h4 className="font-headline-md text-headline-md text-base">{hearing.stage}</h4>
                        <time className="font-data-tabular text-data-tabular text-secondary">{hearing.date}</time>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {hearing.description}
                        {hearing.adjourned && <span className="text-error font-bold ml-1">[ADJOURNED]</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Result Card 3: Hearing Readiness Checklist */}
            <div className="md:col-span-5 border border-outline-variant bg-surface-lowest p-stack-md flex flex-col h-full bg-surface-bright">
              <h3 className="font-label-caps text-label-caps text-secondary mb-stack-md border-b border-outline-variant pb-unit">
                HEARING READINESS
              </h3>
              <div className="space-y-stack-sm flex-grow">
                <div className="flex items-center gap-stack-sm py-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    info
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface-variant">Procedural Progress</span>
                    <span className="text-[10px] text-secondary">
                      {caseData.readiness_indicators.procedural_progress_pct}% complete
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-stack-sm py-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    pending_actions
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface-variant">Historical Adjournments</span>
                    <span className="text-[10px] text-secondary">
                      {caseData.readiness_indicators.adjournments} adjournments ({Math.round(caseData.readiness_indicators.adjournment_rate * 100)}% rate)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-stack-sm py-1">
                  <span className={`material-symbols-outlined ${caseData.readiness_indicators.is_final_stage ? "text-primary" : "text-outline"}`} style={{ fontVariationSettings: caseData.readiness_indicators.is_final_stage ? "'FILL' 1" : "'FILL' 0" }}>
                    {caseData.readiness_indicators.is_final_stage ? "check_circle" : "schedule"}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface">Final Stage</span>
                    <span className="text-[10px] text-secondary">
                      {caseData.readiness_indicators.is_final_stage ? "Case is at Judgment stage" : "Awaiting further proceedings"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-stack-md pt-stack-sm border-t border-outline-variant">
                <p className="text-center font-body-md text-secondary italic">Status synced from NyayaSetu DB.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-margin-mobile py-stack-sm bg-surface-lowest text-primary border-t border-outline-variant z-[45] pb-safe">
        <Link className="flex flex-col items-center justify-center text-primary font-bold p-2" href="/">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-label-caps text-[10px]">Home</span>
        </Link>
        <button
          className={`flex items-center gap-unit bg-tertiary text-on-tertiary px-4 py-2 rounded-full shadow-lg fab-enter ${chatOpen ? 'fab-hidden' : 'fab-visible'}`}
          onClick={toggleChat}
        >
          <span className="material-symbols-outlined">smart_toy</span>
          <span className="font-label-caps">NyayaMitra AI</span>
        </button>
      </nav>

      {/* Desktop Floating Action Button (Trigger) */}
      <div className={`hidden md:block fixed bottom-margin-desktop right-margin-desktop z-[45] fab-enter ${chatOpen ? 'fab-hidden' : 'fab-visible'}`}>
        <button
          className="bg-tertiary text-on-tertiary rounded-full px-6 py-3 flex items-center gap-2 shadow-lg hover:opacity-90"
          onClick={toggleChat}
        >
          <span className="material-symbols-outlined text-[24px]">smart_toy</span>
          <span className="font-headline-md text-headline-md">NyayaMitra AI</span>
        </button>
      </div>

      {/* Scrim Background */}
      <div
        className={`fixed inset-0 bg-black/50 z-[50] ${chatOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ transition: 'opacity 450ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        onClick={toggleChat}
      ></div>

      {/* Floating Chat Modal (NyayaMitra) */}
      <div
        className={`fixed bottom-0 left-0 md:left-auto md:bottom-margin-desktop md:right-margin-desktop w-full md:w-[400px] h-[80dvh] max-h-[600px] md:max-h-[calc(100vh-120px)] bg-surface-lowest border-t md:border border-outline-variant flex flex-col z-[60] shadow-2xl rounded-t-xl md:rounded-xl origin-bottom md:origin-bottom-right ${chatOpen ? "scale-100 translate-y-0 opacity-100 pointer-events-auto" : "scale-90 md:scale-50 translate-y-[100%] md:translate-y-[40%] md:translate-x-[40%] opacity-0 pointer-events-none"}`}
        style={{ transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 450ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Chat Header with Language Selector */}
        <div className="flex justify-between items-center px-stack-md py-stack-sm border-b border-outline-variant bg-surface-bright rounded-t-xl">
          <div className="flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">smart_toy</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-primary leading-none">NyayaMitra AI</h3>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Legal Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-unit">
            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent border-none text-[11px] font-data-tabular text-secondary focus:outline-none focus:ring-0 cursor-pointer p-0 pr-4 appearance-none"
              title="Select language"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23555f6d' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0 center',
                backgroundSize: '12px',
              }}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>
            <button className="text-secondary hover:text-primary transition-colors" onClick={toggleChat}>
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-stack-md flex flex-col gap-stack-md bg-surface-container-lowest no-scrollbar h-full" ref={chatScrollRef}>
          <div className="text-center w-full">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest bg-surface-bright px-2 py-1 border border-outline-variant">
              Today, {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
          </div>

          <div className="flex flex-col items-start w-full">
            <span className="font-label-caps text-label-caps text-secondary mb-unit ml-1">NyayaMitra</span>
            <div className="bg-surface-container text-on-surface p-stack-sm border border-outline-variant max-w-[90%] rounded-none flex flex-col gap-stack-sm">
              <p className="font-body-md text-body-md leading-relaxed">
                Hello! I am NyayaMitra AI. {caseData ? `You are viewing case ${caseData.cnr}.` : "Search for a case to begin."} What legal questions can I answer for you based on the case record?
              </p>
            </div>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} w-full`}>
              <span className={`font-label-caps text-label-caps text-secondary mb-unit ${msg.sender === "user" ? "mr-1" : "ml-1"}`}>
                {msg.sender === "user" ? "You" : "NyayaMitra"}
              </span>
              <div className={`p-stack-sm max-w-[90%] rounded-none border flex flex-col gap-stack-sm ${msg.sender === "user" ? "bg-inverse-surface text-inverse-on-surface border-tertiary" : "bg-surface-container text-on-surface border-outline-variant"}`}>
                <p className="font-body-md text-body-md leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {chatLoading && (
             <div className="flex flex-col items-start w-full">
               <span className="font-label-caps text-label-caps text-secondary mb-unit ml-1">NyayaMitra</span>
               <div className="bg-surface-container text-on-surface p-stack-sm border border-outline-variant max-w-[90%] rounded-none flex items-center justify-center">
                 <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
               </div>
             </div>
          )}
        </div>

        {/* Sticky Footer Input */}
        <div className="p-stack-sm border-t border-outline-variant bg-surface-bright rounded-b-none md:rounded-b-xl pb-safe md:pb-stack-sm">
          {/* Language indicator bar */}
          {selectedLang !== "en" && (
            <div className="flex items-center gap-unit mb-unit px-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">translate</span>
              <span className="font-data-tabular text-[10px] text-secondary">
                Responding in {LANGUAGE_OPTIONS.find(l => l.code === selectedLang)?.name || selectedLang}
              </span>
            </div>
          )}
          <form onSubmit={handleSendChat} className="flex items-center border border-outline-variant bg-surface-container-lowest focus-within:border-primary focus-within:border-b-2 transition-all">
            <input
              autoComplete="off"
              className="flex-1 bg-transparent border-none focus:ring-0 p-stack-sm font-body-md text-on-surface placeholder:text-outline outline-none"
              placeholder={caseData ? "Ask a legal question..." : "Search for a case first..."}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!caseData || chatLoading}
            />
            <button type="submit" disabled={!caseData || chatLoading || !chatInput.trim()} className="p-stack-sm text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center border-l border-outline-variant disabled:opacity-50">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
          <div className="text-center mt-unit">
            <span className="font-data-tabular text-[10px] text-outline">
              NyayaMitra AI provides general information, not legal counsel.
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ WhatsApp Subscription Modal ═══════ */}
      {whatsappOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => { setWhatsappOpen(false); setWhatsappSuccess(false); }}>
          <div className="bg-surface-lowest max-w-sm w-full border border-outline-variant shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary text-on-primary px-stack-md py-stack-sm flex justify-between items-center border-b border-primary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <h3 className="font-headline-md text-headline-md">WhatsApp Updates</h3>
              </div>
              <button onClick={() => { setWhatsappOpen(false); setWhatsappSuccess(false); }} className="hover:text-outline-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {whatsappSuccess ? (
              <div className="p-stack-md flex flex-col items-center gap-stack-md">
                <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-headline-md text-headline-md text-primary text-center">Subscribed!</p>
                <p className="font-body-md text-body-md text-secondary text-center">
                  You will receive hearing reminders on WhatsApp for case {caseData?.cnr}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWhatsAppSubscribe} className="p-stack-md flex flex-col gap-stack-sm">
                <p className="font-body-md text-body-md text-secondary">
                  Get hearing date reminders for <strong>{caseData?.cnr}</strong> directly on WhatsApp.
                </p>
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Mobile Number</label>
                  <div className="flex items-center border border-outline-variant bg-surface-bright focus-within:border-primary transition-colors">
                    <span className="px-2 text-secondary font-data-tabular text-[13px] border-r border-outline-variant">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-body-md font-data-tabular"
                      placeholder="9876543210"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <p className="font-data-tabular text-[10px] text-outline mt-1">Enter your 10-digit mobile number</p>
                </div>
                <div className="flex justify-end gap-stack-sm mt-stack-sm">
                  <button type="button" onClick={() => setWhatsappOpen(false)} className="px-4 py-2 border border-outline-variant text-secondary hover:bg-surface-container transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={whatsappSending || whatsappPhone.length !== 10}
                    className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
                  >
                    {whatsappSending && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                    Subscribe
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══════ NyayaDrishti Summarizer Modal ═══════ */}
      {summarizerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSummarizerOpen(false)}>
          <div className="bg-surface-lowest max-w-2xl w-full border border-outline-variant shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-primary text-on-primary px-stack-md py-stack-sm flex justify-between items-center border-b border-primary flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">description</span>
                <h3 className="font-headline-md text-headline-md">NyayaDrishti — Simplify Legal Text</h3>
              </div>
              <button onClick={() => setSummarizerOpen(false)} className="hover:text-outline-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-stack-md flex flex-col gap-stack-md">
              {!summarizerResult ? (
                <form onSubmit={handleSummarize} className="flex flex-col gap-stack-md">
                  {/* Drag & Drop Zone */}
                  <div
                    className="border-2 border-dashed border-outline-variant p-stack-lg flex flex-col items-center justify-center gap-stack-sm hover:border-primary transition-colors cursor-pointer bg-surface-bright"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => summarizerFileRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-[40px] text-secondary">upload_file</span>
                    <p className="font-body-md text-body-md text-secondary text-center">
                      Drag & drop a <strong>.pdf</strong> or <strong>.txt</strong> file here, or click to browse
                    </p>
                    {summarizerFile && (
                      <div className="flex items-center gap-2 mt-unit px-3 py-1 bg-surface-container border border-outline-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">attach_file</span>
                        <span className="font-data-tabular text-data-tabular text-primary">{summarizerFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSummarizerFile(null); }}
                          className="text-secondary hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                    <input
                      ref={summarizerFileRef}
                      type="file"
                      accept=".pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setSummarizerFile(e.target.files[0]);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-stack-sm">
                    <div className="flex-1 h-px bg-outline-variant"></div>
                    <span className="font-label-caps text-label-caps text-outline">OR PASTE TEXT</span>
                    <div className="flex-1 h-px bg-outline-variant"></div>
                  </div>

                  {/* Text Input */}
                  <textarea
                    className="w-full border border-outline-variant bg-surface-bright p-stack-sm focus:border-primary outline-none text-body-md font-body-md min-h-[120px] resize-y transition-colors"
                    placeholder="Paste legal text, judgment excerpt, or court order here..."
                    value={summarizerText}
                    onChange={(e) => setSummarizerText(e.target.value)}
                  />

                  <div className="flex justify-end gap-stack-sm">
                    <button type="button" onClick={() => setSummarizerOpen(false)} className="px-4 py-2 border border-outline-variant text-secondary hover:bg-surface-container transition-colors">Cancel</button>
                    <button
                      type="submit"
                      disabled={summarizerLoading || (!summarizerText.trim() && !summarizerFile)}
                      className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
                    >
                      {summarizerLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                          Simplify
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-stack-md">
                  {/* Summary Result */}
                  <div className="border border-outline-variant bg-surface-bright p-stack-md">
                    <div className="flex justify-between items-center mb-stack-sm border-b border-outline-variant pb-unit">
                      <h4 className="font-label-caps text-label-caps text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        SIMPLIFIED SUMMARY
                      </h4>
                      <button
                        onClick={handleCopySummary}
                        className="flex items-center gap-1 px-2 py-1 text-secondary hover:text-primary transition-colors font-label-caps text-label-caps border border-outline-variant hover:bg-surface-container"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <div className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {summarizerResult}
                    </div>
                  </div>

                  <div className="flex justify-end gap-stack-sm">
                    <button
                      onClick={() => { setSummarizerResult(""); setSummarizerText(""); setSummarizerFile(null); }}
                      className="px-4 py-2 border border-outline-variant text-secondary hover:bg-surface-container transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Summarize Another
                    </button>
                    <button onClick={() => setSummarizerOpen(false)} className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 transition-opacity">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Toast Notification ═══════ */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-stack-md py-stack-sm bg-inverse-surface text-inverse-on-surface font-body-md text-body-md border border-outline shadow-xl transition-all duration-300 ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {toast.message}
      </div>
    </>
  );
}
