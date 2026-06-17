/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Sun, Moon, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface NavbarProps {
  activePage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, theme, setTheme, t } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? theme === "light"
            ? "bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-md py-3 text-slate-900"
            : "bg-[#020617]/85 backdrop-blur-md border-b border-[#1e293b] shadow-xl py-3 text-white"
          : theme === "light"
            ? "bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/40 py-4 text-slate-900"
            : "bg-navy-dark/90 backdrop-blur-sm border-b border-white/5 py-4 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Custom brand */}
        <a href="#accueil" className={`flex items-center gap-2 border px-3.5 py-1.5 rounded-2xl backdrop-blur-md transition-all duration-300 group ${
          theme === "light" 
            ? "bg-slate-100 border-slate-200/80 hover:border-gold/40" 
            : "bg-white/5 border-white/5 hover:border-gold/20"
        }`}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-[#3b82f6] shadow-[0_0_15px_rgba(251,191,36,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-500 shrink-0">
            {/* Elegant Firefly/Luciole Emblem SVG */}
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-slate-950 animate-pulse" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Glowing bulb/abdomen */}
              <circle cx="12" cy="15" r="3" fill="#fbbf24" stroke="#fbbf24" />
              {/* Antennae */}
              <path d="M10 3c0 .5-.5 1-1 1s-1-.5-1-1" stroke="#fbbf24" />
              <path d="M14 3c0 .5.5 1 1 1s1-.5 1-1" stroke="#fbbf24" />
              {/* Head */}
              <circle cx="12" cy="7" r="1.5" fill="#f8fafc" />
              {/* Body */}
              <path d="M12 8.5v3.5" stroke="#f8fafc" strokeWidth="2.5" />
              {/* Transparent delicate wings */}
              <path d="M11 10 Q 5 7, 6 12 Q 11 11, 12 11" fill="rgba(255,255,255,0.15)" stroke="#60a5fa" strokeWidth="1" />
              <path d="M13 10 Q 19 7, 18 12 Q 13 11, 12 11" fill="rgba(255,255,255,0.15)" stroke="#60a5fa" strokeWidth="1" />
            </svg>
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-400 to-[#3b82f6] rounded-xl blur opacity-35 group-hover:opacity-70 transition duration-500" />
          </div>
          <div className="flex flex-col">
            <span className={`font-display font-black text-lg leading-none tracking-tight group-hover:text-gold transition ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              Luciole
            </span>
            <span className="font-display font-medium text-[9px] tracking-[0.25em] text-amber-500 group-hover:text-amber-400 uppercase leading-normal mt-0.5">
              SERVICES
            </span>
          </div>
        </a>

        {/* Navigation Items - Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <ul className="flex items-center gap-8 list-none m-0 p-0">
            {[
              { label: t("nav.home"), href: "#accueil", page: "accueil" },
              { label: t("nav.services"), href: "#services", page: "services" },
              { label: t("nav.works"), href: "#realisations", page: "realisations" },
              { label: t("nav.audio"), href: "#vocal-studio", page: "vocal-studio" },
              { label: t("nav.estimator"), href: "#estimator", page: "estimator" },
              { label: t("nav.client"), href: "#espace-client", page: "espace-client" },
              { label: t("nav.about"), href: "#apropos", page: "apropos" },
            ].map((link) => {
              const isActive = activePage === link.page;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`font-semibold text-sm transition-all duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 hover:after:w-full ${
                      isActive 
                        ? "text-gold after:w-full font-bold" 
                        : theme === "light" 
                          ? "text-slate-700 hover:text-gold after:w-0" 
                          : "text-white/90 hover:text-gold-light after:w-0"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* CTA action, Theme, and Language selectors */}
        <div className="hidden md:flex items-center gap-4">
          {/* Client Connection status indicator */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <a 
                href="#espace-client"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  theme === "light" || activePage === "espace-client"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:bg-amber-500/20"
                    : "bg-gold/15 border-gold/30 text-gold-light hover:bg-gold/25"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
                <span className="max-w-[124px] truncate">{currentUser.displayName || currentUser.email?.split("@")[0] || "Mon Espace"}</span>
              </a>
              <button
                onClick={handleSignOut}
                title={language === "fr" ? "Se Déconnecter" : "Sign Out"}
                className={`p-2 rounded-xl border transition duration-300 cursor-pointer ${
                  theme === "light"
                    ? "bg-red-50 hover:bg-red-100 text-red-500 border-red-200"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                }`}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <a
              href="#espace-client"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-wide transition-all ${
                activePage === "espace-client"
                  ? "bg-gold text-slate-950 border-gold shadow-md"
                  : theme === "light"
                    ? "bg-white text-slate-800 border-slate-205 hover:border-gold hover:text-gold shadow-sm"
                    : "bg-white/5 text-white border-white/10 hover:border-gold/30 hover:text-gold-light"
              }`}
            >
              <LogIn size={13} className={activePage === "espace-client" ? "text-slate-950 shrink-0" : "text-gold shrink-0 animate-pulse"} />
              <span>{language === "fr" ? "🔐 Connexion Client" : "🔐 Partner Area"}</span>
            </a>
          )}

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-xl transition duration-300 cursor-pointer border ${
              theme === "light"
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-205"
                : "bg-white/5 hover:bg-white/10 text-white border-white/5 hover:border-gold/30"
            }`}
            title={theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            aria-label="Theme switcher"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Lang switcher */}
          <div className={`flex p-1 rounded-xl border text-xs font-bold leading-none ${
            theme === "light" 
              ? "bg-slate-100 border-slate-205" 
              : "bg-white/5 border-white/5"
          }`}>
            <button
              onClick={() => setLanguage("fr")}
              className={`px-2 py-1 rounded-lg transition duration-200 cursor-pointer text-[10px] ${
                language === "fr" 
                  ? "bg-gold text-slate-950 font-extrabold" 
                  : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 rounded-lg transition duration-200 cursor-pointer text-[10px] ${
                language === "en" 
                  ? "bg-gold text-slate-950 font-extrabold" 
                  : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <a
            href="#nouveau-projet"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 ${
              activePage === "nouveau-projet"
                ? "bg-white border-2 border-gold text-gold"
                : "bg-gold hover:bg-gold-light text-white shadow-gold/25"
            }`}
          >
            {t("nav.new_project")}
            <ArrowRight size={12} />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            theme === "light" ? "text-slate-800 hover:bg-slate-100" : "text-white hover:bg-white/5"
          }`}
          aria-label="Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {isOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 border-b shadow-2xl z-50 animate-fadeUp ${
          theme === "light" 
            ? "bg-white/98 border-slate-200 text-slate-900" 
            : "bg-[#020617]/95 border-[#1e293b] text-white"
        }`}>
          <nav className="flex flex-col p-6 gap-4">
            {[
              { label: t("nav.home"), href: "#accueil", page: "accueil" },
              { label: t("nav.services"), href: "#services", page: "services" },
              { label: t("nav.works"), href: "#realisations", page: "realisations" },
              { label: t("nav.audio"), href: "#vocal-studio", page: "vocal-studio" },
              { label: t("nav.estimator"), href: "#estimator", page: "estimator" },
              { label: t("nav.client"), href: "#espace-client", page: "espace-client" },
              { label: t("nav.about"), href: "#apropos", page: "apropos" },
              { label: t("nav.new_project"), href: "#nouveau-projet", page: "nouveau-projet" },
            ].map((link) => {
              const isActive = activePage === link.page;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`font-bold text-base border-b transition-colors py-2 flex items-center justify-between ${
                    isActive
                      ? "text-gold border-gold/40"
                      : theme === "light" 
                        ? "border-slate-100 text-slate-800 hover:text-gold" 
                        : "border-[#1e293b] text-white/95 hover:text-gold"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </a>
              );
            })}

            {/* Theme and lang switcher for mobile */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{theme === "light" ? "Mode Clair" : "Mode Sombre"}:</span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`p-2 rounded-xl transition cursor-pointer border ${
                    theme === "light" ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/5"
                  }`}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Lang:</span>
                <div className={`flex p-0.5 rounded-lg border text-xs font-bold leading-none ${
                  theme === "light" ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/5"
                }`}>
                  <button
                    onClick={() => setLanguage("fr")}
                    className={`px-2 py-1 rounded-md text-[10px] ${
                      language === "fr" ? "bg-gold text-slate-950 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-2 py-1 rounded-md text-[10px] ${
                      language === "en" ? "bg-gold text-slate-950 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Auth row indicator */}
            <div className="border-t border-dashed border-slate-500/20 pt-4 flex flex-col gap-2.5">
              {currentUser ? (
                <div className="flex items-center justify-between gap-4">
                  <a 
                    href="#espace-client"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-sm font-extrabold text-gold hover:text-gold-light"
                  >
                    <UserIcon size={16} />
                    <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                  </a>
                  <button
                    onClick={() => { setIsOpen(false); handleSignOut(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/10"
                  >
                    <LogOut size={13} />
                    <span>{language === "fr" ? "Quitter" : "Exit"}</span>
                  </button>
                </div>
              ) : (
                <a
                  href="#espace-client"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold tracking-wide transition-all ${
                    theme === "light"
                      ? "bg-slate-50 text-slate-850 hover:bg-slate-100 border-slate-205"
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  }`}
                >
                  <LogIn size={15} className="text-gold" />
                  <span>{language === "fr" ? "Connexion Client" : "Client Portal"}</span>
                </a>
              )}
            </div>

            <a
              href="#nouveau-projet"
              onClick={() => setIsOpen(false)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-gold hover:bg-gold-light text-slate-950 font-extrabold rounded-xl transition cursor-pointer text-center"
            >
              <span>{t("nav.start_project")}</span>
              <ArrowRight size={16} />
            </a>
          </nav>
        </div>
      )}

      {showSignOutConfirm && (
        <div id="signout-confirm-modal" className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-6 rounded-2xl border transition-all ${
            theme === "light"
              ? "bg-white border-slate-200 text-slate-900 shadow-xl"
              : "bg-slate-900 border-white/5 text-white shadow-2xl"
          }`}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {language === "fr" ? "Confirmez la déconnexion" : "Confirm Sign Out"}
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  {language === "fr" 
                    ? "Êtes-vous sûr de vouloir vous déconnecter de votre espace client ?" 
                    : "Are you sure you want to sign out from your client space?"}
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  id="confirm-signout-no"
                  onClick={() => setShowSignOutConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-250"
                      : "bg-white/5 hover:bg-white/10 text-slate-200 border-white/10"
                  }`}
                >
                  {language === "fr" ? "Non, rester" : "No, cancel"}
                </button>
                <button
                  id="confirm-signout-yes"
                  onClick={async () => {
                    setShowSignOutConfirm(false);
                    await executeSignOut();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {language === "fr" ? "Oui, se déconnecter" : "Yes, sign out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
