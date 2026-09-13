"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LitigantAnalyticsView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:8000/api/cases?limit=1000");
        const cases = await res.json();
        
        const total = cases.length;
        const pending = cases.filter((c: any) => c.Status === 'Pending').length;
        const closed = cases.filter((c: any) => c.Status === 'Closed').length;
        
        setStats({ total, pending, closed });
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-surface-lowest flex flex-col">
      {/* Header */}
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
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant">
              Dashboard
            </Link>
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant/causelist">
              Cause-list
            </Link>
            <Link className="h-full flex items-center text-primary border-b-2 border-primary pb-1 font-headline-md text-headline-md" href="/litigant/analytics">
              Analytics
            </Link>
          </div>
          {/* Right Actions */}
          <div className="flex items-center gap-stack-md">
            <div className="hidden md:flex items-center border border-outline-variant px-stack-md py-unit bg-surface-bright focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-unit">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 p-0 text-body-md w-48 font-body-md text-on-surface placeholder:text-outline outline-none"
                placeholder="Search cases..."
                type="text"
              />
            </div>
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

      {/* Main Content */}
      <main className="flex-1 max-w-container-max mx-auto w-full px-margin-desktop py-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-md">Public Case Analytics</h1>
        <p className="text-secondary mb-stack-lg">Transparency metrics on current court case clearance rates.</p>

        {loading ? (
          <div className="py-20 text-center text-secondary">Computing metrics...</div>
        ) : stats ? (
          <div className="flex flex-col gap-stack-md max-w-2xl">
            <div className="border border-outline-variant bg-surface-container-lowest p-stack-lg flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-primary">Pending Cases</h3>
                <p className="text-secondary text-sm">Awaiting judgment</p>
              </div>
              <div className="text-5xl font-display-lg text-error font-bold">{stats.pending}</div>
            </div>
            
            <div className="border border-outline-variant bg-surface-container-lowest p-stack-lg flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-primary">Resolved / Closed</h3>
                <p className="text-secondary text-sm">Successfully completed</p>
              </div>
              <div className="text-5xl font-display-lg text-tertiary font-bold">{stats.closed}</div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

