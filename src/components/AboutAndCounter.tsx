/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Coffee, Award, Smile, CheckCircle, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export const AboutAndCounter: React.FC = () => {
  const { theme, language, t } = useApp();
  const [projets, setProjets] = useState(0);
  const [clients, setClients] = useState(0);
  const [domaines, setDomaines] = useState(0);

  useEffect(() => {
    // Dynamic progressive animation on load
    const countTo = (target: number, setter: React.Dispatch<React.SetStateAction<number>>, duration: number) => {
      let cur = 0;
      const step = Math.ceil(target / (duration / 16));
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(cur);
        }
      }, 16);
    };

    countTo(50, setProjets, 1500);
    countTo(30, setClients, 1500);
    countTo(8, setDomaines, 1500);
  }, []);

  return (
    <section id="apropos" className={`py-24 transition-colors duration-300 relative overflow-hidden ${
      theme === "light" ? "bg-slate-100 text-slate-800" : "bg-transparent text-slate-100"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left panel company descriptions */}
          <div className="lg:col-span-12 xl:col-span-7">
            <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
              {t("about.badge")}
            </span>
            <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-6 ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              {t("about.title")}
            </h2>

            <p className={`text-base leading-relaxed mb-4 ${
              theme === "light" ? "text-slate-600" : "text-slate-400"
            }`}>
              {language === "fr" ? (
                <>Basée à Douala, Cameroun, <strong>Luciole Services</strong> réunit des développeurs passionnés, des ingénieurs réseau, et des spécialistes de la voix pour offrir une transition digitale clé en main aux PME et de grands partenaires du continent d'Afrique de l'Ouest et Centrale.</>
              ) : (
                <>Headquartered in Douala, Cameroon, <strong>Luciole Services</strong> unites dedicated software coders, database experts, and voiceover talents to supply top-tier digital transformation paths for modern agencies.</>
              )}
            </p>
            <p className={`text-base leading-relaxed mb-6 ${
              theme === "light" ? "text-slate-500" : "text-slate-400"
            }`}>
              {language === "fr" ? (
                <>Pas de réunions d'agence lentes ou de tarifs exorbitants. Nous mettons directement notre savoir-faire au service de votre croissance, avec des cycles de livraison agiles et efficaces.</>
              ) : (
                <>No complex marketing talk or opaque bills. We put our production experience to work for you directly, with short iterative milestones and complete transparency.</>
              )}
            </p>

            {/* Structured workflow list items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                language === "fr" ? "Échanges directs pas WhatsApp" : "Direct Friendly WhatsApp communication",
                language === "fr" ? "Prototypes Figma avant codage" : "Figma interactive design first",
                language === "fr" ? "Rapports de performance Google" : "High Google Lighthouse efficiency reports",
                language === "fr" ? "Livraison sous 7 à 15 jours" : "Fast turnaround (7 to 15 business days)",
              ].map((value, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-gold/15 text-gold shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span className={`text-sm font-semibold leading-none ${
                    theme === "light" ? "text-slate-800" : "text-white/90"
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 font-bold text-sm text-gold hover:text-gold-light group transition duration-200 cursor-pointer"
            >
              {language === "fr" ? "Envoyer une demande de projet" : "Send us a recruitment ticket"}
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition" />
            </a>
          </div>

          {/* Right panel graphic metric cards */}
          <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`backdrop-blur-md rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between aspect-square hover:border-gold/30 hover:shadow-xl transition duration-300 ${
              theme === "light"
                ? "bg-white border-slate-200 hover:border-gold shadow-md"
                : "bg-[#1e293b]/30 border-white/5 shadow-xl text-white"
            }`}>
              <Award className="text-gold mb-4 animate-pulse" size={28} />
              <div>
                <span className="font-display font-black text-5xl text-gold-light tracking-tight leading-none block">
                  {projets}+
                </span>
                <span className="text-xs font-semibold text-slate-400 block mt-2">
                  {t("about.stat1")}
                </span>
              </div>
            </div>

            <div className={`backdrop-blur-md rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between aspect-square hover:border-gold/30 hover:shadow-xl transition duration-300 ${
              theme === "light"
                ? "bg-white border-slate-200 hover:border-gold shadow-md"
                : "bg-[#1e293b]/30 border-white/5 shadow-xl text-white"
            }`}>
              <Smile className="text-gold mb-4" size={28} />
              <div>
                <span className={`font-display font-black text-5xl tracking-tight leading-none block ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>
                  {clients}+
                </span>
                <span className="text-xs font-semibold text-slate-400 block mt-2">
                  {language === "fr" ? "Partenaires de marque" : "Collaborative brands"}
                </span>
              </div>
            </div>

            <div className={`backdrop-blur-md rounded-2xl p-6 border col-span-1 sm:col-span-2 relative overflow-hidden flex items-center justify-between gap-6 hover:border-gold/30 hover:shadow-xl transition duration-300 ${
              theme === "light"
                ? "bg-white border-slate-200 hover:border-gold shadow-md"
                : "bg-[#1e293b]/30 border-white/5 shadow-xl"
            }`}>
              <div className="flex items-center gap-4">
                <Coffee className="text-gold" size={28} />
                <div>
                  <span className={`font-display font-black text-3xl leading-none block ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    {domaines}+
                  </span>
                  <span className="text-xs font-semibold text-slate-400 block mt-1">
                    {language === "fr" ? "Spécialités de services robustes" : "Technical service integrations"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
