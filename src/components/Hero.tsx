/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  TeamIllustration,
  CoderIllustration,
  WebCreationIllustration,
  AudioRecordingIllustration,
} from "./Illustrations";

export const Hero: React.FC = () => {
  const { theme, language, t } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const factor = 12; // maximum degree tilt of rotation
    setRotate({
      x: -(y / (box.height / 2)) * factor,
      y: (x / (box.width / 2)) * factor,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const slides = [
    {
      tag: t("hero.tag1"),
      title: t("hero.slide1_title"),
      image: "/images/corporate_team_vector_1781529512565.jpg",
      Illustration: TeamIllustration,
    },
    {
      tag: t("hero.tag2"),
      title: t("hero.slide2_title"),
      image: "/images/phone_productivity_vector_1781529525196.jpg",
      Illustration: CoderIllustration,
    },
    {
      tag: t("hero.tag3"),
      title: t("hero.slide3_title"),
      image: "/images/coding_database_vector_1781529539964.jpg",
      Illustration: WebCreationIllustration,
    },
    {
      tag: t("hero.tag4"),
      title: t("hero.slide4_title"),
      image: "/images/vocal_studio_vector_1781529554333.jpg",
      Illustration: AudioRecordingIllustration,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section
      id="accueil"
      className={`relative min-h-[95vh] flex items-center pt-24 overflow-hidden transition-colors duration-300 ${
        theme === "light"
          ? "bg-gradient-to-br from-[#f1f5f9] via-slate-50 to-white text-slate-900"
          : "bg-gradient-to-br from-navy-dark via-[#081318] to-black text-white"
      }`}
    >
      {/* Luciole dynamic particles */}
      <div className="absolute inset-0 pointer-events-none select-none z-1 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          const size = Math.random() * 4 + 2;
          const left = Math.random() * 100;
          const delay = Math.random() * 8;
          const duration = Math.random() * 12 + 8;
          return (
            <div
              key={i}
              className={`absolute rounded-full animate-pulse-slow ${
                theme === "light" 
                  ? "bg-amber-500/30 shadow-[0_0_8px_1px_rgba(245,158,11,0.3)]" 
                  : "bg-gold-light/40 shadow-[0_0_10px_2px_rgba(96,165,250,0.4)]"
              }`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: "-20px",
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full py-12">
        {/* Left column info text */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 animate-pulse ${
            theme === "light" 
              ? "bg-amber-500/15 border-amber-500/30 text-amber-700" 
              : "bg-gold/10 border-gold/20 text-gold-light"
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("hero.tag")}
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
            {language === "fr" ? (
              <>
                Donnez de l'éclat à vos idées avec{" "}
                <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-[#3b82f6] bg-clip-text text-transparent">
                  Luciole Services
                </span>
              </>
            ) : (
              <>
                Bring your projects to life with{" "}
                <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-[#3b82f6] bg-clip-text text-transparent">
                  Luciole Services
                </span>
              </>
            )}
          </h1>

          <p className={`text-lg sm:text-xl leading-relaxed mb-8 max-w-xl ${
            theme === "light" ? "text-slate-600" : "text-gray-300"
          }`}>
            {t("hero.desc")}
          </p>

          <div className="flex flex-wrap gap-4 w-full sm:w-auto z-10 relative">
            <a
              href="#nouveau-projet"
              className="px-8 py-4 rounded-xl font-bold bg-gold text-white hover:bg-gold-light transition shadow-lg shadow-gold/25 flex items-center gap-2 group w-full sm:w-auto justify-center cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {language === "fr" ? "Lancer un Nouveau Projet" : "Start a New Project"}
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition" />
            </a>
            <a
              href="#espace-client"
              className={`px-8 py-4 rounded-xl font-bold border-2 transition w-full sm:w-auto justify-center text-center inline-block cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                theme === "light"
                  ? "border-slate-300 hover:border-gold hover:bg-slate-50 text-slate-800"
                  : "border-white/20 hover:border-gold hover:bg-white/5 text-white"
              }`}
            >
              {language === "fr" ? "Connexion / S'inscrire" : "Sign In / Register"}
            </a>
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-2 flex-wrap animate-pulse">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              {language === "fr" 
                ? "Cliquez sur « Nouveau Projet » pour une étude gratuite ou créez votre compte client pour débuter !" 
                : "Click 'New Project' for a free feasibility report or sign up to begin!"
              }
            </span>
          </p>
        </div>

        {/* Right Column illustration carousel with interactive 3D Tilt */}
        <div className="lg:col-span-5 w-full">
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              transform: rotate.x || rotate.y ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.025, 1.025, 1.025)` : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)", 
              transition: rotate.x || rotate.y ? "none" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
              transformStyle: "preserve-3d"
            }}
            className={`group relative rounded-3xl overflow-hidden border shadow-2xl aspect-video sm:aspect-square md:aspect-video lg:aspect-square flex items-center justify-center transition-all duration-300 transform-gpu ${
              theme === "light"
                ? "bg-slate-100 border-slate-200/80 shadow-slate-200"
                : "bg-navy-dark/[0.5] border-white/10 shadow-black/80 backdrop-blur-md"
            }`}
          >
            {slides.map((slide, index) => {
              const ActiveIllustration = slide.Illustration;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 flex flex-col ${
                    index === currentSlide
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="relative w-full h-[85%] overflow-hidden bg-slate-950 flex items-center justify-center" style={{ transform: "translateZ(30px)" }}>
                    {slide.image ? (
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ActiveIllustration />
                    )}
                    {/* Glossy 3D glass shine and light trails */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
                    <div className="absolute -inset-x-20 top-0 h-12 bg-gradient-to-b from-white/10 to-transparent skew-y-12 pointer-events-none animate-pulse" />
                    <div className="absolute top-4 left-4 px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase text-amber-400 bg-black/60 border border-amber-400/20 rounded-md backdrop-blur-md">
                      3D Showcase Live
                    </div>
                  </div>
                  <div className="bg-[#020617]/95 p-5 border-t border-white/5 flex items-center justify-between text-left h-[15%]" style={{ transform: "translateZ(10px)" }}>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        {slide.tag}
                      </span>
                      <h3 className="text-sm font-semibold text-white/95 truncate">
                        {slide.title}
                      </h3>
                    </div>
 
                    {/* Slides direction trigger */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
                        }
                        className="p-1 px-1.5 rounded-full bg-white/5 hover:bg-white/15 transition cursor-pointer text-white"
                        aria-label="Previous"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                        className="p-1 px-1.5 rounded-full bg-white/5 hover:bg-white/15 transition cursor-pointer text-white"
                        aria-label="Next"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>        
        </div>

        {/* Dots tracker bar */}
        <div className="lg:col-span-12 flex items-center justify-center gap-2 mt-4 relative z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentSlide ? "w-6 bg-gold" : "w-2 bg-white/30"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
