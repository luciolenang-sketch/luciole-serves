/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from "lucide-react";

type Language = "fr" | "en";
type Theme = "dark" | "light";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navbar & Common
    "nav.home": "Accueil",
    "nav.services": "Services",
    "nav.works": "Réalisations",
    "nav.audio": "Studio Audio",
    "nav.estimator": "Simulateur Budget",
    "nav.about": "À propos",
    "nav.client": "Espace Client",
    "nav.contact": "Contact",
    "nav.new_project": "Nouveau Projet",
    "nav.start_project": "Démarrer un projet",
    
    // Hero Section
    "hero.tag": "Votre agence de confiance à Douala",
    "hero.title": "Création web, mobile & voix-off premium",
    "hero.desc": "Des experts unis pour concevoir vos applications sur-mesure de haute qualité, bases de données ultra-sécurisées, et jingles d'impact national pour propulser votre entreprise.",
    "hero.cta": "Découvrir nos services",
    "hero.slide1_title": "Des experts métiers unis pour votre réussite.",
    "hero.slide2_title": "Des smartphones aux architectures robustes.",
    "hero.slide3_title": "Des sites modernes, ultra-rapides et intuitifs.",
    "hero.slide4_title": "Des spots, voix off et jingles d'impact national.",
    "hero.tag1": "Synergie Collective",
    "hero.tag2": "Développement mobile & web",
    "hero.tag3": "Performance Cloud & Web",
    "hero.tag4": "Production Sonore",

    // Services Section
    "services.badge": "Nos Expertises",
    "services.title": "Des solutions pensées pour votre croissance.",
    "services.desc": "Nous combinons de l'ingénierie logicielle avancée avec la production de contenus audio pour propulser votre communication de marque à un niveau supérieur.",
    "services.more": "En savoir plus",
    "services.features": "Avantages inclus :",
    "services.close": "Fermer les détails",

    // Showcase Section
    "showcase.badge": "Nos Réalisations",
    "showcase.title": "Des applications qui font la différence.",
    "showcase.desc": "Découvrez un aperçu concret des projets d'envergure que nous avons conçus et déployés avec succès auprès de nos partenaires clés.",
    "showcase.client": "Client",
    "showcase.year": "Année",
    "showcase.techs": "Technologies",

    // Audio Studio Section
    "audio.badge": "Studio d'Enregistrement",
    "audio.title": "Des voix-off d'impact pour votre marque.",
    "audio.desc": "Enregistrement de spots publicitaires, jingles d'antenne, documentaires et serveurs vocaux avec des voix de qualité studio. Ajustez la vitesse et écoutez des démos instantanées !",
    "audio.vibe": "Ambiance du studio",
    "audio.hear": "Écouter la démo",
    "audio.speaking": "Lecture en cours...",
    "audio.sample_text": "Texte à lire",
    "audio.interactive_fx": "Console d'Effets 3D Audio",
    "audio.fx_desc": "Cliquez pour déclencher des fréquences audio et tester l'acoustique de la console :",

    // Estimator Section
    "estimator.badge": "Simulateur Instantané",
    "estimator.title": "Planifiez votre budget de projet.",
    "estimator.desc": "Choisissez vos options ci-dessous et estimez en temps réel le coût et le délai prévisionnels pour votre prochain système web, mobile ou audio.",
    "estimator.type": "Type de Projet Principal",
    "estimator.dev_time": "Temps de développement estimé",
    "estimator.order_cta": "Valider ce devis par mail",
    "estimator.currency": "Devise d'affichage",

    // About Section
    "about.badge": "À propos de nous",
    "about.title": "La technologie au service de l'excellence humaine.",
    "about.desc": "Basée à Douala, Luciole Services réunit des développeurs passionnés, des ingénieurs réseau, et des spécialistes de la voix pour offrir une transition digitale clé en main aux PME et grandes marques du continent.",
    "about.stat1": "Projets Livrés",
    "about.stat2": "Heures de Code",
    "about.stat3": "Voix Off Enregistrées",
    "about.stat4": "Partenaires Satisfaits",

    // Reviews Section
    "reviews.badge": "Témoignages Clients",
    "reviews.title": "Ils nous font confiance.",

    // Contact Form
    "contact.badge": "Nous Recruter",
    "contact.title": "Parlez-nous de votre projet.",
    "contact.desc": "Remplissez notre formulaire de contact rapide en moins de 30 secondes. Nous vous recontacterons sous 24 heures pour planifier un entretien d'opportunité gratuit.",
    "contact.phone": "Téléphone / WhatsApp",
    "contact.emails": "E-mails de Contact",
    "contact..location": "Siège de Service",
    "contact.form_name": "Nom complet *",
    "contact.form_email": "Adresse E-mail *",
    "contact.form_phone": "Numéro de Téléphone *",
    "contact.form_service": "Service Souhaité",
    "contact.form_message": "Détaillez vos besoins *",
    "contact.form_caption": "* En soumettant ce formulaire, vous acceptez d'être contacté par e-mail ou téléphone pour l'élaboration de votre devis.",
    "contact.form_send": "Envoyer la demande",
    "contact.success_title": "Demande Transmise !",
    "contact.success_desc": "Merci {name} ! Votre demande d'entretien technique a été enregistrée avec succès. Un e-mail de devis récapitulatif a été préparé pour devis@luciole-serves.com et nous vous contacterons au {phone} très vite.",
    "contact.new_msg": "Nouveau message",

    // Services Names
    "service.web": "Création de site web",
    "service.app": "Application mobile iOS/Android",
    "service.db": "Bases de données & APIs",
    "service.brand": "Logo & Charte Graphique",
    "service.jingle": "Jingle & Studio Vocal",
    "service.other": "Autre projet",
  },
  en: {
    // Navbar & Common
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.works": "Showcases",
    "nav.audio": "Audio Studio",
    "nav.estimator": "Budget Simulator",
    "nav.about": "About Us",
    "nav.client": "Client Portal",
    "nav.contact": "Contact",
    "nav.new_project": "New Project",
    "nav.start_project": "Start Project",
    
    // Hero Section
    "hero.tag": "Your trusted agency in Douala",
    "hero.title": "Web, Mobile & Premium Voice-Over Agency",
    "hero.desc": "United experts to design custom high-quality applications, ultra-secure databases, and radio ad spots with national impact to accelerate your business.",
    "hero.cta": "Discover our services",
    "hero.slide1_title": "Industry experts united for your absolute success.",
    "hero.slide2_title": "From sleek smartphones to robust backend systems.",
    "hero.slide3_title": "Modern, lightning-fast and highly intuitive websites.",
    "hero.slide4_title": "National-impact ad spots, voiceovers and jingles.",
    "hero.tag1": "Collective Synergy",
    "hero.tag2": "Mobile & Web Development",
    "hero.tag3": "Cloud & Web Performance",
    "hero.tag4": "Audio Production",

    // Services Section
    "services.badge": "Our Expertises",
    "services.title": "Solutions designed for your exponential growth.",
    "services.desc": "We combine creative software engineering with premium audio soundscapes to elevate your brand communication.",
    "services.more": "Learn more",
    "services.features": "Included benefits:",
    "services.close": "Close Details",

    // Showcase Section
    "showcase.badge": "Our Works",
    "showcase.title": "Applications that make the difference.",
    "showcase.desc": "Explore a tailored collection of large-scale projects we designed and deployed for our key industry partners.",
    "showcase.client": "Client",
    "showcase.year": "Year",
    "showcase.techs": "Technologies",

    // Audio Studio Section
    "audio.badge": "Recording Vocal Studio",
    "audio.title": "High impact voice-overs for your branding.",
    "audio.desc": "Record professional commercial audio spots, radio jingles, documentaries, and phone voice integrations. Tweak text, speed, and preview live demos!",
    "audio.vibe": "Studio Environment Feel",
    "audio.hear": "Listen to voice sample",
    "audio.speaking": "Speaking live...",
    "audio.sample_text": "Text to render",
    "audio.interactive_fx": "Interactive 3D Soundboard Console",
    "audio.fx_desc": "Click to trigger audio frequencies and test room acoustic responses:",

    // Estimator Section
    "estimator.badge": "Instant Estimator",
    "estimator.title": "Plan your project budget transparently.",
    "estimator.desc": "Configure your features below and view real-time cost, developer schedules, and delivery guidelines for your future software.",
    "estimator.type": "Primary Development Type",
    "estimator.dev_time": "Estimated development time",
    "estimator.order_cta": "Validate this quote by email",
    "estimator.currency": "Display currency",

    // About Section
    "about.badge": "About Luciole",
    "about.title": "Powering absolute human brilliance with digital technology.",
    "about.desc": "Headquartered in Douala, Cameroon, Luciole Services brings together passionate developers, cloud engineers, and vocal artists to deliver turnkey digital transformations.",
    "about.stat1": "Delivered Projects",
    "about.stat2": "Hours of Code",
    "about.stat3": "Voiceovers Recorded",
    "about.stat4": "Happy Partners",

    // Reviews Section
    "reviews.badge": "Client Feedback",
    "reviews.title": "They trust our expertise.",

    // Contact Form
    "contact.badge": "Recruit Us",
    "contact.title": "Let's talk about your project.",
    "contact.desc": "Fill out our quick intake form in less than 30 seconds. We will reply within 24 hours to schedule a free strategic call.",
    "contact.phone": "Tel / WhatsApp Support",
    "contact.emails": "Contact Email Channels",
    "contact..location": "Corporate Location",
    "contact.form_name": "Full Name *",
    "contact.form_email": "Email Address *",
    "contact.form_phone": "Phone Number *",
    "contact.form_service": "Desired Service",
    "contact.form_message": "Tell us about your needs *",
    "contact.form_caption": "* By submitting, you agree to be contacted via email or phone to design your detailed project estimate.",
    "contact.form_send": "Send request by Email",
    "contact.success_title": "Request Submitted Successfully!",
    "contact.success_desc": "Thank you {name}! Your draft contact info has been saved. A pre-filled quote request has been prepared for devis@luciole-serves.com and we'll call you at {phone} very soon.",
    "contact.new_msg": "Write another message",

    // Services Names
    "service.web": "Web Design & Development",
    "service.app": "iOS/Android Mobile Application",
    "service.db": "Secure Databases & APIs",
    "service.brand": "Logo & Graphic Guidelines",
    "service.jingle": "Jingle & Studio Voiceover",
    "service.other": "Other creative request",
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("luciole_lang");
    return (saved === "fr" || saved === "en" ? saved : "fr") as Language;
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("luciole_theme");
    return (saved === "light" || saved === "dark" ? saved : "dark") as Theme;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem("luciole_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("luciole_theme", theme);
    // Sync class list with document.body to enable absolute styles
    if (theme === "light") {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    }
  }, [theme]);

  const t = (key: string): string => {
    return translations[language][key] || translations["fr"][key] || key;
  };

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically auto-dismiss toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, t, showToast }}>
      {children}
      
      {/* Dynamic Toast Container to hold notifications cleanly with desktop precision */}
      <div id="toast-container" className="fixed bottom-5 right-5 sm:top-24 sm:bottom-auto sm:right-6 z-[99999] flex flex-col gap-3 w-full max-w-[380px] px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let IconComponent = Info;
            let themeStyles = "";
            let iconColor = "";

            if (toast.type === "success") {
              IconComponent = CheckCircle2;
              themeStyles = theme === "light" 
                ? "bg-emerald-50 border-emerald-200/80 text-emerald-900 shadow-emerald-100/40" 
                : "bg-emerald-950/95 border-emerald-500/20 text-emerald-100 shadow-black/40";
              iconColor = "text-emerald-500";
            } else if (toast.type === "error") {
              IconComponent = AlertCircle;
              themeStyles = theme === "light" 
                ? "bg-rose-50 border-rose-200/80 text-rose-900 shadow-rose-100/40" 
                : "bg-rose-950/95 border-rose-500/20 text-rose-100 shadow-black/40";
              iconColor = "text-rose-500";
            } else if (toast.type === "warning") {
              IconComponent = AlertTriangle;
              themeStyles = theme === "light" 
                ? "bg-amber-50 border-amber-200/80 text-amber-900 shadow-amber-100/40" 
                : "bg-amber-950/95 border-amber-500/20 text-amber-100 shadow-black/40";
              iconColor = "text-amber-500";
            } else {
              IconComponent = Info;
              themeStyles = theme === "light" 
                ? "bg-slate-50 border-slate-200/80 text-slate-900 shadow-slate-100/40" 
                : "bg-slate-900/95 border-slate-700/55 text-slate-100 shadow-black/40";
              iconColor = "text-gold";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-2 backdrop-blur-md shadow-lg ${themeStyles}`}
                id={`toast-${toast.id}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                  <IconComponent size={20} />
                </div>
                <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded-lg hover:bg-slate-500/10 cursor-pointer"
                  aria-label="Close notification"
                  id={`close-toast-${toast.id}`}
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
