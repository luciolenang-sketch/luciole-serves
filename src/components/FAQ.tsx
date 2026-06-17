/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronDown, Search, HelpCircle, MessageSquare, ArrowRight, Star, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  id: string;
  category: "services" | "process" | "payment";
  question: {
    fr: string;
    en: string;
  };
  answer: {
    fr: string;
    en: string;
  };
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "services",
    question: {
      fr: "Quels services précis propose Luciole Services ?",
      en: "What specific services does Luciole Services provide?"
    },
    answer: {
      fr: "Nous sommes spécialisés de bout en bout dans : la création de sites internet sur-mesure (vitrines interactives, éco-systèmes E-commerce), le développement d'applications mobiles performantes (iOS & Android via structures hybrides fluides), la conception de bases de données ultra-sécurisées couplées à des APIs cloud robustes, ainsi que la production audio et vocale professionnelle ( spots radio jingles, serveurs interactifs vocaux, voix-off nationales et habillage sonore d'antennes).",
      en: "We offer end-to-end expertise in: customized website creation (highly interactive portfolios, complex E-commerce ecosystems), cross-platform high-fidelity mobile application development (iOS & Android via fluid hybrid environments), architecting ultra-secure cloud databases with scalable custom APIs, and professional studio audio and voice production (radio ad spots, interactive phone systems, voiceovers with national broadcasting quality, and sonic station branding)."
    }
  },
  {
    id: "faq-2",
    category: "services",
    question: {
      fr: "Vos applications mobiles fonctionnent-elles sur iOS et Android à la fois ?",
      en: "Do your mobile applications run on both iOS and Android?"
    },
    answer: {
      fr: "Absolument. Afin de rationaliser vos coûts et d'assurer une maintenance homogène, nous développons des applications mobiles cross-platform haut de gamme. Le même code source natif alimente simultanément les terminaux Apple et Android avec une fluidité de 60 images par seconde.",
      en: "Absolutely. To optimize your development budget and ensure uniform updates, we engineer premium cross-platform hybrid applications. A single streamlined native codebase fuels both Apple iOS and Android environments at a buttery smooth 60 FPS."
    }
  },
  {
    id: "faq-3",
    category: "process",
    question: {
      fr: "Comment se passe l'étape de cadrage initial d'un projet ?",
      en: "What is the initial project scoping phase like?"
    },
    answer: {
      fr: "Tout commence par notre simulateur de budget intégré ou un échange direct et réactif via WhatsApp. Nous analysons l'arborescence de l'outil souhaité pour générer un Brief Technique formel et un devis transparent. Dès validation juridique, nous créons vos accès de suivi sur l'Espace Client et votre projet démarre sous 24h.",
      en: "It all starts with our automated digital estimator or a rapid consultative swap on WhatsApp. We map out your software architecture to draft a formal Technical Brief and a fixed pricing proposal. Upon legal agreement, we dispatch your client vault credentials and development commences within 24 hours."
    }
  },
  {
    id: "faq-4",
    category: "process",
    question: {
      fr: "Fournissez-vous des rapports de progression réguliers ?",
      en: "Do you supply continuous project progress reports?"
    },
    answer: {
      fr: "Oui, un de nos piliers est la transparence absolue. Vous disposez de votre Espace Client dédié avec un diagramme dynamique affichant l'étape courante (Cadrage, Design graphique, Code, Tests QA, Déploiement) et sa jauge de complétion. Chaque livrable intermédiaire majeur fait également l'objet d'une démonstration guidée.",
      en: "Yes, absolute transparency is one of our founding values. You benefit from a dedicated Client Space equipped with interactive track charts indicating the current phase (Brief, UI/UX Design, Development, QA testing, Production release) with a completion percentage indicator. Each primary milestone is demonstrated with a walkthrough."
    }
  },
  {
    id: "faq-5",
    category: "payment",
    question: {
      fr: "Quels sont vos moyens de paiement acceptés pour régler une facture ?",
      en: "What payment options do you support to settle invoices?"
    },
    answer: {
      fr: "Nous offrons désormais deux méthodes sécurisées de règlement en ligne pour vos acomptes : \n1. Le Paiement Direct Sécurisé sur le site (simulation hautement interactive intégrant MTN Mobile Money et Orange Money Cameroon).\n2. Le Paiement via notre Partenaire Certifié Notch Pay (permettant un traitement réel de votre transaction d'acompte par Mobile Money, Cartes Bancaires Visa ou Mastercard en toute sérénité).",
      en: "We offer two highly secure online checkouts for your payment requirements: \n1. On-site Simulated Direct Pay (a highly interactive demo simulation supporting camera-ready mock MTN MoMo and Orange Money networks).\n2. Pay via Certified Partner (routing you securely to Notch Pay gateways for real card clearances or real mobile wallet billing processing)."
    }
  },
  {
    id: "faq-6",
    category: "payment",
    question: {
      fr: "Proposez-vous des facilités de paiement échelonné ?",
      en: "Do you offer flexible milestone installments?"
    },
    answer: {
      fr: "Oui, tous nos contrats d'ingénierie prévoient un échelonnement protecteur pour votre trésorerie. Traditionnellement, le budget est scindé en 3 versements : 35% d'acompte au démarrage, 35% après validation de l'interface graphique UI/UX, et les 30% résiduels à la livraison finale et publication sur les stores ou serveurs.",
      en: "Yes, all our engineering contracts incorporate a protective milestone schedule to optimize your cash flow. Typically, budgets are split into 3 installments: a 35% initial retainer to start, 35% upon graphics and mockup sign-off, and the final 30% balance only when deploying to stores or production servers."
    }
  }
];

export const FAQ: React.FC = () => {
  const { theme, language } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "services" | "process" | "payment">("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const categories = [
    { id: "all", label: { fr: "Tous", en: "All" } },
    { id: "services", label: { fr: "Nos Services", en: "Our Offerings" } },
    { id: "process", label: { fr: "Notre Process", en: "Work Process" } },
    { id: "payment", label: { fr: "Facturation & Paiement", en: "Billing & Pay" } }
  ];

  // Filtering criteria
  const filteredFAQs = FAQ_DATA.filter((item) => {
    // Category match
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;
    
    // Search match
    const questionText = item.question[language].toLowerCase();
    const answerText = item.answer[language].toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = questionText.includes(searchLower) || answerText.includes(searchLower);

    return categoryMatch && searchMatch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/237699958089", "_blank");
  };

  return (
    <section 
      id="faq" 
      className={`py-24 border-t transition-colors duration-300 relative z-30 ${
        theme === "light"
          ? "bg-slate-50 text-slate-800 border-slate-200"
          : "bg-navy-dark/30 border-white/5 backdrop-blur-md text-white"
      }`}
    >
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {language === "fr" ? "Aide & FAQ" : "Support & FAQ"}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-3 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {language === "fr" ? "Questions Fréquentes" : "Frequently Asked Questions"}
          </h2>
          <p className={`text-sm leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {language === "fr" 
              ? "Tout savoir sur nos expertises logicielles, notre méthodologie de travail, et nos nouvelles options de payement flexibles."
              : "Discover detailed insights about our software frameworks, client workflow timelines, and our secure custom payment pathways."}
          </p>
        </div>

        {/* Search Bar & Categories Navigation */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
            {/* Category Tabs */}
            <div className={`p-1 rounded-2xl border flex flex-wrap gap-1 items-center max-w-full ${
              theme === "light" ? "bg-slate-100 border-slate-205" : "bg-white/5 border-white/5"
            }`}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`faq-cat-tab-${cat.id}`}
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setOpenFaqId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-gold text-slate-950 shadow-md transform scale-102"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.label[language]}
                </button>
              ))}
            </div>

            {/* Keyword Interactive search input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                id="faq-search-bar"
                value={searchQuery}
                aria-label="Filter FAQs"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "fr" ? "Filtrer les questions..." : "Search for answers..."}
                className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border focus:outline-none focus:border-gold transition-all duration-300 ${
                  theme === "light"
                    ? "bg-white border-slate-205 text-slate-900 shadow-sm"
                    : "bg-white/5 border-white/10 text-white focus:bg-white/8"
                }`}
              />
            </div>
          </div>
        </div>

        {/* FAQs Accordion Grid */}
        <div className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, i) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    id={faq.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                      isOpen 
                        ? theme === "light"
                          ? "bg-white border-gold/40 shadow-slate-200"
                          : "bg-slate-950/40 border-gold/30 shadow-none"
                        : theme === "light"
                          ? "bg-white border-slate-205 shadow-sm hover:border-slate-300 text-slate-800"
                          : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4 text-white"
                    }`}
                  >
                    {/* Collapsible trigger header */}
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      id={`faq-btn-${faq.id}`}
                      className="w-full px-6 py-5 text-left flex items-start gap-4 justify-between cursor-pointer group"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle 
                          size={16} 
                          className={`mt-0.5 shrink-0 transition-colors duration-300 ${
                            isOpen ? "text-gold" : "text-slate-400 group-hover:text-gold"
                          }`} 
                        />
                        <span className={`text-[13.5px] font-bold leading-tight transition-colors ${
                          isOpen 
                            ? theme === "light" ? "text-slate-950" : "text-white" 
                            : theme === "light" ? "text-slate-750 group-hover:text-slate-955" : "text-slate-200 group-hover:text-white"
                        }`}>
                          {faq.question[language]}
                        </span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-slate-400 group-hover:text-gold shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-gold" : ""
                        }`} 
                      />
                    </button>

                    {/* Answer collapsible content */}
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className={`px-6 pb-6 pt-1 text-[12.5px] leading-relaxed border-t border-dashed ${
                          theme === "light" 
                            ? "text-slate-650 border-slate-100" 
                            : "text-slate-300 border-white/5"
                        }`}>
                          <div className="whitespace-pre-line pl-7">
                            {faq.answer[language]}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`py-12 text-center rounded-2xl border border-dashed ${
                  theme === "light" ? "border-slate-205 text-slate-505" : "border-white/10 text-slate-400"
                }`}
              >
                <RefreshCw size={24} className="mx-auto mb-3 text-gold animate-spin" />
                <p className="text-xs font-semibold">
                  {language === "fr" 
                    ? "Aucune question trouvée pour vos termes de recherche." 
                    : "No matches found. Try entering alternative terms."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* WhatsApp Prompter at the footer of FAQ */}
        <div id="faq-bottom-cta" className={`mt-12 p-6 sm:p-8 rounded-3xl border text-center relative overflow-hidden ${
          theme === "light"
            ? "bg-white border-slate-205 shadow-md shadow-slate-150"
            : "bg-gradient-to-tr from-navy-dark/40 to-slate-900/60 border-white/5"
        }`}>
          <div className="absolute right-[-40px] top-[-30px] opacity-5 text-gold scale-150 pointer-events-none">
            <MessageSquare size={130} />
          </div>
          <div className="max-w-lg mx-auto flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center mb-4">
              <MessageSquare size={18} />
            </div>
            <h4 className={`font-display font-black text-sm uppercase tracking-wide mb-2 ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              {language === "fr" ? "Besoin d'un éclaircissement supplémentaire ?" : "Still need a custom clarification?"}
            </h4>
            <p className="text-xs text-slate-400 mb-6 max-w-sm leading-relaxed">
              {language === "fr"
                ? "Notre équipe d'ingénierie et de production sonore répond en moins de 15 minutes sur WhatsApp."
                : "Connect with our software delivery lead or sonic engineers and receive answers under 15 minutes."}
            </p>
            <button
              onClick={handleWhatsAppContact}
              id="faq-whatsapp-btn"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba56] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-305 shadow-lg shadow-[#25d366]/15 hover:shadow-[#25d366]/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{language === "fr" ? "Parler avec un ingénieur" : "Consult our engineers"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
