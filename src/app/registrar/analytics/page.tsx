"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AnalyticsView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:8000/api/cases?limit=1000");
        const cases = await res.json();
        
        // Compute basic metrics dynamically based on the actual DB data
        const total = cases.length;
        const highPriority = cases.filter((c: any) => c.Priority === 'High' || c.Priority === 'Critical').length;
        const s138Cases = cases.filter((c: any) => c.Case_Type === 'Section 138 NI Act').length;
        
        const typeDistribution = cases.reduce((acc: any, c: any) => {
           acc[c.Case_Type] = (acc[c.Case_Type] || 0) + 1;
           return acc;
        }, {});

        setStats({ total, highPriority, s138Cases, typeDistribution });
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
      <header className="bg-surface-lowest sticky top-0 border-b border-outline-variant z-40">
        <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-gutter">
            <Link href="/"><div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"><img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-sm mix-blend-multiply" /><span className="font-display-lg text-display-lg font-bold text-primary">NyayaSetu</span></div></Link>
            <nav className="ml-stack-lg flex gap-stack-md">
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar">Dashboard</Link>
              <Link className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80" href="/registrar/causelist">Cause-list</Link>
              <Link className="text-primary border-b-2 border-primary pb-1 cursor-pointer active:opacity-80" href="/registrar/analytics">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-container-max mx-auto w-full px-margin-desktop py-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">Live Analytics Engine</h1>

        {loading ? (
          <div className="py-20 text-center text-secondary">Computing analytics...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md mb-stack-lg">
            
            {/* KPI 1 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-stack-md border-t-4 border-t-primary">
               <h3 className="text-secondary font-label-caps text-label-caps mb-2">Total Monitored Cases</h3>
               <div className="text-5xl font-display-lg text-primary font-bold">{stats.total}+</div>
               <p className="text-xs text-secondary mt-2">Active in registry</p>
            </div>

            {/* KPI 2 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-stack-md border-t-4 border-t-error">
               <h3 className="text-secondary font-label-caps text-label-caps mb-2">High Priority Backlog</h3>
               <div className="text-5xl font-display-lg text-error font-bold">{stats.highPriority}</div>
               <p className="text-xs text-secondary mt-2">Require urgent scheduling</p>
            </div>

            {/* KPI 3 */}
            <div className="border border-outline-variant bg-surface-container-lowest p-stack-md border-t-4 border-t-tertiary">
               <h3 className="text-secondary font-label-caps text-label-caps mb-2">Section 138 (Cheque Bounce)</h3>
               <div className="text-5xl font-display-lg text-tertiary font-bold">{stats.s138Cases}</div>
               <p className="text-xs text-secondary mt-2">Primary tracked category</p>
            </div>

            {/* Chart Simulation */}
            <div className="md:col-span-3 border border-outline-variant bg-surface-container-lowest p-stack-md mt-stack-md">
               <h3 className="text-primary font-headline-sm mb-stack-md">Case Distribution by Category</h3>
               <div className="space-y-4">
                  {Object.entries(stats.typeDistribution).map(([type, count]: any, idx) => {
                     const percentage = Math.round((count / stats.total) * 100);
                     return (
                        <div key={idx}>
                           <div className="flex justify-between text-sm mb-1">
                              <span className="text-on-surface">{type}</span>
                              <span className="font-data-tabular">{count} cases ({percentage}%)</span>
                           </div>
                           <div className="w-full bg-surface-variant h-4">
                              <div className="bg-primary h-4 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}

