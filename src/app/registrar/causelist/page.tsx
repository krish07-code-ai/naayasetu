"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Case {
  CNR: string;
  Case_Type: string;
  Status: string;
  Priority: string;
  Filing_Date: string;
  Court: string;
}

export default function CauseListView() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const filtered = cases.filter(c => 
    c.CNR.toLowerCase().includes(search.toLowerCase()) || 
    c.Case_Type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-lowest flex flex-col">
      {/* Header */}
      <header className="bg-surface-lowest sticky top-0 border-b border-outline-variant z-40">
        <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-gutter">
            <Link href="/"><div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"><img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-sm mix-blend-multiply" /><span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span></div></Link>
            <nav className="ml-stack-lg flex gap-stack-md">
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar">Dashboard</Link>
              <Link className="text-primary border-b-2 border-primary pb-1 cursor-pointer active:opacity-80" href="/registrar/causelist">Cause-list</Link>
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar/analytics">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-container-max mx-auto w-full px-margin-desktop py-stack-lg">
        <div className="flex justify-between items-end mb-stack-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Master Case Registry</h1>
            <p className="text-secondary mt-1">Viewing all active cases in the database</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-stack-sm">
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
            
            <div className="flex items-center border border-outline-variant px-stack-md py-unit bg-surface-bright">
              <span className="material-symbols-outlined text-secondary mr-2">search</span>
              <input
                type="text"
                placeholder="Search CNR or Type..."
                className="bg-transparent border-none focus:ring-0 outline-none w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-secondary">Loading registry data...</div>
        ) : (
          <div className="border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-secondary font-label-caps text-label-caps">
                  <th className="p-stack-sm font-semibold">CNR Number</th>
                  <th className="p-stack-sm font-semibold">Case Type</th>
                  <th className="p-stack-sm font-semibold">Court</th>
                  <th className="p-stack-sm font-semibold">Filing Date</th>
                  <th className="p-stack-sm font-semibold">Priority</th>
                  <th className="p-stack-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-b border-outline-variant hover:bg-surface-bright transition-colors text-on-surface text-body-md">
                    <td className="p-stack-sm font-data-tabular text-primary font-medium">{c.CNR}</td>
                    <td className="p-stack-sm">{c.Case_Type}</td>
                    <td className="p-stack-sm text-secondary text-sm">{c.Court}</td>
                    <td className="p-stack-sm font-data-tabular">{c.Filing_Date}</td>
                    <td className="p-stack-sm">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${
                        c.Priority === 'High' || c.Priority === 'Critical' ? 'bg-error text-on-error' : 
                        c.Priority === 'Medium' ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {c.Priority || "Normal"}
                      </span>
                    </td>
                    <td className="p-stack-sm">{c.Status}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-stack-lg text-center text-secondary">No cases found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

