/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Cpu, Briefcase, Mic, Calculator, Sparkles, ArrowRight, Star } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Services } from "./components/Services";
import { Showcase } from "./components/Showcase";
import { AudioStudio } from "./components/AudioStudio";
import { ProjectEstimator } from "./components/ProjectEstimator";
import { ClientDashboard } from "./components/ClientDashboard";
import { AboutAndCounter } from "./components/AboutAndCounter";
import { FAQ } from "./components/FAQ";
import { ContactForm } from "./components/ContactForm";
import { Footer } from "./components/Footer";
import { LiveChat } from "./components/LiveChat";
import { TESTIMONIALS } from "./data";
import { useApp } from "./context/AppContext";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Dynamic English-French translation map for testimonials
const TESTIMONIALS_TRANSLATIONS: Record<string, {
  content: Record<string, string>;
  role: Record<string, string>;
}> = {
  "t-1": {
    content: {
      fr: "Une écoute et un professionnalisme incroyable ! L'application Yéma Deliveries fonctionne à la perfection et nos ventes ont doublé depuis sa publication sur le Play Store ! Je recommande vivement Luciole Services.",
      en: "Incredible attention to detail and professionalism! The Yéma Deliveries app runs flawlessly and our sales doubled shortly after launching on Google Play! Highly recommended."
    },
    role: {
      fr: "Fondatrice de Yéma Foods",
      en: "Founder & CEO, Yéma Foods"
    }
  },
  "t-2": {
    content: {
      fr: "Travailler avec Luciole-services a été une révélation. Pas de frais d'agence inutiles, une réactivité hors pair par WhatsApp, et une base de données optimisée qui répond enfin instantanément à notre dashboard logistique.",
      en: "Working with Luciole Services has been an absolute revelation. No inflated agency bills, top-notch WhatsApp transparency, and a fast query database that updates our fleet in real-time."
    },
    role: {
      fr: "Directeur Technique chez Gigafret",
      en: "Chief Technology Officer, Gigafret"
    }
  },
  "t-3": {
    content: {
      fr: "Nous avons commandé un pack site web vitrine + spot de jingle radio. Le résultat est tout simplement spectaculaire. La voix off chaleureuse colle exactement à l'image de marque que nous ridiculement souhaitions véhiculer.",
      en: "We commissioned a custom landing website + a radio commercial jingle package. The deliverable is simply magnificent. The warm narrative voiceoff represents our core branding values exactly."
    },
    role: {
      fr: "Co-fondateur Africa-Consult",
      en: "Co-founder, Africa-Consult"
    }
  }
};

const SEO_CONFIG: Record<PageId, Record<"fr" | "en", { title: string; description: string; ogTitle: string; ogDescription: string }>> = {
  accueil: {
    fr: {
      title: "Luciole Services — Création Web, Mobile & Studio Audio Professionnel",
      description: "Luciole Services conçoit des applications mobiles ultra-fluides, des sites vitrines modernes, des architectures de bases de données distribuées et des spots de jingle radio professionnels.",
      ogTitle: "Luciole Services — Création Web & Studio Audio Professionnel",
      ogDescription: "Solutions digitales d'ingénierie web et production audio d'impact national avec transparence et support de proximité."
    },
    en: {
      title: "Luciole Services — Bespoke Web, Mobile & Professional Audio Studio",
      description: "Luciole Services builds high-end bespoke landing pages, smart mobile applications, robust database backends, and premium custom audio vocal/commercial jingles.",
      ogTitle: "Luciole Services — Tailored Web, Mobile & Audio Studio",
      ogDescription: "High-performance software systems and dynamic audio voiceovers with premium craft support."
    }
  },
  services: {
    fr: {
      title: "Nos Services Web, Mobile & Base de données — Luciole Services",
      description: "Découvrez nos prestations techniques de pointe : développement d'applications mobiles iOS/Android, sites web vitrines haut de gamme et bases de données robustes.",
      ogTitle: "Prestations Techniques Web & Mobile | Luciole Services",
      ogDescription: "Ingénierie de pointe pour vos applications iOS, Android, architectures cloud et bases de données robustes."
    },
    en: {
      title: "Our Bespoke Technical Services — Luciole Services",
      description: "Explore our capabilities: responsive high-performance landing pages, fast custom smartphone developments, and optimized cloud systems.",
      ogTitle: "Custom Software Engineering Services | Luciole Services",
      ogDescription: "Cross-platform iOS/Android development, high-end design, and integrated database consulting."
    }
  },
  realisations: {
    fr: {
      title: "Nos Réalisations et Fiches Techniques — Luciole Services",
      description: "Consultez le portfolio technique de Luciole Services. Découvrez l'application Yéma Food Deliveries, le dashboard de logistique de flotte chez Gigafret et d'autres projets.",
      ogTitle: "Nos Solutions Déployées en Production | Luciole Services",
      ogDescription: "Fiches techniques et cas réels d'applications, d'architectures et de spots audio d'excellence."
    },
    en: {
      title: "Bespoke Portfolio & Selected Case Studies — Luciole Services",
      description: "Browse our active deployment portfolios: Yéma Foods Delivery systems, active logistic fleet monitors of Gigafret, and successful digital campaigns.",
      ogTitle: "Selected Projects and Live Solutions | Luciole Services",
      ogDescription: "Detailed technical reference architectures and high-fidelity project delivery show cases."
    }
  },
  "vocal-studio": {
    fr: {
      title: "Studio Vocal, Jingles et Voix-off Professionnels — Luciole Services",
      description: "Production de spots publicitaires, jingles radio d'impact national, voix-off et consoles de mixage 3D pour vos cours en ligne et campagnes marketing.",
      ogTitle: "Studio Vocal & Conception Acoustique | Luciole Services",
      ogDescription: "Enregistrement en cabine de voix off chaleureuses et mixage de spots radio à fort impact."
    },
    en: {
      title: "Professional Audio & Commercial Voiceover Studio — Luciole Services",
      description: "Mix high-quality commercial radio spots, educational voiceovers, and customized soundscapes on our interactive 3D acoustic board.",
      ogTitle: "Creative Acoustic Products & Voiceovers | Luciole Services",
      ogDescription: "Studio recording of pristine voiceovers and custom commercial jingle deliverables."
    }
  },
  estimator: {
    fr: {
      title: "Simulateur Devis & Budget Instantané — Luciole Services",
      description: "Calculez de manière transparente et instantanée le coût et le temps de développement de votre prochain logiciel, site internet ou application mobile.",
      ogTitle: "Estimer le Budget de Votre Projet | Luciole Services",
      ogDescription: "Découvrez nos coefficients de tarification clairs et transparents en moins de 2 minutes."
    },
    en: {
      title: "Online Cost & Smart Delivery Estimator — Luciole Services",
      description: "Instantly and transparently forecast the precise construction milestones and total building costs of your custom digital solution.",
      ogTitle: "Interactive Dynamic Project Estimator | Luciole Services",
      ogDescription: "Access clear cost equations matching your functional requirement inputs."
    }
  },
  "espace-client": {
    fr: {
      title: "Espace Client Sécurisé — Luciole Services",
      description: "Suivez vos jalons de livraison en temps réel, gérez vos fiches techniques de projets, factures de paiement et demandez de nouveaux travaux.",
      ogTitle: "Espace Client Sécurisé | Luciole Services",
      ogDescription: "Accédez à votre espace d'échange sécurisé pour un suivi en toute réactivité de vos développements."
    },
    en: {
      title: "Secure Client Portal Workspace — Luciole Services",
      description: "Track your active software deployment milestones, fetch invoices, launch update briefs, and review current specs.",
      ogTitle: "Secure Client Portal Dashboard | Luciole Services",
      ogDescription: "Transparent direct customer communication console for continuous delivery status."
    }
  },
  apropos: {
    fr: {
      title: "À propos, FAQ technique & Engagements — Luciole Services",
      description: "Qui sommes-nous ? Comprenez notre charte d'ingénierie, notre réactivité inégalée sur WhatsApp et nos réponses aux questions techniques récurrentes.",
      ogTitle: "À Propos & FAQ d'Ingénierie | Luciole Services",
      ogDescription: "Nos valeurs et nos réponses claires sur la sécurité, le support, et les choix de frameworks."
    },
    en: {
      title: "About Us, Engineering FAQ & Promises — Luciole Services",
      description: "Learn about our agile team, specialized React and Cloud stacks, flexible WhatsApp channels, and direct maintenance contracts.",
      ogTitle: "Core Culture and Software FAQ | Luciole Services",
      ogDescription: "Our technical manifesto explaining why we deliver premium craftsmanship with no fluff."
    }
  },
  "nouveau-projet": {
    fr: {
      title: "Discuter d'un Nouveau Projet — Luciole Services",
      description: "Faites décoller votre activité. Partagez votre projet avec notre équipe de développement pour obtenir un devis personnalisé sous 24h.",
      ogTitle: "Lancer un Nouveau Projet | Luciole Services",
      ogDescription: "Dites-nous tout sur vos besoins en développement web, mobile ou production audio."
    },
    en: {
      title: "Submit a Brand New Project Design — Luciole Services",
      description: "Translate your technical ideas into custom high-performance software. Request your quote from our builders within 24 hours.",
      ogTitle: "Initiate Your Technical Roadmap | Luciole Services",
      ogDescription: "Submit your requirement parameters directly and secure a detailed engineering quote."
    }
  }
};

type PageId = "accueil" | "services" | "realisations" | "vocal-studio" | "estimator" | "espace-client" | "apropos" | "nouveau-projet";

export default function App() {
  const { theme, language, t } = useApp();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activePage, setActivePage] = useState<PageId>("accueil");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#services") {
        setActivePage("services");
      } else if (hash === "#realisations" || hash === "#works") {
        setActivePage("realisations");
      } else if (hash === "#vocal-studio" || hash === "#audio") {
        setActivePage("vocal-studio");
      } else if (hash === "#estimator") {
        setActivePage("estimator");
      } else if (hash === "#espace-client") {
        setActivePage("espace-client");
      } else if (hash === "#nouveau-projet" || hash === "#contact") {
        setActivePage("nouveau-projet");
      } else if (hash === "#apropos") {
        setActivePage("apropos");
      } else {
        setActivePage("accueil");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Run initially
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    // Interval to slide client reviews automatically
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const renderPageContent = () => {
    switch (activePage) {
      case "services":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <Services />
          </div>
        );
      case "realisations":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <Showcase />
          </div>
        );
      case "vocal-studio":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <AudioStudio />
          </div>
        );
      case "estimator":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <ProjectEstimator />
          </div>
        );
      case "espace-client":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <ClientDashboard />
          </div>
        );
      case "nouveau-projet":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <ContactForm />
          </div>
        );
      case "apropos":
        return (
          <div className="pt-24 pb-12 animate-fadeUp flex flex-col justify-start">
            <div className="max-w-7xl mx-auto px-6 w-full mb-4">
              <a href="#accueil" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light tracking-wider font-extrabold uppercase transition">
                ← {language === "fr" ? "Retour à l'accueil" : "Back to Home"}
              </a>
            </div>
            <AboutAndCounter />
            <FAQ />
          </div>
        );
      case "accueil":
      default:
        return (
          <>
            {/* 2. Hero slider introduction & particle wave */}
            <Hero />

            {/* 3. Infinite specialized marquee ribbon */}
            <Marquee />

            {/* 4. Elegant Interactive Quick-Access Bento Grid (Accueil highlights instead of rendering everything) */}
            <section className="py-20 px-6 max-w-7xl mx-auto relative z-30">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
                  {language === "fr" ? "Découvrez Notre Agence" : "Explore Our Universe"}
                </span>
                <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>
                  {language === "fr" 
                    ? "Toutes nos spécialisations à portée de clic" 
                    : "Tailored services, segmented for productivity"}
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${
                  theme === "light" ? "text-slate-600" : "text-gray-400"
                }`}>
                  {language === "fr"
                    ? "Cliquez sur l'un de nos pôles indépendants pour en explorer les outils interactifs, simulateurs de tarifs et d'effets sonores."
                    : "Select a specialized module to access customized calculators, live recording simulations, and interactive acoustic panels."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {/* 1. Services Bento */}
                <a 
                  href="#services" 
                  className={`group p-6 sm:p-8 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[250px] sm:min-h-[280px] h-auto lg:col-span-3 ${
                    theme === "light"
                      ? "bg-white border-slate-200 shadow-sm hover:border-gold"
                      : "bg-[#1e293b]/20 border-white/5 hover:border-gold-light/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/15 flex items-center justify-center text-gold group-hover:scale-110 transition duration-300">
                        <Cpu size={22} className="text-gold" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">
                        Tech & Web
                      </span>
                    </div>
                    <div>
                      <h3 className={`font-display font-bold text-lg sm:text-xl mb-2 leading-snug ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        {language === "fr" ? "Nos Services Web/Mobile" : "Bespoke Tech Services"}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                        {language === "fr" 
                          ? "Sites vitrines haut de gamme, applications iOS & Android ultra-fluides et bases de données robustes."
                          : "High-end responsive landing designs, fast smartphone applications and robust distributed databases."}
                      </p>
                    </div>
                    
                    {/* Interactive Technology pills for premium look */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {["React", "Node.js", "Flutter", "Firebase"].map((tech) => (
                        <span key={tech} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          theme === "light" ? "bg-slate-100 text-slate-650" : "bg-white/5 text-slate-400"
                        }`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-500/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-gold group-hover:translate-x-1.5 transition duration-300 inline-flex items-center gap-1.5 min-h-[36px]">
                      {language === "fr" ? "Explorer nos services →" : "View Services →"}
                    </span>
                  </div>
                </a>

                {/* 2. Réalisations Bento */}
                <a 
                  href="#realisations" 
                  className={`group p-6 sm:p-8 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[250px] sm:min-h-[280px] h-auto lg:col-span-3 ${
                    theme === "light"
                      ? "bg-white border-slate-200 shadow-sm hover:border-gold"
                      : "bg-[#1e293b]/20 border-white/5 hover:border-gold-light/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/15 flex items-center justify-center text-gold group-hover:scale-110 transition duration-300">
                        <Briefcase size={22} className="text-gold" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/10">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        <span>98% Score</span>
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-display font-bold text-lg sm:text-xl mb-2 leading-snug ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        {language === "fr" ? "Nos Réalisations" : "Bespoke Portfolio"}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                        {language === "fr"
                          ? "Retrouvez nos fiches techniques détaillées de plateformes logistiques, fintechs et applications phares."
                          : "Detailed technical showcases and production reference models of fleet logistics or active systems."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold pt-1">
                      <span className="flex items-center gap-1">🟢 24+ Live Apps</span>
                      <span className="flex items-center gap-1">🌍 Europe / Africa</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-500/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-gold group-hover:translate-x-1.5 transition duration-300 inline-flex items-center gap-1.5 min-h-[36px]">
                      {language === "fr" ? "Consulter notre portfolio →" : "Explore Showcases →"}
                    </span>
                  </div>
                </a>

                {/* 3. Studio Audio Bento */}
                <a 
                  href="#vocal-studio" 
                  className={`group p-6 sm:p-8 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[250px] sm:min-h-[280px] h-auto lg:col-span-2 ${
                    theme === "light"
                      ? "bg-white border-slate-200 shadow-sm hover:border-gold"
                      : "bg-[#1e293b]/20 border-white/5 hover:border-gold-light/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/15 flex items-center justify-center text-gold group-hover:scale-110 transition duration-300">
                        <Mic size={22} className="text-gold" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-550/10 text-emerald-500 border border-emerald-500/10">
                        Audio studio
                      </span>
                    </div>
                    <div>
                      <h3 className={`font-display font-bold text-lg sm:text-xl mb-2 leading-snug ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        {language === "fr" ? "Studio Vocal & Jingles" : "Professional Jingle Studio"}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === "light" ? "text-slate-400" : "text-slate-400"}`}>
                        {language === "fr"
                          ? "Console d'effets audio 3D, voix-off et spots radio d'impact national."
                          : "Interactive acoustic console and premium commercial voiceover deliverables."}
                      </p>
                    </div>

                    {/* Cute responsive sound wave visualization */}
                    <div className="flex items-center gap-1.5 h-6 pt-1">
                      <span className="w-1 h-3 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-1 h-5 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      <span className="w-1 h-4 bg-gold/85 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
                      <span className="w-1 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1 h-4 bg-gold/70 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      <span className="w-1 h-3 bg-gold/50 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }} />
                      <span className="text-[9px] font-mono text-slate-400 pl-2">Stereo HQ</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-500/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-gold group-hover:translate-x-1.5 transition duration-300 inline-flex items-center gap-1.5 min-h-[36px]">
                      {language === "fr" ? "Écouter les démos →" : "Listen details →"}
                    </span>
                  </div>
                </a>

                {/* 4. Budget Simulator Bento */}
                <a 
                  href="#estimator" 
                  className={`group p-6 sm:p-8 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[250px] sm:min-h-[280px] h-auto lg:col-span-4 ${
                    theme === "light"
                      ? "bg-white border-slate-200 shadow-sm hover:border-gold"
                      : "bg-[#1e293b]/20 border-white/5 hover:border-gold-light/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/15 flex items-center justify-center text-gold group-hover:scale-110 transition duration-300">
                        <Calculator size={22} className="text-gold" />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10 uppercase tracking-widest">
                        <Sparkles size={11} className="animate-pulse" />
                        {language === "fr" ? "Estimation 2 Min" : "2 Min Calc"}
                      </span>
                    </div>
                    <div>
                      <h3 className={`font-display font-bold text-lg sm:text-xl mb-2 leading-snug ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        {language === "fr" ? "Simulateur Devis Budget" : "Online Cost Estimator"}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                        {language === "fr"
                          ? "Estimez le coût et le temps de développement de votre projet de manière transparente et instantanée."
                          : "Explore exact pricing coefficients and delivery schedules matching your technical design choices."}
                      </p>
                    </div>

                    {/* Mini visual steps mockup */}
                    <div className="flex items-center gap-2 max-w-sm pt-1">
                      <div className="h-1.5 bg-gold/20 flex-1 rounded-full overflow-hidden">
                        <div className="h-full bg-gold w-3/4 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider">75% {language === "fr" ? "Prêt" : "Done"}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-500/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-gold group-hover:translate-x-1.5 transition duration-300 inline-flex items-center gap-1.5 min-h-[36px]">
                      {language === "fr" ? "Lancer le simulateur →" : "Calculate Budget →"}
                    </span>
                  </div>
                </a>
              </div>
            </section>

            {/* 5. Visual Customer Reviews carousel */}
            <section className={`py-24 transition-colors duration-300 relative z-30 border-y ${
              theme === "light"
                ? "bg-slate-105 text-slate-800 border-slate-200"
                : "bg-navy-dark/45 border-white/5 backdrop-blur-md text-white"
            }`}>
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
                    {t("reviews.badge")}
                  </span>
                  <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    {t("reviews.title")}
                  </h2>
                </div>

                <div className={`max-w-3xl mx-auto border rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl min-h-[260px] flex flex-col justify-between ${
                  theme === "light"
                    ? "bg-white border-slate-205 shadow-slate-100 text-slate-800"
                    : "bg-white/5 border-white/10 backdrop-blur-sm shadow-xl text-white"
                }`}>
                  {TESTIMONIALS.map((tItem, index) => {
                    const localTest = TESTIMONIALS_TRANSLATIONS[tItem.id] || {
                      content: { fr: tItem.content, en: tItem.content },
                      role: { fr: tItem.role, en: tItem.role }
                    };
                    return (
                      <div
                        key={tItem.id}
                        className={`transition-all duration-700 flex flex-col ${
                          index === activeTestimonial
                            ? "opacity-100 scale-100 relative pointer-events-auto"
                            : "opacity-0 scale-95 absolute pointer-events-none inset-x-8 top-12"
                        }`}
                      >
                        {/* 5-Star Indicator */}
                        <div className="flex items-center gap-1 text-gold mb-6 text-lg">
                          {Array.from({ length: tItem.stars }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>

                        <p className={`text-base sm:text-lg italic leading-relaxed mb-8 ${
                          theme === "light" ? "text-slate-700" : "text-gray-200"
                        }`}>
                          "{localTest.content[language]}"
                        </p>

                        <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                          {/* Styled customized vector initials avatar to avoid heavy images loading */}
                          <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/10 flex items-center justify-center text-xl select-none">
                            {tItem.avatarSvg}
                          </div>
                          <div>
                            <h4 className={`font-display font-bold text-sm leading-none mb-1 ${
                              theme === "light" ? "text-slate-900" : "text-white"
                            }`}>
                              {tItem.author}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                              {localTest.role[language]} • {tItem.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Slider dots trackers */}
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {TESTIMONIALS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestimonial(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === activeTestimonial ? "w-6 bg-gold" : "w-1.5 bg-white/30"
                        }`}
                        aria-label={`Testimonial slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        );
    }
  };

  const currentSEO = SEO_CONFIG[activePage]?.[language] || SEO_CONFIG.accueil[language];
  const canonicalUrl = `https://luciole-serves.com/${activePage !== "accueil" ? `#${activePage}` : ""}`;

  return (
    <div className={`transition-colors duration-300 min-h-screen font-sans selection:bg-gold/30 leading-relaxed ${
      theme === "light" 
        ? "bg-slate-50 text-slate-800 selection:text-slate-900" 
        : "bg-transparent text-slate-100 selection:text-navy-dark"
    }`}>
      <Helmet>
        {/* Dynamic Meta Headers for Search Engine Optimization */}
        <title>{currentSEO.title}</title>
        <meta name="description" content={currentSEO.description} />
        
        {/* Canonical url reference */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Dynamic Open Graph Facebook metadata */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={currentSEO.ogTitle} />
        <meta property="og:description" content={currentSEO.ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Luciole Services" />

        {/* Dynamic Twitter Cards metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentSEO.ogTitle} />
        <meta name="twitter:description" content={currentSEO.ogDescription} />
      </Helmet>

      {/* 1. Header Navigation */}
      <Navbar activePage={activePage} />

      {/* Synchronized Dynamic Multi-Screen Content Container */}
      {renderPageContent()}

      {/* 11. Footer credits mapping */}
      <Footer />

      {/* 12. Floating WhatsApp fast assistance */}
      <a
        href="https://wa.me/237699958089"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.6)] transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer animate-bounce border border-white/10 group"
      >
        <span className="text-2xl">💬</span>
        <div className="absolute right-full mr-3 bg-white text-navy-dark text-xs font-bold py-2 px-3 rounded-lg shadow-xl border border-gray-100 hidden group-hover:block whitespace-nowrap animate-fadeUp">
          {language === "fr" ? "Besoin d'aide ? Parlons par WhatsApp !" : "Need help? Let's talk on WhatsApp!"}
        </div>
      </a>

      {/* 13. Interactive Support Live Chat */}
      <LiveChat />
    </div>
  );
}
