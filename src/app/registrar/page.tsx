"use client";

import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════
//  MFA Login Gate Component
// ═══════════════════════════════════════════════════════════════

function MFALoginGate({ onAuthenticated }: { onAuthenticated: (username: string) => void }) {
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA state
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/registrar/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid credentials");
      }

      const data = await res.json();
      if (data.mfa_required) {
        // Fetch QR code
        const qrRes = await fetch(`http://localhost:8000/api/auth/registrar/mfa/setup?username=${username}`);
        if (!qrRes.ok) throw new Error("Failed to generate MFA setup");
        const qrData = await qrRes.json();
        setQrCode(qrData.qr_code);
        setTotpSecret(qrData.secret);
        setStep("mfa");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setMfaError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/registrar/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, totp_code: totpCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid TOTP code");
      }

      const data = await res.json();
      // Persist session
      sessionStorage.setItem("nyayasetu_session", JSON.stringify({
        token: data.session_token,
        username: data.username,
        authenticated_at: new Date().toISOString(),
      }));
      onAuthenticated(data.username);
    } catch (err: any) {
      setMfaError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-stack-lg">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-sm mix-blend-multiply" />
          <span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span>
        </div>

        <div className="border border-outline-variant bg-surface-lowest shadow-xl">
          {/* Step Indicator */}
          <div className="flex border-b border-outline-variant">
            <div className={`flex-1 text-center py-stack-sm font-label-caps text-label-caps border-b-2 transition-colors ${step === "credentials" ? "border-primary text-primary" : "border-transparent text-secondary"}`}>
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">lock</span>
              Step 1: Credentials
            </div>
            <div className={`flex-1 text-center py-stack-sm font-label-caps text-label-caps border-b-2 transition-colors ${step === "mfa" ? "border-primary text-primary" : "border-transparent text-secondary"}`}>
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">security</span>
              Step 2: MFA
            </div>
          </div>

          {step === "credentials" ? (
            <form onSubmit={handleLogin} className="p-stack-md flex flex-col gap-stack-md">
              <div className="text-center mb-stack-sm">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-unit">Registrar Access</h1>
                <p className="font-body-md text-body-md text-secondary">Enter your credentials to access the court management system.</p>
              </div>

              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Registrar ID</label>
                <div className="flex items-center border border-outline-variant bg-surface-bright focus-within:border-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-secondary px-2">person</span>
                  <input
                    type="text"
                    required
                    className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-body-md"
                    placeholder="Enter registrar ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Access Key</label>
                <div className="flex items-center border border-outline-variant bg-surface-bright focus-within:border-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-secondary px-2">key</span>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-body-md"
                    placeholder="Enter access key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-error-container text-on-error-container border border-error text-body-md">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary font-label-caps text-label-caps hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">login</span>}
                {loading ? "VERIFYING..." : "VERIFY CREDENTIALS"}
              </button>

              <div className="text-center">
                <p className="font-data-tabular text-[10px] text-outline">
                  Demo credentials: registrar / nyayasetu2024
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMFAVerify} className="p-stack-md flex flex-col gap-stack-md">
              <div className="text-center mb-stack-sm">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-unit">Multi-Factor Authentication</h1>
                <p className="font-body-md text-body-md text-secondary">
                  Scan the QR code below with your authenticator app, then enter the 6-digit code.
                </p>
              </div>

              {/* QR Code Display */}
              <div className="flex flex-col items-center gap-stack-sm">
                <div className="border border-outline-variant p-stack-sm bg-white">
                  {qrCode ? (
                    <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">sync</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-center">
                  <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                  <p className="font-data-tabular text-[10px] text-secondary">
                    Compatible with Microsoft Authenticator, Google Authenticator & Apple Keychain
                  </p>
                </div>
                {/* Manual secret fallback */}
                {totpSecret && (
                  <details className="w-full">
                    <summary className="font-label-caps text-label-caps text-secondary cursor-pointer text-center text-[10px] hover:text-primary transition-colors">
                      Can't scan? Enter key manually
                    </summary>
                    <div className="mt-unit flex items-center justify-center gap-2 bg-surface-bright border border-outline-variant px-3 py-2">
                      <code className="font-data-tabular text-data-tabular text-primary select-all">{totpSecret}</code>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(totpSecret); }}
                        className="text-secondary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  </details>
                )}
              </div>

              {/* TOTP Code Input */}
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="w-full p-3 border border-outline-variant bg-surface-bright focus:border-primary outline-none text-center text-headline-lg font-data-tabular tracking-[0.5em] transition-colors"
                  placeholder="• • • • • •"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>

              {mfaError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-error-container text-on-error-container border border-error text-body-md">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {mfaError}
                </div>
              )}

              <div className="flex gap-stack-sm">
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setTotpCode(""); setMfaError(""); }}
                  className="flex-1 py-3 border border-outline-variant text-secondary hover:bg-surface-container font-label-caps text-label-caps transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={verifying || totpCode.length !== 6}
                  className="flex-1 py-3 bg-primary text-on-primary font-label-caps text-label-caps hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                >
                  {verifying ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">verified_user</span>}
                  {verifying ? "VERIFYING..." : "AUTHENTICATE"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-stack-md font-data-tabular text-[10px] text-outline">
          Secured by NyayaSetu TOTP Multi-Factor Authentication
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main Registrar Dashboard (shown after MFA)
// ═══════════════════════════════════════════════════════════════

interface ScheduleCase {
  cnr: string;
  title: string;
  court: string;
  stage: string;
  priority: string;
  priority_weight: number;
  estimated_duration_min: number;
  adjournment_risk: number;
  advocate_id: string;
  tags: string[];
}

interface AdvocateClash {
  advocate_id: string;
  conflicting_cnrs: string[];
  courts_involved: string[];
  note: string;
}

interface ScheduleResponse {
  schedule_date: string;
  solver_status: string;
  capacity: {
    daily_bench_capacity_min: number;
    hard_cap_min: number;
    emergency_buffer_min: number;
    scheduled_duration_min: number;
    utilization_pct: number;
  };
  total_cases_considered: number;
  total_cases_scheduled: number;
  advocate_clashes: AdvocateClash[];
  morning_roll_call_high_risk: ScheduleCase[];
  substantive_hearings_low_risk: ScheduleCase[];
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function RegistrarDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("nyayasetu_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.token && session.username) {
          // Verify the session is still valid
          fetch(`http://localhost:8000/api/auth/registrar/verify-session?token=${session.token}`)
            .then(res => res.json())
            .then(data => {
              if (data.valid) {
                setAuthenticated(true);
                setAuthUsername(data.username);
              }
              setAuthChecked(true);
            })
            .catch(() => setAuthChecked(true));
          return;
        }
      } catch {}
    }
    setAuthChecked(true);
  }, []);

  const handleAuthenticated = (username: string) => {
    setAuthenticated(true);
    setAuthUsername(username);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("nyayasetu_session");
    setAuthenticated(false);
    setAuthUsername("");
  };

  // Show nothing while checking session
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">sync</span>
      </div>
    );
  }

  if (!authenticated) {
    return <MFALoginGate onAuthenticated={handleAuthenticated} />;
  }

  return <RegistrarDashboardContent username={authUsername} onLogout={handleLogout} />;
}

function RegistrarDashboardContent({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [filterText, setFilterText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedState, setSelectedState] = useState("ALL");

  // Urgent Mention State
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [urgentForm, setUrgentForm] = useState({ cnr: "", case_title: "", advocate_id: "", estimated_duration_min: 15 });
  const [injecting, setInjecting] = useState(false);

  useEffect(() => {
    fetchSchedule(selectedState);
  }, [selectedState]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatOpen, chatLoading]);

  useEffect(() => {
    if (chatOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [chatOpen]);

  const fetchSchedule = async (stateFilter = selectedState) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/schedule/optimized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 40, state_code: stateFilter }),
      });
      if (!res.ok) throw new Error("Failed to generate optimized schedule");
      const data = await res.json();
      setScheduleData(data);
      
      if (data.advocate_clashes && data.advocate_clashes.length > 0) {
        setMessages([
          {
            sender: "ai",
            text: `Good morning, Registrar. I notice ${data.advocate_clashes.length} schedule clash(es) today. For example, ${data.advocate_clashes[0].advocate_id} is listed in multiple courtrooms. Would you like me to draft an urgent notification or summarize the clashes?`
          }
        ]);
      } else {
        setMessages([
          { sender: "ai", text: "Good morning, Registrar. The daily schedule has been optimized successfully with no detected advocate clashes. How can I assist you?" }
        ]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      let context = "";
      if (scheduleData) {
         context = `Scheduled ${scheduleData.total_cases_scheduled} out of ${scheduleData.total_cases_considered} considered cases.\n`;
         context += `Utilization: ${scheduleData.capacity.utilization_pct}% (${scheduleData.capacity.scheduled_duration_min} / ${scheduleData.capacity.daily_bench_capacity_min} mins).\n`;
         if (scheduleData.advocate_clashes.length > 0) {
            context += `CLASHES DETECTED:\n`;
            scheduleData.advocate_clashes.forEach(clash => {
               context += `- Advocate ${clash.advocate_id} has conflicts across courts: ${clash.courts_involved.join(", ")}.\n`;
            });
         }
         
         context += `\nHIGH RISK CASES (Morning Roll-Call):\n`;
         scheduleData.morning_roll_call_high_risk.forEach(c => {
            context += `- CNR: ${c.cnr} | Stage: ${c.stage} | Risk: ${Math.round(c.adjournment_risk * 100)}% | Advocate: ${c.advocate_id} | Dur: ${c.estimated_duration_min}m\n`;
         });

         context += `\nLOW RISK CASES (Substantive Hearings):\n`;
         scheduleData.substantive_hearings_low_risk.forEach(c => {
            context += `- CNR: ${c.cnr} | Stage: ${c.stage} | Risk: ${Math.round(c.adjournment_risk * 100)}% | Advocate: ${c.advocate_id} | Dur: ${c.estimated_duration_min}m\n`;
         });
      }

      const res = await fetch("http://localhost:8000/api/chat/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, schedule_context: context }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      
      setMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, I am unable to connect to the reasoning engine." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleChat = () => setChatOpen(!chatOpen);

  const handleExportPDF = () => {
    if (!scheduleData) return;
    const doc = new jsPDF();
    doc.text(`NyayaSetu Master Cause-List: ${scheduleData.schedule_date}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Scheduled: ${scheduleData.capacity.scheduled_duration_min} / ${scheduleData.capacity.daily_bench_capacity_min} mins (${scheduleData.capacity.utilization_pct}%)`, 14, 22);
    
    const columns = ["CNR", "Stage", "Dur. (min)", "Risk", "Advocate", "Priority"];
    
    const morningData = scheduleData.morning_roll_call_high_risk.map(c => [
        c.cnr, c.stage, c.estimated_duration_min.toString(), `${Math.round(c.adjournment_risk * 100)}%`, c.advocate_id, c.priority
    ]);
    
    autoTable(doc, {
        head: [columns],
        body: morningData,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 27, 43] }, // primary color
        didDrawPage: (data) => {
            doc.text("Group 1: Morning Roll-Call (High Risk)", data.settings.margin.left, 28);
        }
    });
    
    const substantiveData = scheduleData.substantive_hearings_low_risk.map(c => [
        c.cnr, c.stage, c.estimated_duration_min.toString(), `${Math.round(c.adjournment_risk * 100)}%`, c.advocate_id, c.priority
    ]);
    
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    autoTable(doc, {
        head: [columns],
        body: substantiveData,
        startY: finalY + 15,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 27, 43] },
        didDrawPage: (data) => {
            doc.text("Group 2: Substantive Hearings (Low Risk)", data.settings.margin.left, finalY + 13);
        }
    });

    doc.save(`cause_list_${scheduleData.schedule_date}.pdf`);
  };

  const handleInjectUrgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setInjecting(true);
    try {
      const res = await fetch("http://localhost:8000/api/cases/urgent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urgentForm),
      });
      if (!res.ok) throw new Error("Failed to inject urgent mention.");
      
      setUrgentModalOpen(false);
      setUrgentForm({ cnr: "", case_title: "", advocate_id: "", estimated_duration_min: 15 });
      // Refetch schedule to see the optimization include the new case
      await fetchSchedule();
    } catch (err) {
      alert("Error injecting case.");
    } finally {
      setInjecting(false);
    }
  };

  const filterCases = (cases: ScheduleCase[]) => {
    if (!filterText.trim()) return cases;
    const lower = filterText.toLowerCase();
    return cases.filter(c => 
        c.cnr.toLowerCase().includes(lower) || 
        c.stage.toLowerCase().includes(lower) || 
        c.advocate_id.toLowerCase().includes(lower) ||
        c.priority.toLowerCase().includes(lower)
    );
  };

  const filteredMorning = scheduleData ? filterCases(scheduleData.morning_roll_call_high_risk) : [];
  const filteredSubstantive = scheduleData ? filterCases(scheduleData.substantive_hearings_low_risk) : [];

  return (
    <>
      {/* TopNavBar */}
      <header className="bg-surface-lowest sticky top-0 border-b border-outline-variant hidden md:block z-40">
        <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-gutter">
            <Link href="/"><div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"><img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-sm mix-blend-multiply" /><span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span></div></Link>
            <nav className="ml-stack-lg flex gap-stack-md">
              <Link className="text-primary border-b-2 border-primary pb-1 cursor-pointer active:opacity-80" href="/registrar">Dashboard</Link>
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar/causelist">Cause-list</Link>
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar/analytics">Analytics</Link>
            </nav>
          </div>
          <div className="flex items-center gap-stack-sm">
            <div className="text-right mr-stack-sm hidden lg:block">
              <p className="font-label-caps text-label-caps text-primary">{username}</p>
              <p className="font-data-tabular text-data-tabular text-secondary text-[10px]">Registrar General, HC-DEL</p>
            </div>
            <div className="flex items-center gap-unit">
              <img 
                alt="Registrar Profile Avatar" 
                className="w-8 h-8 object-cover border border-outline-variant rounded-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBzvqLgzQr6X1_xPEG0B4B96cz-7KXehpVEA4lXskpQXZO1W_vfGPUorSjc-5pWWI_tqiGuoBalIW-nbweeVP1Tie8NJw7pTKqKoYkl1mZ30jktp8lvsJC_7UmGYuDwbMmIbUA5CgZhMIVJEJuDQ8brt6hEMaKMk8i5Xnr0Ol4TOodFs05DvVqy9hteCNLDbgq-DeA3-MWUu7sJ03nJ-6LxDcqpF05o3WeW1yKhHCMFgLKnb9jDXf_Bg" 
              />
              <button
                onClick={onLogout}
                className="p-1 text-secondary hover:text-error transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-[80vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="material-symbols-outlined animate-spin text-[40px] text-primary">sync</span>
            <p className="font-label-caps text-label-caps text-secondary">Optimizing cause-list using OR-Tools...</p>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-stack-md border border-error">
            {error}
          </div>
        ) : scheduleData && (
          <>
            {/* Dashboard Header & Analytics Grid */}
            <section className="mb-stack-lg">
              <div className="flex justify-between items-end mb-stack-md">
                <div>
                  <h1 className="font-headline-lg text-headline-lg text-primary">Daily Operations Overview</h1>
                  <p className="font-data-tabular text-data-tabular text-secondary mt-unit">Session: {scheduleData.schedule_date} | Court Room 12</p>
                </div>
                <div className="flex items-center gap-unit hidden md:flex">
                  <label className="text-sm font-label-md text-secondary whitespace-nowrap">State Filter:</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="p-unit border border-outline-variant bg-surface-lowest text-on-surface focus:outline-none focus:border-primary cursor-pointer text-sm font-body-md"
                  >
                    <option value="ALL">All Jurisdictions</option>
                    <option value="AP">AP - Andhra Pradesh</option>
                    <option value="AR">AR - Arunachal Pradesh</option>
                    <option value="AS">AS - Assam</option>
                    <option value="BR">BR - Bihar</option>
                    <option value="CG">CG - Chhattisgarh</option>
                    <option value="DL">DL - Delhi</option>
                    <option value="GA">GA - Goa</option>
                    <option value="GJ">GJ - Gujarat</option>
                    <option value="HR">HR - Haryana</option>
                    <option value="HP">HP - Himachal Pradesh</option>
                    <option value="JH">JH - Jharkhand</option>
                    <option value="KA">KA - Karnataka</option>
                    <option value="KL">KL - Kerala</option>
                    <option value="MP">MP - Madhya Pradesh</option>
                    <option value="MH">MH - Maharashtra</option>
                    <option value="MN">MN - Manipur</option>
                    <option value="ML">ML - Meghalaya</option>
                    <option value="MZ">MZ - Mizoram</option>
                    <option value="NL">NL - Nagaland</option>
                    <option value="OD">OD - Odisha</option>
                    <option value="PB">PB - Punjab</option>
                    <option value="RJ">RJ - Rajasthan</option>
                    <option value="SK">SK - Sikkim</option>
                    <option value="TN">TN - Tamil Nadu</option>
                    <option value="TG">TG - Telangana</option>
                    <option value="TR">TR - Tripura</option>
                    <option value="UP">UP - Uttar Pradesh</option>
                    <option value="UK">UK - Uttarakhand</option>
                    <option value="WB">WB - West Bengal</option>
                  </select>
                </div>
              </div>
              
              {/* Algorithm Clarification Banner */}
              <div className="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-primary p-stack-md mb-stack-md">
                <p className="font-body-md text-on-surface">
                  <strong className="text-primary font-bold">Algorithmic Triage Active:</strong> The sync daemon found <strong>{scheduleData.total_cases_considered}</strong> pending cases in the database. 
                  To prevent judicial burnout, the Google OR-Tools optimization engine has strictly capped today's cause-list to <strong>{scheduleData.total_cases_scheduled} cases</strong>. 
                  This perfectly fills the {scheduleData.capacity.daily_bench_capacity_min}-minute daily bench limit (reserving {scheduleData.capacity.emergency_buffer_min} mins for emergencies) while maximizing priority clearance.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                {/* Card 1: Bench Capacity */}
                <div className="lg:col-span-5 border border-outline-variant p-stack-md flex flex-col justify-between bg-surface-container-lowest">
                  <div className="flex justify-between items-start mb-stack-md">
                    <h2 className="font-label-caps text-label-caps text-on-surface-variant">Bench Capacity Utilization</h2>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>data_usage</span>
                  </div>
                  <div className="flex items-center gap-stack-md mb-stack-md">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-surface-container stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                        <path className="text-primary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${scheduleData.capacity.utilization_pct}, 100`} strokeWidth="3"></path>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="font-headline-md text-headline-md text-primary leading-none">{scheduleData.capacity.utilization_pct}%</span>
                      </div>
                    </div>
                    <div className="flex-1 font-data-tabular text-data-tabular text-secondary">
                      <div className="flex items-center gap-unit mb-unit">
                        <div className="w-3 h-3 bg-primary"></div>
                        <span>Allocated ({Math.round(scheduleData.capacity.scheduled_duration_min / scheduleData.capacity.daily_bench_capacity_min * 100)}%)</span>
                      </div>
                      <div className="flex items-center gap-unit">
                        <div className="w-3 h-3 bg-surface-container border border-outline-variant"></div>
                        <span>Emergency Buffer (15%)</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setUrgentModalOpen(true)}
                    className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-stack-sm px-stack-md hover:bg-tertiary transition-colors border border-primary flex items-center justify-center gap-unit cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_alert</span>
                    Inject Urgent Mention
                  </button>
                </div>

                {/* Card 2: Backlog Clearance Rate */}
                <div className="lg:col-span-7 border border-outline-variant p-stack-md flex flex-col justify-between bg-surface-container-lowest">
                  <div className="flex justify-between items-start mb-stack-md">
                    <h2 className="font-label-caps text-label-caps text-on-surface-variant">Backlog Clearance Rate</h2>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>bar_chart</span>
                  </div>
                  <div className="h-32 flex items-end gap-stack-sm w-full pt-stack-sm border-b border-outline-variant pb-unit">
                    <div className="w-full flex justify-between items-end h-full gap-unit group">
                      <div className="w-full bg-surface-container h-[40%] hover:bg-surface-variant transition-colors relative"><div className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-tabular text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Mon</div></div>
                      <div className="w-full bg-primary h-[85%] relative"><div className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-tabular text-[10px] font-bold">Tue</div></div>
                      <div className="w-full bg-surface-container h-[60%] hover:bg-surface-variant transition-colors"></div>
                      <div className="w-full bg-surface-container h-[45%] hover:bg-surface-variant transition-colors"></div>
                      <div className="w-full bg-surface-container h-[70%] hover:bg-surface-variant transition-colors"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-stack-sm font-data-tabular text-data-tabular text-secondary">
                    <span>Weekly Avg: +12%</span>
                    <span>Target: 15%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Main Content: Dense Daily Cause-List */}
            <section>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-stack-sm border-b-2 border-primary pb-unit gap-stack-sm">
                <h2 className="font-headline-md text-headline-md text-primary">Master Cause-List</h2>
                <div className="flex gap-stack-sm items-center w-full sm:w-auto">
                  
                  {/* Inline Filter */}
                  <div className={`transition-all duration-300 overflow-hidden flex items-center bg-surface-lowest border border-outline-variant ${filterOpen ? 'w-full sm:w-64 opacity-100 px-2' : 'w-0 opacity-0 border-transparent'}`}>
                     <span className="material-symbols-outlined text-[16px] text-secondary">search</span>
                     <input 
                        type="text" 
                        placeholder="Filter by CNR, Advocate..." 
                        className="w-full bg-transparent border-none focus:ring-0 p-unit text-body-md outline-none"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                     />
                  </div>

                  <button 
                    onClick={() => { setFilterOpen(!filterOpen); if(filterOpen) setFilterText(""); }}
                    className={`p-unit border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer ${filterOpen ? 'bg-surface-container' : ''}`} 
                    title="Toggle Filter"
                  >
                    <span className="material-symbols-outlined text-[18px]">{filterOpen ? 'close' : 'filter_list'}</span>
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="px-stack-sm py-unit border border-outline-variant hover:bg-surface-container transition-colors flex items-center gap-unit font-label-caps text-label-caps cursor-pointer whitespace-nowrap" 
                    title="Export Daily Cause-List (PDF)"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span className="hidden sm:inline">Export (PDF)</span>
                  </button>
                </div>
              </div>
              
              <div className="border border-outline-variant overflow-hidden table-container overflow-x-auto bg-surface-container-lowest">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-bright font-label-caps text-label-caps text-on-surface-variant">
                      <th className="p-stack-sm font-medium w-40">Case CNR</th>
                      <th className="p-stack-sm font-medium w-32">Stage</th>
                      <th className="p-stack-sm font-medium w-24 text-right">Dur. (min)</th>
                      <th className="p-stack-sm font-medium w-24 text-right">Risk (%)</th>
                      <th className="p-stack-sm font-medium min-w-[150px]">Advocate ID</th>
                      <th className="p-stack-sm font-medium w-32">Priority</th>
                      <th className="p-stack-sm font-medium w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-tabular text-data-tabular text-primary">
                    {/* Group 1: Morning Roll-Call */}
                    {filteredMorning.length > 0 && (
                      <>
                        <tr className="bg-surface-container-high border-b border-outline-variant">
                          <td className="px-stack-sm py-unit font-label-caps text-label-caps text-primary font-bold" colSpan={7}>
                            Morning Roll-Call (High Risk)
                          </td>
                        </tr>
                        {filteredMorning.map((caseItem) => {
                          const hasClash = scheduleData.advocate_clashes.some(c => c.advocate_id === caseItem.advocate_id);
                          return (
                            <tr key={caseItem.cnr} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                              <td className="p-stack-sm font-medium">{caseItem.cnr}</td>
                              <td className="p-stack-sm text-secondary truncate max-w-[120px]" title={caseItem.stage}>{caseItem.stage}</td>
                              <td className="p-stack-sm text-right">{caseItem.estimated_duration_min}</td>
                              <td className="p-stack-sm text-right text-error font-bold">{Math.round(caseItem.adjournment_risk * 100)}%</td>
                              <td className="p-stack-sm flex flex-col gap-unit">
                                <div className="flex items-center gap-unit">
                                  {caseItem.advocate_id}
                                  {hasClash && <span className="material-symbols-outlined text-error text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Schedule Clash Detected">warning</span>}
                                </div>
                                {hasClash && <span className="text-[10px] text-error font-medium">Clash detected</span>}
                              </td>
                              <td className="p-stack-sm">
                                <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${caseItem.priority === 'Critical' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                                  {caseItem.priority}
                                </span>
                              </td>
                              <td className="p-stack-sm text-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-7 h-4 bg-surface-variant peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-primary rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-none after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}

                    {/* Group 2: Substantive Hearings */}
                    {filteredSubstantive.length > 0 && (
                      <>
                        <tr className="bg-surface-container-high border-b border-outline-variant">
                          <td className="px-stack-sm py-unit font-label-caps text-label-caps text-primary font-bold mt-stack-sm" colSpan={7}>
                            Substantive Hearings (Low Risk)
                          </td>
                        </tr>
                        {filteredSubstantive.map((caseItem) => {
                          const hasClash = scheduleData.advocate_clashes.some(c => c.advocate_id === caseItem.advocate_id);
                          return (
                            <tr key={caseItem.cnr} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                              <td className="p-stack-sm font-medium">{caseItem.cnr}</td>
                              <td className="p-stack-sm text-secondary truncate max-w-[120px]" title={caseItem.stage}>{caseItem.stage}</td>
                              <td className="p-stack-sm text-right">{caseItem.estimated_duration_min}</td>
                              <td className="p-stack-sm text-right">{Math.round(caseItem.adjournment_risk * 100)}%</td>
                              <td className="p-stack-sm flex flex-col gap-unit">
                                <div className="flex items-center gap-unit">
                                  {caseItem.advocate_id}
                                  {hasClash && <span className="material-symbols-outlined text-error text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Schedule Clash Detected">warning</span>}
                                </div>
                                {hasClash && <span className="text-[10px] text-error font-medium">Clash detected</span>}
                              </td>
                              <td className="p-stack-sm">
                                <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${caseItem.priority === 'Critical' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                                  {caseItem.priority}
                                </span>
                              </td>
                              <td className="p-stack-sm text-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked={false} />
                                  <div className="w-7 h-4 bg-surface-variant peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-primary rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-none after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-stack-sm flex justify-between items-center border-t border-outline-variant pt-stack-sm font-data-tabular text-data-tabular text-secondary">
                <span>Showing {filteredMorning.length + filteredSubstantive.length} of {scheduleData.total_cases_scheduled} scheduled matters</span>
                <span className="font-medium text-primary">Total Estimated Bench Time: {scheduleData.capacity.scheduled_duration_min} / {scheduleData.capacity.daily_bench_capacity_min} mins</span>
              </div>
            </section>
          </>
        )}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="bg-surface-lowest font-label-caps text-label-caps fixed bottom-0 w-full z-40 border-t border-outline-variant flat no shadows md:hidden">
        <div className="flex justify-around items-center px-margin-mobile py-stack-sm">
          <Link className="flex flex-col items-center justify-center text-primary font-bold active:bg-surface-container scale-95 transition-transform duration-100" href="/">
            <span className="material-symbols-outlined text-[24px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            Home
          </Link>
          <a className="flex flex-col items-center justify-center text-secondary opacity-60 active:bg-surface-container scale-95 transition-transform duration-100" href="#">
            <span className="material-symbols-outlined text-[24px] mb-1" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
            Search
          </a>
        </div>
      </nav>

      {/* Urgent Mention Modal */}
      {urgentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-lowest max-w-md w-full border border-outline-variant shadow-xl">
            <div className="bg-primary text-on-primary px-stack-md py-stack-sm flex justify-between items-center border-b border-primary">
              <h3 className="font-headline-md text-headline-md">Inject Urgent Mention</h3>
              <button onClick={() => setUrgentModalOpen(false)} className="hover:text-outline-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleInjectUrgent} className="p-stack-md flex flex-col gap-stack-sm">
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Case CNR</label>
                <input 
                  type="text" required 
                  className="w-full border border-outline-variant p-2 bg-surface-bright focus:border-primary outline-none text-body-md"
                  value={urgentForm.cnr} onChange={e => setUrgentForm({...urgentForm, cnr: e.target.value})} 
                  placeholder="e.g. URGENT20261111"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Case Title</label>
                <input 
                  type="text" required 
                  className="w-full border border-outline-variant p-2 bg-surface-bright focus:border-primary outline-none text-body-md"
                  value={urgentForm.case_title} onChange={e => setUrgentForm({...urgentForm, case_title: e.target.value})}
                  placeholder="State vs XYZ" 
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Advocate ID</label>
                <input 
                  type="text" required 
                  className="w-full border border-outline-variant p-2 bg-surface-bright focus:border-primary outline-none text-body-md"
                  value={urgentForm.advocate_id} onChange={e => setUrgentForm({...urgentForm, advocate_id: e.target.value})} 
                  placeholder="e.g. ADV-045"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1">Est. Duration (mins)</label>
                <input 
                  type="number" required min="5" max="120"
                  className="w-full border border-outline-variant p-2 bg-surface-bright focus:border-primary outline-none text-body-md"
                  value={urgentForm.estimated_duration_min} onChange={e => setUrgentForm({...urgentForm, estimated_duration_min: parseInt(e.target.value)})} 
                />
              </div>
              <div className="flex justify-end gap-stack-sm mt-stack-sm">
                <button type="button" onClick={() => setUrgentModalOpen(false)} className="px-4 py-2 border border-outline-variant text-secondary hover:bg-surface-container">Cancel</button>
                <button type="submit" disabled={injecting} className="px-4 py-2 bg-primary text-on-primary hover:bg-tertiary disabled:opacity-50 flex items-center gap-2">
                  {injecting ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
                  Inject & Re-Optimize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NyayaMitra AI FAB */}
      <button 
        id="nyayamitra-fab"
        onClick={toggleChat}
        className={`fixed bottom-20 md:bottom-stack-md right-margin-mobile md:right-margin-desktop z-50 shadow-xl flex items-center gap-unit px-stack-md py-stack-sm font-label-caps text-label-caps bg-primary text-on-primary border border-primary hover:bg-surface-lowest hover:text-primary transition-all duration-300 fab-enter ${chatOpen ? 'fab-hidden' : 'fab-visible'}`}
        style={{ transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <span className="material-symbols-outlined text-[20px]">smart_toy</span>
        Ask NyayaMitra
      </button>

      {/* Scrim Background */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[55]"
          style={{ transition: 'opacity 300ms ease' }}
          onClick={toggleChat}
        />
      )}

      {/* NyayaMitra AI Chat Modal */}
      <div 
        id="nyayamitra-chat-modal"
        className={`fixed bottom-20 md:bottom-stack-md right-margin-mobile md:right-margin-desktop z-[60] w-[350px] h-[500px] max-h-[80vh] bg-surface-lowest border border-outline-variant shadow-xl flex flex-col chat-modal-enter ${chatOpen ? 'chat-modal-open' : 'chat-modal-closed'}`}
        style={{ transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Header */}
        <div className="bg-primary text-on-primary px-stack-md py-stack-sm flex justify-between items-center border-b border-primary">
          <div className="flex items-center gap-unit font-headline-md text-headline-md">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            NyayaMitra AI
          </div>
          <button onClick={toggleChat} className="text-on-primary hover:text-outline-variant transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Body (Chat Area) */}
        <div className="flex-1 overflow-y-auto p-stack-md bg-surface flex flex-col gap-stack-sm text-body-md" ref={chatScrollRef}>
          {messages.map((msg, i) => (
             <div key={i} className={`p-stack-sm max-w-[85%] border ${msg.sender === "user" ? "bg-primary text-on-primary self-end" : "bg-surface-container-low border-outline-variant self-start"}`}>
                <p className={`font-data-tabular text-[10px] mb-1 ${msg.sender === "user" ? "text-outline-variant opacity-70" : "text-secondary"}`}>
                  {msg.sender === "user" ? "You" : "NyayaMitra AI"}
                </p>
                <p>{msg.text}</p>
             </div>
          ))}
          {chatLoading && (
             <div className="p-stack-sm max-w-[85%] border bg-surface-container-low border-outline-variant self-start flex items-center justify-center">
               <span className="material-symbols-outlined animate-spin text-[20px] text-primary">sync</span>
             </div>
          )}
        </div>
        
        {/* Footer (Input Area) */}
        <div className="p-stack-sm border-t border-outline-variant bg-surface-lowest">
          <form onSubmit={handleSendChat} className="flex items-center border border-outline-variant bg-surface-bright focus-within:border-primary transition-colors">
            <input 
              type="text" 
              className="w-full bg-transparent border-none focus:ring-0 text-body-md font-body-md p-stack-sm text-primary placeholder-secondary outline-none disabled:opacity-50" 
              placeholder="Ask a registrar query..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" disabled={!chatInput.trim() || chatLoading} className="p-stack-sm text-primary hover:text-tertiary transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
