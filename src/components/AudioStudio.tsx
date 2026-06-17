/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { VOICE_PROFILES, MOCK_SOUND_EFFECTS } from "../data";
import { VoiceProfile, SoundEffect } from "../types";
import { speakText, playSynthTone } from "../utils";
import { Mic, Play, Square, Volume2, Music, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";

const AUDIO_TRANSLATIONS: Record<string, {
  name: Record<string, string>;
  description: Record<string, string>;
  sampleText: Record<string, string>;
}> = {
  "voice-1": {
    name: { fr: "Arthur - Le Narrateur", en: "Arthur - The Narrator" },
    description: {
      fr: "Une voix masculine grave, posée et texturée. Présentation parfaite pour les documentaires historiques, les formations e-learning rigoureuses ou la narration de marque haut de gamme.",
      en: "A deep, warm, textured male voice. Outstanding for corporate documentaries, extensive e-learning programs, or premium branding."
    },
    sampleText: {
      fr: "Bienvenue chez Luciole Services. Nous concevons votre écosystème digital sur-mesure pour donner à votre entreprise l'élégance et la puissance qu'elles méritent.",
      en: "Welcome to Luciole Services. We engineer your tailored digital workspace to endow your enterprise with the absolute elegance and power it commands."
    }
  },
  "voice-2": {
    name: { fr: "Chloé - L'Énergique", en: "Chloé - The Energetic" },
    description: {
      fr: "Une voix de femme fraîche, souriante et très dynamique. Idéale pour les lancements d'applications mobiles, les spots publicitaires radio percutants et les intros de podcasts.",
      en: "A fresh, smiling, highly engaging female voice. Optimized for launching mobile features, fast radio bulletins, and podcast announcements."
    },
    sampleText: {
      fr: "Hop ! Besoin d’une application sur-mesure qui booste vos ventes ? Avec Luciole-services, donnez un coup d'accélérateur géant à votre business dès aujourd'hui !",
      en: "Hey! Looking for a custom app flow to skyrocket your sales? With Luciole Services, turbocharge your local business right now!"
    }
  },
  "voice-3": {
    name: { fr: "Thomas - Le Visionnaire Professional", en: "Thomas - Corporate Visionary" },
    description: {
      fr: "Une voix jeune d'homme d'affaires, calme, moderne et teintée d'assurance. Idéal pour les vidéos de présentation de startups technologiques, de démos d'APIs et de bases de données.",
      en: "Young entrepreneur tone, calm, modern and highly confident. Excellent for tech startup demos, web API presentations, and database schema diagrams."
    },
    sampleText: {
      fr: "Explorez une nouvelle dimension de performance avec notre gestionnaire de bases de données. Structuré pour durer, conçu pour scaler sans limite.",
      en: "Step into a new dimension of cloud efficiency with our custom server stack models. Purposefully scaled for infinite database lookups."
    }
  },
  "voice-4": {
    name: { fr: "Léa - La Chaleureuse", en: "Léa - Cozy and Welcoming" },
    description: {
      fr: "Une voix féminine douce, rassurante et professionnelle. Convient idéalement aux vidéos médicales, aux tutoriels guidés ou à la voix d'accueil interactive de votre standard téléphonique.",
      en: "Soft, reassuring and reassuringly expert female delivery. Great for telemedicine tutorials, helpful walkthroughs, or phone standard greeting messages."
    },
    sampleText: {
      fr: "Chez Luciole-services, nous prenons soin de votre image de marque. Discutez dès aujourd'hui avec l'un de nos conseillers disponibles sur WhatsApp.",
      en: "At Luciole Services, your corporate image is our pristine task. Tap here to chat on WhatsApp with our available desk specialists."
    }
  }
};

export const AudioStudio: React.FC = () => {
  const { theme, language, t } = useApp();
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [customText, setCustomText] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [mixerVolume, setMixerVolume] = useState<number>(70);

  // Synchronise translated text when selected voice or language changes
  useEffect(() => {
    const translation = AUDIO_TRANSLATIONS[selectedVoice.id];
    if (translation) {
      setCustomText(translation.sampleText[language]);
    } else {
      setCustomText(selectedVoice.sampleText);
    }
  }, [selectedVoice, language]);

  const handleVoiceChange = (voice: VoiceProfile) => {
    setSelectedVoice(voice);
  };

  const handleSpeak = () => {
    setIsSpeaking(true);
    speakText(customText, selectedVoice.gender === "femme");
    // Simulate end of speaking after safe duration
    const durationCount = Math.max(1500, customText.length * 68);
    const speaksTimeout = setTimeout(() => {
      setIsSpeaking(false);
    }, durationCount);
    return () => clearTimeout(speaksTimeout);
  };

  const handleStopSpeaking = () => {
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    setIsSpeaking(false);
  };

  const triggerSfxSynth = (sfx: SoundEffect) => {
    playSynthTone(sfx.frequency, sfx.type, sfx.duration);
  };

  const getLocalizedVoice = (voice: VoiceProfile) => {
    const backup = {
      name: voice.name,
      description: voice.description,
      tone: voice.tone
    };
    const trans = AUDIO_TRANSLATIONS[voice.id];
    if (!trans) return backup;
    return {
      name: trans.name[language] || backup.name,
      description: trans.description[language] || backup.description,
      tone: voice.tone
    };
  };

  return (
    <section id="vocal-studio" className={`py-24 transition-colors duration-300 relative overflow-hidden ${
      theme === "light" ? "bg-slate-50 text-slate-800" : "bg-transparent text-white"
    }`}>
      {/* Decorative backdrop graphics */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-light/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {t("audio.badge")}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {t("audio.title")}
          </h2>
          <p className={`text-lg leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {t("audio.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left panel: Voice profiles list selector */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4">
            <h3 className={`font-display font-bold text-lg mb-2 flex items-center gap-2 ${
              theme === "light" ? "text-slate-900" : "text-white/95"
            }`}>
              <Mic size={18} className="text-gold" />
              {language === "fr" ? "Nos Talents Vocaux" : "Our Voice Over Talents"}
            </h3>

            {VOICE_PROFILES.map((voice) => {
              const localVoice = getLocalizedVoice(voice);
              const isSelected = selectedVoice.id === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice)}
                  className={`w-full p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? "bg-gold/15 text-gold border-gold shadow-xl shadow-gold/10"
                      : theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/25 text-gold px-2.5 py-0.5 rounded-full">
                        {voice.gender === "homme" 
                          ? (language === "fr" ? "Voix Homme" : "Male Voice") 
                          : (language === "fr" ? "Voix Femme" : "Female Voice")
                        }
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{localVoice.tone}</span>
                    </div>
                    <h4 className="font-display font-black text-md truncate">{localVoice.name}</h4>
                    <p className={`text-xs mt-1 leading-normal line-clamp-2 ${
                      isSelected 
                        ? (theme === "light" ? "text-slate-700" : "text-slate-100") 
                        : "text-slate-400"
                    }`}>
                      {localVoice.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right panel: Synthesizer playground console */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-slate-100"
                : "bg-[#1e293b]/30 border-white/5 shadow-black/80 backdrop-blur-md"
            }`}>
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center text-lg animate-pulse">
                    🎤
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${
                      theme === "light" ? "text-slate-900" : "text-white/95"
                    }`}>
                      {language === "fr" ? "Studio Cabine active" : "Live Recording Mic"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {language === "fr" ? "Prêt pour l'enregistrement" : "Acoustic room online"}
                    </p>
                  </div>
                </div>

                {/* Simulated waveforms indicator */}
                {isSpeaking && (
                  <div className="flex items-end gap-1 h-6" aria-hidden="true">
                    {[16, 24, 12, 28, 16, 24, 14, 20].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gold rounded-full animate-pulse-slow"
                        style={{
                          height: `${h}px`,
                          animationDuration: `${0.4 + i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Text Area field */}
              <div className="relative mb-6">
                <span className="absolute top-[3px] left-4 text-[9px] font-bold text-gold uppercase tracking-wider">
                  {t("audio.sample_text")}
                </span>
                <textarea
                  id="voice-textarea"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={180}
                  className={`w-full border rounded-2xl px-5 pb-5 pt-8 text-sm focus:outline-none focus:border-gold resize-none h-28 ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                      : "bg-[#020617]/50 border-white/10 text-white placeholder:text-white/20"
                  }`}
                  placeholder={language === "fr" ? "Écrivez le message publicitaire..." : "Write custom advertisement script..."}
                />
                <span className="absolute bottom-2.5 right-4 text-[10px] text-slate-500 font-semibold">
                  {customText.length}/180 {language === "fr" ? "caractères" : "characters"}
                </span>
              </div>

              {/* Console Trigger buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                {!isSpeaking ? (
                  <button
                    onClick={handleSpeak}
                    disabled={!customText.trim()}
                    className="flex-1 py-4 px-6 rounded-xl font-bold bg-gold text-white hover:bg-gold-light transition duration-150 shadow-lg shadow-gold/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Play size={16} /> {t("audio.hear")}
                  </button>
                ) : (
                  <button
                    onClick={handleStopSpeaking}
                    className="flex-1 py-4 px-6 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition duration-150 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Square size={16} /> {language === "fr" ? "Arrêter la lecture" : "Stop listening"}
                  </button>
                )}
              </div>

              {/* Sound Board Mixing tray fallback */}
              <div className="border-t border-white/5 pt-6">
                <h4 className={`font-display font-medium text-xs uppercase tracking-widest mb-4 flex items-center gap-2 ${
                  theme === "light" ? "text-slate-700" : "text-white/80"
                }`}>
                  <Music size={14} className="text-gold" />
                  {t("audio.interactive_fx")}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {MOCK_SOUND_EFFECTS.map((sfx) => (
                    <button
                      key={sfx.id}
                      onClick={() => triggerSfxSynth(sfx)}
                      className={`px-4 py-3 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer border ${
                        theme === "light"
                          ? "bg-slate-100 hover:bg-gold/10 hover:text-gold border-slate-200 text-slate-700"
                          : "bg-white/5 hover:bg-gold/15 hover:text-gold border-white/10 text-white hover:border-gold/30"
                      }`}
                    >
                      <span className="text-sm">{sfx.emoji}</span>
                      {sfx.name}
                    </button>
                  ))}
                </div>

                {/* Slider volume parameters */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                  theme === "light" ? "bg-slate-100 border-slate-205" : "bg-navy-dark/[0.5] border-white/5"
                }`}>
                  <Volume2 size={16} className="text-gray-400" />
                  <div className="flex-1 select-none">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                      {language === "fr" 
                        ? `Volume de monitoring studio (${mixerVolume}%)` 
                        : `Vocal monitoring feedback volume (${mixerVolume}%)`
                      }
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mixerVolume}
                      onChange={(e) => setMixerVolume(+e.target.value)}
                      className="w-full accent-gold h-1 rounded-lg cursor-pointer bg-slate-350"
                      aria-label="Volume Level"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[#8D6e63]">
                    <span className="w-2 h-2 rounded-full bg-[#8D6e63] shrink-0" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dolby Atmos</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Disclaimer for full-fidelity and production */}
            <div className="flex items-start gap-3 bg-gold/10 p-5 rounded-2xl border border-gold/15">
              <CheckCircle2 size={18} className="text-gold shrink-0 mt-0.5" />
              <p className={`text-xs leading-normal ${
                theme === "light" ? "text-slate-600" : "text-gray-300"
              }`}>
                {language === "fr" ? (
                  <><strong>Pack Jingle complet :</strong> Comprend l'écriture, le recrutement du comédien parmi notre réseau national, le nettoyage stéréophonique, et la masterisation audio finale. Un chef d'œuvre prêt à la diffusion radio-télévision ou internet.</>
                ) : (
                  <><strong>Complete Jingle Suite:</strong> Comprises custom scriptwriting, recruitment of first-rate artists within Cameroon, stereo cleanup tracks, and master acoustic delivery. Ready for television broadcast or online feeds.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
