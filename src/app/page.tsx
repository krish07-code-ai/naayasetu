"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-margin-desktop bg-surface-lowest text-on-background overflow-hidden">
      
      {/* Background Decor - Blueprint Dots & Legal Typography */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Section 138 Text Watermark */}
        <div className="absolute inset-0 opacity-40 select-none overflow-hidden flex flex-wrap content-start text-[10px] font-mono text-gray-200 leading-tight break-all">
          {"WHERE ANY CHEQUE DRAWN BY A PERSON ON AN ACCOUNT MAINTAINED BY HIM WITH A BANKER FOR PAYMENT OF ANY AMOUNT OF MONEY TO ANOTHER PERSON FROM OUT OF THAT ACCOUNT FOR THE DISCHARGE, IN WHOLE OR IN PART, OF ANY DEBT OR OTHER LIABILITY, IS RETURNED BY THE BANK UNPAID... ".repeat(150)}
        </div>
        {/* Radial Gradient Overlay to fade text near the center logo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_15%,rgba(255,255,255,0.7)_40%,rgba(255,255,255,0)_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl w-full flex flex-col items-center justify-center"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center justify-center z-10 relative"
        >
          <div className="relative flex items-center justify-center pb-4 md:pb-6">
            {/* Neural Pulse Glow */}
            <div className="absolute inset-0 animate-pulse blur-3xl bg-primary/10 rounded-full z-0 scale-[1.5]" />
            
            <div className="relative flex items-center justify-center w-56 h-56 md:w-72 md:h-72 z-10">
              <img src="/logo.png" alt="NyayaSetu Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
          </div>
        </motion.div>
        
        <div className="relative z-20 -mt-8 md:-mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full mx-auto px-4 max-w-3xl">
          {/* Litigant Portal Route */}
          <Link href="/litigant" className="group relative bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 hover:border-primary transition-all duration-300 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-surface-container/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative bg-primary text-on-primary w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md">
              <span className="material-symbols-outlined text-[32px] md:text-[40px]">person_search</span>
            </div>
            <h2 className="relative font-headline-lg text-xl md:text-2xl font-semibold mb-2 text-on-surface group-hover:text-primary transition-colors">Litigant Portal</h2>
            <p className="relative font-body-md text-sm md:text-base text-secondary leading-relaxed">
              Track your case status, view hearing history, and consult NyayaMitra AI for legal guidance.
            </p>
          </Link>

          {/* Registrar Dashboard Route */}
          <Link href="/registrar" className="group relative bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 hover:border-primary transition-all duration-300 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative bg-primary text-on-primary w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-md">
              <span className="material-symbols-outlined text-[32px] md:text-[40px]">gavel</span>
            </div>
            <h2 className="relative font-headline-lg text-xl md:text-2xl font-semibold mb-2 text-on-surface group-hover:text-primary transition-colors">Registrar Dashboard</h2>
            <p className="relative font-body-md text-sm md:text-base text-secondary leading-relaxed">
              Review AI-optimized daily cause-lists, manage court scheduling, and inject urgent mentions.
            </p>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
