/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowUp, Facebook, Instagram } from "lucide-react";
import { useApp } from "../context/AppContext";

export const Footer: React.FC = () => {
  const { theme, language } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className={`transition-colors duration-300 py-16 border-t relative z-30 ${
      theme === "light" 
        ? "bg-slate-100/80 text-slate-500 border-slate-200" 
        : "bg-transparent text-slate-400 border-white/5"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1 Logo details */}
          <div className="flex flex-col items-start">
            <div className={`flex items-center gap-2 mb-4 px-3 py-1.5 rounded-2xl border transition-all duration-300 ${
              theme === "light"
                ? "bg-white border-slate-200"
                : "bg-white/5 border-white/5 backdrop-blur-md"
            }`}>
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-[#3b82f6] shadow-[0_0_12px_rgba(251,191,36,0.25)] shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-slate-950 animate-pulse" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="15" r="2.5" fill="#fbbf24" stroke="#fbbf24" />
                  <path d="M10 4c0 .4-.4.8-.8.8s-.8-.4-.8-.8" stroke="#fbbf24" />
                  <path d="M14 4c0 .4.4.8.8.8s.8-.4.8-.8" stroke="#fbbf24" />
                  <circle cx="12" cy="7.5" r="1.2" fill="#f8fafc" />
                  <path d="M12 9v2.5" stroke="#f8fafc" strokeWidth="2" />
                  <path d="M11 10 Q 6 7.5, 7 11.5 Q 11 10.5, 12 10.5" fill="rgba(255,255,255,0.15)" stroke="#60a5fa" strokeWidth="0.8" />
                  <path d="M13 10 Q 18 7.5, 17 11.5 Q 13 10.5, 12 10.5" fill="rgba(255,255,255,0.15)" stroke="#60a5fa" strokeWidth="0.8" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className={`font-display font-black text-base leading-none tracking-tight ${
                  theme === "light" ? "text-slate-950" : "text-white"
                }`}>Luciole</span>
                <span className="font-display font-bold text-[8px] tracking-[0.25em] text-amber-500 uppercase leading-normal mt-0.5">SERVICES</span>
              </div>
            </div>
            <p className={`text-sm mb-6 leading-relaxed max-w-xs ${
              theme === "light" ? "text-slate-600" : "text-slate-400"
            }`}>
              {language === "fr" 
                ? "Votre agence freelance premium pour la création de sites internet, d'applications mobiles, bases de données, et l'enregistrement de voix off professionnelles à Douala."
                : "Your professional agency for bespoke websites development, mobile applications, robust databases schemas, and premium voice-over records in Douala."
              }
            </p>
            <div className="flex flex-col gap-4 mt-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/5 border border-gold/10 rounded">
                  Douala, Cameroun
                </span>
              </div>
              <div className="mt-1">
                <p className={`text-xs font-semibold mb-2.5 ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}>
                  {language === "fr" 
                    ? "Vous pouvez aussi nous suivre sur nos plateformes :" 
                    : "You can also follow us on our platforms:"
                  }
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/share/1AWzpnveXJ/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer bg-[#1877F2]/10 dark:bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:shadow-[0_0_14px_rgba(24,119,242,0.25)]"
                    aria-label="Facebook"
                    id="footer-facebook-btn"
                  >
                    <Facebook size={18} className="fill-current" />
                  </a>
                  <a
                    href="https://www.instagram.com/lucioleservices?igsh=dzZwdGM4MmJwZHE4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer bg-[#E1306C]/10 dark:bg-[#E1306C]/15 text-[#E1306C] border-[#E1306C]/30 hover:bg-[#E1306C]/20 hover:border-[#E1306C]/50 hover:shadow-[0_0_14px_rgba(225,48,108,0.25)]"
                    aria-label="Instagram"
                    id="footer-instagram-btn"
                  >
                    <Instagram size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 Services */}
          <div>
            <h4 className={`font-display font-bold text-sm uppercase tracking-wider mb-6 ${
              theme === "light" ? "text-slate-800" : "text-white"
            }`}>
              {language === "fr" ? "Nos Services" : "Our Expertises"}
            </h4>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              <li>
                <a href="#services" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Création de sites web" : "Web Development"}
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Applications mobiles" : "Mobile Applications"}
                </a>
              </li>
              <li>
                <a href="#services" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Bases de données SQL" : "Database architectures"}
                </a>
              </li>
              <li>
                <a href="#vocal-studio" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Studio Voix off & Jingles" : "Voice Over Studio"}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 Links */}
          <div>
            <h4 className={`font-display font-bold text-sm uppercase tracking-wider mb-6 ${
              theme === "light" ? "text-slate-800" : "text-white"
            }`}>
              {language === "fr" ? "Plan du site" : "App Sitemap"}
            </h4>
            <ul className="flex flex-col gap-3 list-none m-0 p-0 font-medium">
              <li>
                <a href="#accueil" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Page d'accueil" : "Home page"}
                </a>
              </li>
              <li>
                <a href="#realisations" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Réalisations & Portfolio" : "Showcase & Portfolio"}
                </a>
              </li>
              <li>
                <a href="#estimator" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Calculateur de budget" : "Budget Simulator"}
                </a>
              </li>
              <li>
                <a href="#nouveau-projet" className="text-sm hover:text-gold transition">
                  {language === "fr" ? "Nous Contacter" : "Contact channel"}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 Contact fields */}
          <div>
            <h4 className={`font-display font-bold text-sm uppercase tracking-wider mb-6 ${
              theme === "light" ? "text-slate-800" : "text-white"
            }`}>
              {language === "fr" ? "Coordonnées" : "Reach Us"}
            </h4>
            <ul className="flex flex-col gap-3.5 list-none m-0 p-0 text-sm leading-relaxed text-slate-500">
              <li className={theme === "light" ? "text-slate-700" : "text-slate-300"}>Douala, Cameroun</li>
              <li>
                <a href="https://wa.me/237699958089" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition font-bold">
                  +237 699 95 80 89 (WhatsApp)
                </a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {language === "fr" ? "Projets & Devis :" : "Projects / Estimate :"}
                </span>
                <a href="mailto:devis@luciole-serves.com" className={`hover:text-gold transition font-medium ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>devis@luciole-serves.com</a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {language === "fr" ? "Support Technique :" : "Technical Support :"}
                </span>
                <a href="mailto:support@luciole-serves.com" className={`hover:text-gold transition font-medium ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>support@luciole-serves.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className={`border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          theme === "light" ? "border-slate-200" : "border-white/5"
        }`}>
          <p className="text-xs text-slate-400 text-center sm:text-left leading-normal">
            © 2026 Luciole Services. {language === "fr" ? "Tous droits réservés." : "All rights reserved."}
          </p>

          <button
            onClick={scrollToTop}
            className={`p-3 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center border ${
              theme === "light"
                ? "bg-white hover:bg-gold hover:text-white border-slate-200 text-slate-700"
                : "bg-navy hover:bg-gold text-gold hover:text-navy-dark border-white/5 hover:border-gold"
            }`}
            aria-label="Back to top"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};
