/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { formatCurrency } from "../utils";
import { Calculator, MessageSquare, ShieldCheck, CheckCircle, Mail, AlertCircle, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { doc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";

type ProjectType = "vitrine" | "ecommerce" | "mobile" | "design" | "pub-spot";

export const ProjectEstimator: React.FC = () => {
  const { theme, language, t, showToast } = useApp();
  const [projectType, setProjectType] = useState<ProjectType>("vitrine");
  const [languages, setLanguages] = useState<number>(1);
  const [supportMonths, setSupportMonths] = useState<number>(3);
  const [hasVoiceOff, setHasVoiceOff] = useState<boolean>(false);
  const [hasJingle, setHasJingle] = useState<boolean>(false);
  const [currency, setCurrency] = useState<"EUR" | "XAF">("XAF");

  // Estimation submission form state variables
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom pricing matrix (in XAF / we map to EUR at fixed exchange rate 655.957)
  const basePrices: Record<ProjectType, number> = {
    vitrine: 250000,   // ~380 EUR
    ecommerce: 500000, // ~760 EUR
    mobile: 900000,    // ~1370 EUR
    "pub-spot": 150000,  // ~230 EUR
    design: 100000,    // ~150 EUR
  };

  const calculatedTotal = useMemo(() => {
    let priceXaf = basePrices[projectType];

    // Language multiplier
    if (languages > 1) {
      priceXaf += (languages - 1) * 60000;
    }

    // Support duration pricing
    if (supportMonths === 3) priceXaf += 45000;
    if (supportMonths === 12) priceXaf += 150000;

    // Optional Audio packs
    if (hasVoiceOff) priceXaf += 75000;
    if (hasJingle) priceXaf += 50000;

    return priceXaf;
  }, [projectType, languages, supportMonths, hasVoiceOff, hasJingle]);

  const outputTotal = useMemo(() => {
    if (currency === "EUR") {
      return calculatedTotal / 655.957; // CFA franc is pegged strictly to Euro at 655.957
    }
    return calculatedTotal;
  }, [calculatedTotal, currency]);

  // Generate dynamic Whatsapp link composition
  const whatsAppLink = useMemo(() => {
    const line = "%0A";
    const projectLabel: Record<ProjectType, string> = {
      vitrine: language === "fr" ? "Site Vitrine" : "Showcase Website",
      ecommerce: language === "fr" ? "Site E-Commerce" : "E-Commerce Webshop",
      mobile: language === "fr" ? "Application Mobile (iOS/Android)" : "Mobile App (iOS/Android)",
      design: language === "fr" ? "Design Graphique & Logo" : "Graphic Design & Branding",
      "pub-spot": language === "fr" ? "Spot Publicitaire & Audiovisuel" : "Commercial Video Advertisement",
    };

    const text = language === "fr"
      ? `Bonjour Luciole Services ! 👋${line}${line}` +
        `Je viens de simuler un projet sur votre site internet et j'aimerais commander un devis officiel.${line}${line}` +
        `📋 *DÉTAILS DU PROJET* :${line}` +
        `• *Type de Projet* : ${projectLabel[projectType]}${line}` +
        `• *Langues requises* : ${languages}${line}` +
        `• *Maintenance Technique* : ${supportMonths === 0 ? "Sans option" : `${supportMonths} mois`}${line}` +
        `• *Option Voix-Off* : ${hasVoiceOff ? "Oui" : "Non"}${line}` +
        `• *Option Jingle Audio* : ${hasJingle ? "Oui" : "Non"}${line}${line}` +
        `💰 *Estimation Tarifaire* : ~${formatCurrency(outputTotal, currency)}${line}${line}` +
        `Merci de me recontacter pour lancer le cahier des charges !`
      : `Hello Luciole Services ! 👋${line}${line}` +
        `I just configured a project setup on your website and would like to order an official quotation.${line}${line}` +
        `📋 *PROJECT DETAILS* :${line}` +
        `• *Project Type* : ${projectLabel[projectType]}${line}` +
        `• *Languages Required* : ${languages}${line}` +
        `• *Tech Maintenance* : ${supportMonths === 0 ? "None" : `${supportMonths} months`}${line}` +
        `• *Voiceover Option* : ${hasVoiceOff ? "Yes" : "No"}${line}` +
        `• *Audio Jingle Option* : ${hasJingle ? "Yes" : "No"}${line}${line}` +
        `💰 *Budget Estimate* : ~${formatCurrency(outputTotal, currency)}${line}${line}` +
        `Please contact me back to initiate details!`;

    return `https://wa.me/237699958089?text=${encodeURIComponent(text)}`;
  }, [projectType, languages, supportMonths, hasVoiceOff, hasJingle, currency, outputTotal, language]);

  const handleSubmitEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqPhone) {
      setErrorMessage(language === "fr" ? "Veuillez remplir les champs obligatoires (Nom, Email, Téléphone)" : "Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const projectLabel: Record<ProjectType, string> = {
      vitrine: language === "fr" ? "Site Vitrine" : "Showcase Website",
      ecommerce: language === "fr" ? "Site E-Commerce" : "E-Commerce Webshop",
      mobile: language === "fr" ? "Application Mobile (iOS/Android)" : "Mobile App (iOS/Android)",
      design: language === "fr" ? "Design Graphique & Logo" : "Graphic Design & Branding",
      "pub-spot": language === "fr" ? "Spot Publicitaire & Audiovisuel" : "Commercial Video Advertisement",
    };

    const generatedId = "req_sim_" + Math.random().toString(36).substring(2, 12).toUpperCase();

    const selectedFeaturesList: string[] = [
      projectLabel[projectType],
      `${languages} ${language === "fr" ? "langue(s)" : "language(s)"}`,
      supportMonths === 0 ? "No support" : `${supportMonths} mo. support`
    ];
    if (hasVoiceOff) selectedFeaturesList.push(language === "fr" ? "Voix-Off Studio" : "Voice-over");
    if (hasJingle) selectedFeaturesList.push("Jingle");

    const messageContent = reqMessage.trim() || 
      (language === "fr" 
        ? `Simulation de budget en ligne pour un projet de type : ${projectLabel[projectType]}.` 
        : `Online budget simulation for project type: ${projectLabel[projectType]}.`);

    const requestData: any = {
      id: generatedId,
      name: reqName,
      email: reqEmail,
      phone: reqPhone,
      service: projectLabel[projectType],
      message: messageContent,
      status: "pending",
      createdAt: new Date().toISOString(),
      estimateBudget: outputTotal,
      estimateCurrency: currency,
      estimateFeatures: selectedFeaturesList
    };

    if (auth.currentUser) {
      requestData.userId = auth.currentUser.uid;
    }

    try {
      await setDoc(doc(db, "projectRequests", generatedId), requestData);
      setSubmitSuccess(true);
      showToast(
        language === "fr"
          ? `Votre estimation de projet (${projectLabel[projectType]}) a été enregistrée avec succès !`
          : `Your project estimate (${projectLabel[projectType]}) has been successfully saved!`,
        "success"
      );
    } catch (err: any) {
      console.error("Error saving simulated estimate to firestore:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `projectRequests/${generatedId}`);
      } catch (fErr: any) {
        setErrorMessage(err.message || "Error saving request");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="estimator" className={`py-24 transition-colors duration-300 relative z-30 ${
      theme === "light" ? "bg-slate-50 text-slate-800" : "bg-transparent text-slate-100"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header section info */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {t("estimator.badge")}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {t("estimator.title")}
          </h2>
          <p className={`text-lg leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {t("estimator.desc")}
          </p>
        </div>

        {/* Panel layouts */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 rounded-3xl p-6 sm:p-10 border shadow-xl items-stretch ${
          theme === "light"
            ? "bg-white border-slate-200/80 shadow-slate-100"
            : "bg-[#1e293b]/30 border-white/5 shadow-2xl shadow-black/80 backdrop-blur-md"
        }`}>
          {/* Left panel features selection */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h3 className={`font-display font-bold text-lg flex items-center gap-2 mb-2 ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              <Calculator size={18} className="text-gold" />
              {language === "fr" ? "Configurez vos besoins de service :" : "Configure your project specifications:"}
            </h3>

            {/* Currency selectors */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {t("estimator.currency")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrency("XAF")}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg border cursor-pointer transition ${
                    currency === "XAF"
                      ? "bg-gold border-gold text-white"
                      : theme === "light"
                        ? "bg-slate-100 text-slate-700 border-slate-200 hover:border-gold/30"
                        : "bg-white/5 text-slate-300 border-white/10 hover:border-gold/30 hover:bg-white/10"
                  }`}
                >
                  {language === "fr" ? "Franc CFA (XAF) - Cameroun" : "CFA Franc (XAF) - Cameroon"}
                </button>
                <button
                  onClick={() => setCurrency("EUR")}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg border cursor-pointer transition ${
                    currency === "EUR"
                      ? "bg-gold border-gold text-white"
                      : theme === "light"
                        ? "bg-slate-100 text-slate-700 border-slate-200 hover:border-gold/30"
                        : "bg-white/5 text-slate-300 border-white/10 hover:border-gold/30 hover:bg-white/10"
                  }`}
                >
                  {language === "fr" ? "Euro (€) - International" : "Euro (€) - Worldwide"}
                </button>
              </div>
            </div>

            {/* Type of project choice */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {language === "fr" ? "1. Nature du Projet" : "1. Core Project Type"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "vitrine", label: language === "fr" ? "💻 Site Web Vitrine" : "💻 Corporate Vitrine Site" },
                  { id: "ecommerce", label: language === "fr" ? "🛒 Boutique E-Commerce" : "🛒 E-Commerce Webshop" },
                  { id: "mobile", label: language === "fr" ? "⚡ App Mobile iOS / Android" : "⚡ Mobile App (iOS/Android)" },
                  { id: "pub-spot", label: language === "fr" ? "🎬 Spot Publicitaire Audiovisuel" : "🎬 Commercial Ad Spot" },
                  { id: "design", label: language === "fr" ? "🎨 Logo / Identité Visuelle" : "🎨 Logo / Brand Identity" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setProjectType(type.id as ProjectType)}
                    className={`p-4 rounded-xl font-semibold text-sm text-left border cursor-pointer transition-all ${
                      projectType === type.id
                        ? "bg-gold/15 text-gold border-gold font-bold shadow-sm"
                        : theme === "light"
                          ? "bg-slate-50 text-slate-750 border-slate-250 hover:bg-slate-100"
                          : "bg-[#020617]/40 text-slate-300 border-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language numbers input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === "fr" ? `2. Nombre de langues (${languages})` : `2. Number of languages (${languages})`}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">* Multilinguisme Google SEO</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setLanguages(num)}
                    className={`w-12 h-12 rounded-xl text-sm font-bold border cursor-pointer transition ${
                      languages === num
                        ? "bg-gold text-white border-gold shadow-sm"
                        : theme === "light"
                          ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-205"
                          : "bg-white/5 text-slate-300 border-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {num === 3 ? "3+" : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Support durations checkbox */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {language === "fr" ? "3. Maintenance, Support & Sauvegardes" : "3. Maintenance, Support & Backups"}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: language === "fr" ? "Sans assistance" : "Without monitoring" },
                  { value: 3, label: language === "fr" ? "3 Mois pro (Inclus)" : "3 Mo. standard (Free)" },
                  { value: 12, label: language === "fr" ? "12 Mois sérénité" : "12 Mo. professional care" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSupportMonths(opt.value)}
                    className={`px-5 py-3 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                      supportMonths === opt.value
                        ? "bg-gold border-gold text-white shadow-sm"
                        : theme === "light"
                          ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-205"
                          : "bg-white/5 text-slate-300 border-white/5 hover:border-white/25 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional packs trigger */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === "fr" ? "4. Options Audio & Studio additionnelles" : "4. Additional Audio & Studio addons"}
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setHasVoiceOff(!hasVoiceOff)}
                  className={`flex-1 p-4 rounded-xl border text-sm text-left font-semibold cursor-pointer flex items-center justify-between transition ${
                    hasVoiceOff 
                      ? "bg-gold/15 text-gold border-gold shadow-sm" 
                      : theme === "light"
                        ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span>{language === "fr" ? "🎤 Ajouter une Voix Off Studio" : "🎤 Add Studio Voice-over"}</span>
                  <input
                    type="checkbox"
                    checked={hasVoiceOff}
                    onChange={() => {}}
                    className="accent-gold w-4 h-4 cursor-pointer"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setHasJingle(!hasJingle)}
                  className={`flex-1 p-4 rounded-xl border text-sm text-left font-semibold cursor-pointer flex items-center justify-between transition ${
                    hasJingle 
                      ? "bg-gold/15 text-gold border-gold shadow-sm" 
                      : theme === "light"
                        ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span>{language === "fr" ? "🎵 Signature sonore Brand Jingle" : "🎵 Add Custom Sonic Brand Jingle"}</span>
                  <input
                    type="checkbox"
                    checked={hasJingle}
                    onChange={() => {}}
                    className="accent-gold w-4 h-4 cursor-pointer"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Right panel pricing billing calculator */}
          <div className={`lg:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border relative overflow-hidden shadow-2xl ${
            theme === "light"
              ? "bg-slate-900 border-slate-800 text-white"
              : "bg-[#0f172a] border-white/10 text-white"
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl flex" />

            <div>
              <h4 className="font-display font-medium text-xs text-gold uppercase tracking-widest mb-4">
                {language === "fr" ? "Votre Plan Estimatif" : "Your Plan Details"}
              </h4>

              <div className="space-y-4 mb-8">
                {/* Visual bullet check progress */}
                {[
                  language === "fr" ? "Design UI/UX 100% personnalisé" : "100% Bespoke UI/UX Layouts",
                  language === "fr" ? "Optimisation performance Google PageSpeed" : "Speed and performance SEO structures",
                  language === "fr" ? "Sauvegardes quotidiennes assurées" : "Continuous daily cloud database back-up",
                  language === "fr" ? "Code source complet remis à la fin" : "Total ownership / source code delivery",
                ].map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="text-gold shrink-0" size={16} />
                    <span className="text-xs text-slate-300 font-medium">{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Display dynamic price sum */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                  {language === "fr" ? "Budget estimatif global" : "Total estimated budget"}
                </span>
                <span className="font-display font-black text-3xl sm:text-4xl text-gold-light tracking-tight leading-none block">
                  {formatCurrency(outputTotal, currency)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-2">
                  {language === "fr" 
                    ? "*Taxes & hébergement d'infrastructure par an inclus" 
                    : "*Applicable taxes & cloud virtual machines hosting included"
                  }
                </span>
              </div>
            </div>

            {/* Actions triggers dispatch */}
            <div className="flex flex-col gap-3">
              {!submitSuccess ? (
                <>
                  {!showSubmitForm ? (
                    <>
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl font-bold bg-gold text-slate-950 hover:bg-gold-light transition shadow-lg shadow-gold/25 flex items-center justify-center gap-2 group cursor-pointer text-xs text-center uppercase tracking-wider"
                      >
                        <span>{language === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp"}</span>
                        <MessageSquare size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={() => setShowSubmitForm(true)}
                        className="w-full py-3.5 rounded-xl font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/25 transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        <Mail size={14} />
                        <span>{language === "fr" ? "Enregistrer & Envoyer en Ligne" : "Submit & Register Online"}</span>
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleSubmitEstimate} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-left animate-fadeUp">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                        <span className="text-[10px] font-black uppercase text-gold tracking-widest flex items-center gap-1">
                          <Sparkles size={11} />
                          {language === "fr" ? "Expression de besoin" : "Submit Estimate Info"}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowSubmitForm(false)} 
                          className="text-[10px] text-slate-400 hover:text-white"
                        >
                          {language === "fr" ? "Annuler" : "Cancel"}
                        </button>
                      </div>

                      {errorMessage && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[10px] font-semibold">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          required
                          placeholder={language === "fr" ? "Votre Nom complet *" : "Your Full Name *"}
                          value={reqName}
                          onChange={(e) => setReqName(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          placeholder={language === "fr" ? "Adresse Email *" : "Email Address *"}
                          value={reqEmail}
                          onChange={(e) => setReqEmail(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold"
                        />
                        <input
                          type="text"
                          required
                          placeholder={language === "fr" ? "WhatsApp / Téléphone *" : "Phone Contact *"}
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div>
                        <textarea
                          placeholder={language === "fr" ? "Notes optionnelles (Ex: délais, fonctionnalités spécifiques...)" : "Optional project notes / special adjustments..."}
                          rows={2}
                          value={reqMessage}
                          onChange={(e) => setReqMessage(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 rounded-xl bg-gold text-slate-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-gold-light transition cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>{language === "fr" ? "Envoi..." : "Registering..."}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} />
                            <span>{language === "fr" ? "Valider le Devis" : "Submit Estimate Plan"}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-fadeUp">
                  <CheckCircle size={28} className="text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-400">
                    {language === "fr" ? "Estimation transmise !" : "Simulation registered!"}
                  </p>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
                    {language === "fr" 
                      ? "Votre devis estimateur a été sauvegardé en ligne auprès de l'administrateur sous l'identité : "
                      : "Your simulated estimate is secured in the system database matching: "
                    }
                    <strong className="text-white block font-mono mt-0.5">{reqEmail}</strong>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck size={14} className="text-gold" />
                <span>{language === "fr" ? "Devis final envoyé sous 24h ouvrées." : "Final quote processed within 24 working hours."}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
