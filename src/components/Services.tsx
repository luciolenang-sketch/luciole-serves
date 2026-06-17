/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SERVICES } from "../data";
import { Service } from "../types";
import { Check, Info, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";

// Dynamic English-French dictionary mapper specifically for services data cards
const SERVICES_TRANSLATIONS: Record<string, {
  title: Record<string, string>;
  description: Record<string, string>;
  features: Record<string, string[]>;
}> = {
  "create-web": {
    title: { fr: "Création de sites web", en: "Web Design & Development" },
    description: { 
      fr: "Sites vitrines modernes, boutiques e-commerce performantes, blogs et portfolios optimisés SEO, fluides et parfaitement sécurisés.",
      en: "Modern landing pages, high-performing e-commerce storefronts, and SEO-optimized web systems built with pristine security."
    },
    features: {
      fr: ["Responsive Design", "Optimisé SEO", "Panier e-commerce sécurisé", "Performance de pointe"],
      en: ["Responsive Design", "SEO Optimized", "Secure E-cart Systems", "Cutting-edge Speed"]
    }
  },
  "apps-mobiles": {
    title: { fr: "Applications mobiles iOS & Android", en: "iOS & Android Applications" },
    description: {
      fr: "Développement d'applications mobiles natives et hybrides intuitives pour connecter vos clients directement sur leurs smartphones.",
      en: "Development of intuitive native or hybrid app interfaces to engage and interact with your users directly on smartphones."
    },
    features: {
      fr: ["Interface élégante", "Notifications Push", "Fonctionnement hors-ligne", "Publication Stores"],
      en: ["Elegant UI Interfaces", "Push Alerts", "Offline-first capability", "App Store deployment"]
    }
  },
  "bdd": {
    title: { fr: "Gestion de bases de données", en: "Database Management & APIs" },
    description: {
      fr: "Conception de modèles relationnels (SQL) et NoSQL robustes, développement d'APIs, migration et optimisation de performances.",
      en: "Design of highly robust relational (SQL) models, NoSQL records, rest APIs, data migrations, and schema optimizations."
    },
    features: {
      fr: ["Architecture robuste", "APIs sécurisées", "Sauvegardes automatiques", "Indexation optimisée"],
      en: ["Robust Architectures", "Secure REST APIs", "Automatic Cloud Backup", "Optimized Query Indexes"]
    }
  },
  "design-graphique": {
    title: { fr: "Design graphique & Identité", en: "Graphic Design & Branding" },
    description: {
      fr: "Création de logos originaux, chartes graphiques complètes, flyers et supports digitaux pour affirmer la personnalité de votre marque.",
      en: "Custom conceptual logo prints, visual identity systems, flyers, and templates to firmly pitch your corporate messaging."
    },
    features: {
      fr: ["Créations originales", "Haute définition", "Format vectoriel", "Palette de couleurs unique"],
      en: ["Original Vector Art", "High-Definition Prints", "Pruned Source Files", "Distinctive Palettes"]
    }
  },
  "spots-pubs": {
    title: { fr: "Spots publicitaires", en: "Commercial Ad Videos" },
    description: {
      fr: "Écriture, tournage, montage et réalisation complète de spots audiovisuels captivants pour dynamiser votre communication d'entreprise.",
      en: "Scriptwriting, editing, and professional post-production of highly engaging video ads to capture new audiences."
    },
    features: {
      fr: ["Scénarios impactants", "Montage dynamique", "Mixage de qualité", "Optimisé réseaux sociaux"],
      en: ["Impactful Storyboarding", "Active Video Edits", "Pristine Stereo Mixing", "Social Feed Ready"]
    }
  },
  "voix-off": {
    title: { fr: "Voix off professionnelle", en: "Professional Voiceovers" },
    description: {
      fr: "Enregistrement en cabine de voix off chaleureuses, dynamiques ou narratives pour vos vidéos promotionnelles, d'e-learning ou de formation.",
      en: "Acoustic recording of warm, highly informative, narrative voices for promotional clips, course outlines, or interactive ads."
    },
    features: {
      fr: ["Qualité studio", "Tons personnalisables", "Français, Anglais & Langues locales", "Nettoyage audio pro"],
      en: ["Premium Studio Booths", "Custom Sound Pitch", "Local French & English", "Pro Noise Reduction"]
    }
  },
  "jingles": {
    title: { fr: "Jingles & Signatures sonores", en: "Jingles & Brand Audio" },
    description: {
      fr: "Création de l'empreinte sonore de votre entreprise : jingles radiophoniques, intros de vidéos, signatures de marque et bruitages.",
      en: "Sculpting your corporate sonic signature: radio station intros, commercial jingles, pod sound boards, and foley effects."
    },
    features: {
      fr: ["Composition sur-mesure", "Identité mémorable", "Mixage stéréo pro", "Fichiers masterisés"],
      en: ["Tailored Soundscape", "Highly Sticky Identity", "Surgically Stereo Mix", "Mastered Delivery Files"]
    }
  },
  "support": {
    title: { fr: "Maintenance & Support 24/7", en: "Maintenance & 24/7 Support" },
    description: {
      fr: "Accompagnement après-vente, résolution de bugs, mises à jour régulières, sauvegardes quotidiennes et hébergement haute fiabilité.",
      en: "Continuous after-sales support, hot patching, schema upgrades, secure daily snapshots, and high-uptime cloud hosting."
    },
    features: {
      fr: ["Suivi technique pro", "Sécurité renforcée", "Intervention express", "Hébergement Cloud"],
      en: ["Active Tech Monitoring", "Strengthened Security", "Express Recovery SLA", "Cloud-backed Hosting"]
    }
  }
};

export const Services: React.FC = () => {
  const { language, theme, t } = useApp();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Return localized text strings dynamically
  const getLocalizedData = (service: Service) => {
    const backup = {
      title: service.title,
      description: service.description,
      features: service.features
    };
    const trans = SERVICES_TRANSLATIONS[service.id];
    if (!trans) return backup;
    return {
      title: trans.title[language] || backup.title,
      description: trans.description[language] || backup.description,
      features: trans.features[language] || backup.features
    };
  };

  return (
    <section id="services" className={`py-24 transition-colors duration-300 ${
      theme === "light" ? "bg-slate-100 text-slate-800" : "bg-transparent text-slate-100"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {t("services.badge")}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {t("services.title")}
          </h2>
          <p className={`text-lg leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {t("services.desc")}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => {
            const localData = getLocalizedData(service);
            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`group relative backdrop-blur-md rounded-3xl p-8 border hover:shadow-2xl hover:shadow-gold/5 transform hover:-translate-y-2 hover:scale-[1.01] transition-all duration-500 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  theme === "light"
                    ? "bg-white border-slate-200/80 hover:border-gold/30"
                    : "bg-[#1e293b]/35 border-white/5 hover:border-gold/35"
                }`}
              >
                {/* 3D dynamic lighting glow background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative z-10">
                  {/* Header card icon state */}
                  <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center text-3xl border bg-gold/10 text-gold group-hover:scale-110 group-hover:-rotate-3 transition duration-300 ${
                    theme === "light" ? "border-gold/10" : "border-gold/20"
                  }`}>
                    {service.icon}
                  </div>

                  <h3 className={`font-display font-black text-xl mb-3 group-hover:text-gold transition duration-200 ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    {localData.title}
                  </h3>
                  <p className={`text-sm leading-relaxed mb-6 ${
                    theme === "light" ? "text-slate-500" : "text-slate-400"
                  }`}>
                    {localData.description}
                  </p>
                </div>

                {/* Expand details info */}
                <div className="border-t border-white/5 pt-4 flex items-center justify-between relative z-10">
                  <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase group-hover:text-gold transition">
                    {t("services.more")}
                  </span>
                  <Info size={16} className="text-slate-400 group-hover:text-gold transition" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive service details modal */}
        {selectedService && (() => {
          const localData = getLocalizedData(selectedService);
          return (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeUp">
              <div className={`rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border ${
                theme === "light" 
                  ? "bg-white border-slate-200 text-slate-800" 
                  : "bg-[#0f172a] border-white/10 text-white"
              }`}>
                {/* Modal header banner */}
                <div className={`p-6 relative border-b ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-100"
                    : "bg-gradient-to-tr from-[#1e293b] to-[#0f172a] border-white/5"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{selectedService.icon}</div>
                    <div>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest block">
                        Fiche technique service
                      </span>
                      <h3 className={`font-display font-black text-xl ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        {localData.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedService(null)}
                    className={`absolute top-4 right-4 p-1.5 rounded-full transition ${
                      theme === "light" 
                        ? "text-slate-400 hover:text-slate-800 hover:bg-slate-200" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>

                {/* Inside detailed bulletin */}
                <div className="p-8">
                  <h4 className={`font-semibold text-sm mb-4 ${
                    theme === "light" ? "text-slate-850" : "text-slate-200"
                  }`}>
                    {t("services.features")}
                  </h4>
                  <ul className="space-y-3 list-none m-0 p-0 mb-6">
                    {localData.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="p-0.5 rounded-full bg-gold/15 text-gold shrink-0 mt-0.5">
                          <Check size={14} />
                        </div>
                        <span className={`text-sm leading-relaxed ${
                          theme === "light" ? "text-slate-650" : "text-slate-300"
                        }`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-slate-500 italic mb-6 leading-relaxed">
                    * Toutes nos offres s'adaptent selon votre secteur. Vous obtiendrez des rapports de performance après déploiement.
                  </p>

                  <div className="flex gap-4">
                    <a
                      href="#estimator"
                      onClick={() => setSelectedService(null)}
                      className="flex-1 py-3 text-center rounded-xl font-bold bg-gold hover:bg-gold-light text-white transition text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      {language === "fr" ? "Estimer le coût" : "Estimate budget"}
                    </a>
                    <button
                      onClick={() => setSelectedService(null)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer border ${
                        theme === "light"
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                          : "border-white/10 hover:bg-white/5 text-slate-300"
                      }`}
                    >
                      {t("services.close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};
