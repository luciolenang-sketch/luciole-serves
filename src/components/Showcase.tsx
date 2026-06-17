/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SHOWCASE_ITEMS } from "../data";
import { ShowcaseItem } from "../types";
import { ShowcaseIllustration } from "./Illustrations";
import { ExternalLink, Calendar, User, LayoutGrid } from "lucide-react";
import { useApp } from "../context/AppContext";

// Category translations
const PROJECTS_TRANSLATIONS: Record<string, {
  title: Record<string, string>;
  subtitle: Record<string, string>;
  badge: Record<string, string>;
  description: Record<string, string>;
}> = {
  "real-1": {
    title: { fr: "E-Boutique Glamour", en: "Glamour E-Shop" },
    subtitle: { fr: "Magasin de cosmétiques premium en ligne", en: "Premium cosmetic web commerce app" },
    badge: { fr: "E-Commerce", en: "E-Commerce" },
    description: {
      fr: "Un site de vente en ligne épuré avec gestion des stocks, passerelles de paiement sécurisées et espace utilisateur optimisé.",
      en: "A refined online storefront with real-time inventory hooks, secure local gateway layers, and streamlined user profiles."
    }
  },
  "real-2": {
    title: { fr: "Plateforme Africa-Consult", en: "Africa-Consult Platform" },
    subtitle: { fr: "Site vitrine de cabinet d'audit", en: "Corporate consulting gateway site" },
    badge: { fr: "Vitrine Pro", en: "Professional Corporate" },
    description: {
      fr: "Portail institutionnel haut de gamme avec prise de rendez-vous en ligne, intégration de blog et système d'adhésion.",
      en: "High-end institutional hub featuring live consultant scheduling, deep blog layouts, and client memberships."
    }
  },
  "real-3": {
    title: { fr: "Dashboard Giga-Data", en: "Giga-Data Dashboard" },
    subtitle: { fr: "Panneau de contrôle logistique", en: "Logistics control board & queries" },
    badge: { fr: "Web App / Base de données", en: "Web App & Database" },
    description: {
      fr: "Application web d'administration de flotte et d'entrepôt, connectée à une base PostgresSQL avec filtres en temps réel.",
      en: "Cargo logistics and warehouse control dashboard wired to Postgres layers with live custom analytics panels."
    }
  },
  "real-4": {
    title: { fr: "App Mobile 'Yéma Deliveries'", en: "'Yéma Deliveries' Mobile App" },
    subtitle: { fr: "Application de livraison de repas", en: "On-demand food courier application" },
    badge: { fr: "iOS & Android", en: "iOS & Android" },
    description: {
      fr: "Application de commande et géo-suivi de coursiers avec notifications push instantanées et chat livreur-client.",
      en: "Real-time delivery orders, rider geo-tracking systems, socket chats, and reactive push notifications."
    }
  },
  "real-5": {
    title: { fr: "App 'Kamer Care'", en: "'Kamer Care' Application" },
    subtitle: { fr: "Réservation de consultations médicales", en: "Medical consultant booking app" },
    badge: { fr: "iOS & Android", en: "iOS & Android" },
    description: {
      fr: "Rendez-vous et ordonnances sécurisés. Permet de trouver des spécialistes à Douala et Yaoundé et de réserver des créneaux de téléconsultation.",
      en: "HIPAA compliant scheduling and digital prescriptions. Matches patients with doctors in Douala and Yaoundé for video calls."
    }
  },
  "real-6": {
    title: { fr: "Identité 'Mboa Hub'", en: "'Mboa Hub' Brand Identity" },
    subtitle: { fr: "Charte graphique et logo d'espace de co-working", en: "Co-working space logo and manual guide" },
    badge: { fr: "Identité Visuelle", en: "Visual Guidelines" },
    description: {
      fr: "Design complet de l'identité visuelle de la marque, logo moderne à géométrie variable, supports imprimés et templates de posts réseaux sociaux.",
      en: "Comprehensive creation of the brand graphic system: vector responsive logs, print boards, and social banners."
    }
  }
};

export const Showcase: React.FC = () => {
  const { language, theme, t } = useApp();
  const [activeCategory, setActiveCategory] = useState<"tous" | "sites" | "apps" | "design">("tous");
  const [selectedProject, setSelectedProject] = useState<ShowcaseItem | null>(null);

  const categories = [
    { label: language === "fr" ? "Tout voir" : "All Work", id: "tous" },
    { label: language === "fr" ? "Sites Internet" : "Websites", id: "sites" },
    { label: language === "fr" ? "Applications Mobiles" : "Mobile Apps", id: "apps" },
    { label: language === "fr" ? "Identités & Design" : "Branding & Design", id: "design" },
  ] as const;

  const filteredProjects = SHOWCASE_ITEMS.filter(
    (item) => activeCategory === "tous" || item.category === activeCategory
  );

  const getLocalizedProject = (item: ShowcaseItem) => {
    const backup = {
      title: item.title,
      subtitle: item.subtitle,
      badge: item.badge,
      description: item.description
    };
    const trans = PROJECTS_TRANSLATIONS[item.id];
    if (!trans) return backup;
    return {
      title: trans.title[language] || backup.title,
      subtitle: trans.subtitle[language] || backup.subtitle,
      badge: trans.badge[language] || backup.badge,
      description: trans.description[language] || backup.description
    };
  };

  return (
    <section id="realisations" className={`py-24 transition-colors duration-300 ${
      theme === "light" ? "bg-slate-50 text-slate-800" : "bg-transparent text-slate-100"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {t("showcase.badge")}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {t("showcase.title")}
          </h2>
          <p className={`text-lg leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {t("showcase.desc")}
          </p>
        </div>

        {/* Tab category selectors */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-full text-sm font-bold border transition duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-gold text-white border-gold shadow-lg shadow-gold/25"
                  : theme === "light"
                    ? "bg-white text-slate-600 border-slate-200 hover:border-gold hover:bg-slate-50"
                    : "bg-white/5 text-slate-300 border-white/10 hover:border-gold/30 hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((item) => {
            const localProj = getLocalizedProject(item);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedProject(item)}
                className={`group backdrop-blur-md rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300 flex flex-col h-full relative ${
                  theme === "light"
                    ? "bg-white border-slate-200/80 hover:border-gold/30 shadow-md hover:shadow-slate-200"
                    : "bg-[#1e293b]/30 border-white/5 hover:border-gold/30 shadow-xl hover:shadow-2xl"
                }`}
              >
                {/* Card visual using dynamic illustration layout */}
                <div className="relative aspect-video w-full overflow-hidden bg-navy-dark">
                  <ShowcaseIllustration type={item.svgKey} />
                  <div className="absolute inset-0 bg-navy-dark/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <span className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold text-white shadow-md flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition duration-300">
                      <ExternalLink size={14} /> {language === "fr" ? "Voir le projet" : "View project"}
                    </span>
                  </div>
                </div>

                {/* Card text metadata */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest mb-2">
                      {localProj.badge}
                    </span>
                    <h3 className={`font-display font-black text-lg group-hover:text-gold transition ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}>
                      {localProj.title}
                    </h3>
                    <p className={`text-xs mt-1 truncate ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>{localProj.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {item.techs.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          theme === "light"
                            ? "bg-slate-50 border-slate-200 text-slate-650"
                            : "bg-white/5 border-white/10 text-slate-300"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                    {item.techs.length > 3 && (
                      <span className={`text-[10px] font-semibold px-1 py-0.5 rounded border ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-400"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}>
                        +{item.techs.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal details container */}
        {selectedProject && (() => {
          const localProj = getLocalizedProject(selectedProject);
          return (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeUp">
              <div className={`rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border p-8 ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-[#0f172a] border-white/10 text-white"
              }`}>
                <button
                  onClick={() => setSelectedProject(null)}
                  className={`absolute top-5 right-5 p-2 rounded-full transition ${
                    theme === "light"
                      ? "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label="Fermer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest mb-3">
                  <LayoutGrid size={13} />
                  {localProj.badge}
                </div>

                <h3 className={`font-display font-black text-2xl sm:text-3xl leading-tight mb-2 ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>
                  {localProj.title}
                </h3>
                <p className={`text-sm mb-6 pb-4 border-b ${
                  theme === "light" ? "border-slate-100 text-slate-500" : "border-white/5 text-slate-400"
                }`}>
                  {localProj.subtitle}
                </p>

                {/* SVG Graphic inside modal details banner */}
                <div className="rounded-xl overflow-hidden aspect-video bg-navy-dark mb-6 border border-white/5 shadow-inner">
                  <ShowcaseIllustration type={selectedProject.svgKey} />
                </div>

                {/* Specific metadata list */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 py-4 border rounded-2xl px-6 ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-[#1e293b]/50 border-white/5"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold/15 text-gold">
                      <User size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase block">{t("showcase.client")}</span>
                      <span className={`text-xs font-bold truncate leading-none block ${
                        theme === "light" ? "text-slate-800" : "text-white"
                      }`}>
                        {selectedProject.client}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold/15 text-gold">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase block">{t("showcase.year")}</span>
                      <span className={`text-xs font-bold leading-none block ${
                        theme === "light" ? "text-slate-800" : "text-white"
                      }`}>
                        {selectedProject.year}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1 leading-none">
                      <span className="text-[10px] text-slate-400 font-medium uppercase block w-full">Status</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gold/10 text-gold border border-gold/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                        {language === "fr" ? "Actif" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className={`font-bold text-sm mb-2 ${
                    theme === "light" ? "text-slate-800" : "text-slate-200"
                  }`}>{language === "fr" ? "Description du projet" : "Project Description"}</h4>
                  <p className={`text-sm leading-relaxed ${
                    theme === "light" ? "text-slate-600" : "text-slate-300"
                  }`}>{localProj.description}</p>
                </div>

                <div>
                  <h4 className={`font-bold text-sm mb-2 ${
                    theme === "light" ? "text-slate-800" : "text-slate-200"
                  }`}>{language === "fr" ? "Stack Technique & Outils" : "Technology Stack & Tools"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.techs.map((t, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 border text-xs font-semibold rounded-lg ${
                          theme === "light"
                            ? "bg-slate-50 border-slate-200 text-slate-700"
                            : "bg-white/5 border-white/10 text-slate-300"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProject(null)}
                  className="mt-8 w-full py-3.5 bg-gold hover:bg-gold-light text-white font-bold rounded-xl transition cursor-pointer"
                >
                  {language === "fr" ? "Fermer l'aperçu" : "Close overview"}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};
