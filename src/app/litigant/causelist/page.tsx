"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Case {
  CNR: string;
  Case_Type: string;
  Status: string;
  Filing_Date: string;
  Court: string;
}

export default function LitigantCauseListView() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");

  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const url = selectedState === "ALL" 
            ? "http://localhost:8000/api/cases?limit=500" 
            : `http://localhost:8000/api/cases?limit=500&state_code=${selectedState}`;
        const res = await fetch(url);
        const data = await res.json();
        setCases(data);
      } catch (err) {
        console.error("Failed to fetch cases", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [selectedState]);

  const filteredCases = cases.filter(c => 
     c.CNR.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.Case_Type.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.Court.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-lowest flex flex-col">
      {/* Header */}
      <nav className="bg-surface-container-lowest border-b border-outline-variant docked full-width top-0 z-40 relative">
        <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-container-max mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-stack-md">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"><img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-sm mix-blend-multiply" /><span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span></div>
            </Link>
          </div>
          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-stack-lg h-full">
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant">
              Dashboard
            </Link>
            <Link className="h-full flex items-center text-primary border-b-2 border-primary pb-1 font-headline-md text-headline-md" href="/litigant/causelist">
              Cause-list
            </Link>
            <Link className="h-full flex items-center text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 font-headline-md text-headline-md" href="/litigant/analytics">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-stack-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">Public Case Explorer</h1>
            <p className="text-secondary">Search and browse recent cases filed across all jurisdictions.</p>
          </div>
          <div className="flex items-center gap-unit">
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

        {loading ? (
          <div className="py-20 text-center text-secondary">Loading public cases...</div>
        ) : (
          <div className="grid gap-stack-md grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((c, i) => (
              <Link href={`/litigant?cnr=${c.CNR}`} key={i}>
                <div className="border border-outline-variant p-stack-md bg-surface-container-lowest hover:border-primary transition-colors group cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-label-caps text-secondary">{c.Case_Type}</span>
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${c.Status === 'Pending' ? 'bg-error text-on-error' : 'bg-surface-container-high text-on-surface'}`}>{c.Status}</span>
                  </div>
                  <h3 className="font-headline-sm text-primary group-hover:underline mb-1">{c.CNR}</h3>
                  <p className="text-sm text-secondary line-clamp-1">{c.Court}</p>
                  <div className="mt-4 pt-2 border-t border-outline-variant text-xs text-on-surface-variant flex justify-between">
                    <span>Filed: {c.Filing_Date}</span>
                  </div>
                </div>
              </Link>
            ))}
            {filteredCases.length === 0 && (
               <div className="col-span-full py-10 text-center text-secondary">No cases match your search.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

