/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, Share2, Facebook, Instagram } from "lucide-react";
import { useApp } from "../context/AppContext";
import { doc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";

export const ContactForm: React.FC = () => {
  const { theme, t, language, showToast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const clientServiceLabel = t(`service.${selectedService || "other"}`);
    const generatedId = "req_" + Math.random().toString(36).substring(2, 15).toUpperCase();

    const requestData: any = {
      id: generatedId,
      name,
      email,
      phone,
      service: clientServiceLabel,
      message,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    if (auth.currentUser) {
      requestData.userId = auth.currentUser.uid;
    }

    try {
      await setDoc(doc(db, "projectRequests", generatedId), requestData);
      showToast(
        language === "fr" 
          ? `Votre demande de projet (${clientServiceLabel}) a été transmis !` 
          : `Your project request (${clientServiceLabel}) has been submitted!`,
        "success"
      );
    } catch (err: any) {
      console.error("Error saving project request to firestore:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `projectRequests/${generatedId}`);
      } catch (fErr: any) {
        setErrorMessage(t("common.error") || "Erreur de connexion lors de l'enregistrement.");
      }
    }

    // Construct elegant pre-filled mail fields
    const emailSubject = `Recrutement & Devis - ${name} (${clientServiceLabel})`;
    const emailBody = `Bonjour Luciole Services,\n\n` +
      `Je souhaite recruter vos services pour un projet. Voici mes coordonnées et informations :\n\n` +
      `• Nom complet : ${name}\n` +
      `• Adresse E-mail : ${email}\n` +
      `• Téléphone / Contact : ${phone}\n` +
      `• Service sélectionné : ${clientServiceLabel}\n\n` +
      `• Détails du Projet :\n${message}\n\n` +
      `Cordialement,\n${name}`;

    const mailtoUrl = `mailto:devis@luciole-serves.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Trigger local email client redirection
    window.location.href = mailtoUrl;

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSelectedService("");
    setMessage("");
    setSubmitted(false);
    setErrorMessage(null);
  };

  return (
    <section id="contact" className={`py-24 transition-colors duration-300 ${
      theme === "light" ? "bg-slate-50 text-slate-800" : "bg-transparent text-slate-100"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left panel: company details cards */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between py-2">
            <div>
              <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
                {t("contact.badge")}
              </span>
              <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-4 ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}>
                {t("contact.title")}
              </h2>
              <p className={`text-base leading-relaxed mb-8 ${
                theme === "light" ? "text-slate-600" : "text-slate-400"
              }`}>
                {t("contact.desc")}
              </p>
            </div>

            <div className="space-y-6">
              {/* WhatsApp & Tel Card */}
              <div className={`flex items-center gap-4 group p-4 rounded-2xl border transition-all duration-300 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
              }`}>
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 text-gold group-hover:bg-gold group-hover:text-amber-950 flex items-center justify-center transition duration-300 shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                    {t("contact.phone")}
                  </h4>
                  <a href="https://wa.me/237699958089" target="_blank" rel="noopener noreferrer" className={`text-sm font-extrabold hover:text-gold transition ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    +237 699 95 80 89
                  </a>
                </div>
              </div>

              {/* Direct Mail Config Cards */}
              <div className={`flex gap-4 group items-start p-4 rounded-2xl border transition-all duration-300 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
              }`}>
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 text-gold group-hover:bg-gold group-hover:text-amber-950 flex items-center justify-center transition duration-300 shrink-0 mt-1">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-none mb-2">
                    {t("contact.emails")}
                  </h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-extrabold transition flex items-center gap-1.5">
                      <span className="text-[9px] uppercase bg-gold/15 text-gold px-1.5 py-0.5 rounded font-mono border border-gold/10">Devis</span>
                      <a href="mailto:devis@luciole-serves.com" className={`hover:text-gold transition ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        devis@luciole-serves.com
                      </a>
                    </p>
                    <p className="text-sm font-extrabold transition flex items-center gap-1.5">
                      <span className="text-[9px] uppercase bg-white/10 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono border border-white/5">Support</span>
                      <a href="mailto:support@luciole-serves.com" className={`hover:text-gold transition ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        support@luciole-serves.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className={`flex items-center gap-4 group p-4 rounded-2xl border transition-all duration-300 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
              }`}>
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 text-gold group-hover:bg-gold group-hover:text-amber-950 flex items-center justify-center transition duration-300 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                    {t("contact..location")}
                  </h4>
                  <p className={`text-sm font-extrabold ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    Douala, Cameroun (Afrique Centrale)
                  </p>
                </div>
              </div>

              {/* Social Networks/Channels Card (Strictly Professional, Direct Redirect Logos with Official Branding) */}
              <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
              }`}>
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center transition duration-300 shrink-0 mt-0.5">
                  <Share2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === "fr" ? "Plateformes Officielles" : "Official Platforms"}
                  </h4>
                  <p className={`text-xs font-medium mb-3 ${
                    theme === "light" ? "text-slate-600" : "text-slate-400"
                  }`}>
                    {language === "fr" 
                      ? "Vous pouvez aussi nous suivre sur nos plateformes :" 
                      : "You can also follow us on our platforms:"
                    }
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.facebook.com/share/1AWzpnveXJ/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer bg-[#1877F2]/10 dark:bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:shadow-[0_0_14px_rgba(24,119,242,0.25)]"
                      aria-label="Facebook"
                      id="contact-facebook-btn"
                    >
                      <Facebook size={18} className="fill-current" />
                    </a>
                    <a
                      href="https://www.instagram.com/lucioleservices?igsh=dzZwdGM4MmJwZHE4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer bg-[#E1306C]/10 dark:bg-[#E1306C]/15 text-[#E1306C] border-[#E1306C]/30 hover:bg-[#E1306C]/20 hover:border-[#E1306C]/50 hover:shadow-[0_0_14px_rgba(225,48,108,0.25)]"
                      aria-label="Instagram"
                      id="contact-instagram-btn"
                    >
                      <Instagram size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: custom contact form */}
          <div className="lg:col-span-12 xl:col-span-7">
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className={`backdrop-blur-md rounded-3xl p-6 sm:p-10 border shadow-xl flex flex-col gap-5 h-full justify-between ${
                  theme === "light"
                    ? "bg-white border-slate-200/80 shadow-slate-100"
                    : "bg-[#1e293b]/30 border-white/5 shadow-2xl shadow-black/80"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="client-name" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {t("contact.form_name")}
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Aïcha Ntsama"
                      className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                          : "bg-[#020617]/50 border-white/10 text-white placeholder:text-white/20"
                      }`}
                    />
                  </div>

                  {/* Email address */}
                  <div>
                    <label htmlFor="client-email" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {t("contact.form_email")}
                    </label>
                    <input
                      id="client-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: client@exemple.com"
                      className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                          : "bg-[#020617]/50 border-white/10 text-white placeholder:text-white/20"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Phone number */}
                  <div>
                    <label htmlFor="client-phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {t("contact.form_phone")}
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +237 699 95 80 89"
                      className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                          : "bg-[#020617]/50 border-white/10 text-white placeholder:text-white/20"
                      }`}
                    />
                  </div>

                  {/* Service selection */}
                  <div>
                    <label htmlFor="service-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {t("contact.form_service")}
                    </label>
                    <select
                      id="service-select"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition cursor-pointer ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-800"
                          : "bg-[#020617]/80 border-white/10 text-white"
                      }`}
                    >
                      <option value="" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{theme === "light" ? "Sélectionnez..." : "Sélectionnez..."}</option>
                      <option value="web" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.web")}</option>
                      <option value="app" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.app")}</option>
                      <option value="db" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.db")}</option>
                      <option value="brand" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.brand")}</option>
                      <option value="jingle" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.jingle")}</option>
                      <option value="other" className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-900 text-white"}>{t("service.other")}</option>
                    </select>
                  </div>
                </div>

                {/* Message body */}
                <div>
                  <label htmlFor="client-message" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {t("contact.form_message")}
                  </label>
                  <textarea
                    id="client-message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={theme === "light" ? "Décrivez brièvement vos attentes..." : "Quelles fonctionnalités souhaitez-vous ? Avez-vous un cahier des charges ?"}
                    className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition resize-none h-32 ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                        : "bg-[#020617]/50 border-white/10 text-white placeholder:text-white/20"
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  {t("contact.form_caption")}
                </p>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold bg-gold hover:bg-gold-light text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm font-display uppercase tracking-wider ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {language === "fr" ? "Enregistrement..." : "Sending..."}
                    </span>
                  ) : (
                    <>
                      {t("contact.form_send")}
                      <Send size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className={`border rounded-3xl p-10 h-full flex flex-col items-center justify-center text-center shadow-xl animate-fadeUp ${
                theme === "light" 
                  ? "bg-white border-green-200 shadow-slate-100" 
                  : "bg-[#1e293b]/50 border-green-500/20"
              }`}>
                <CheckCircle2 size={48} className="text-[#34d399] mb-4 animate-bounce" />
                <h3 className={`font-display font-black text-2xl mb-3 ${
                  theme === "light" ? "text-green-600" : "text-green-300"
                }`}>
                  {t("contact.success_title")}
                </h3>
                <p className={`text-sm leading-relaxed max-w-sm mb-8 ${
                  theme === "light" ? "text-slate-700" : "text-slate-200"
                }`}>
                  {t("contact.success_desc").replace("{name}", name).replace("{phone}", phone)}
                </p>
                <div className="flex gap-4 w-full max-w-xs">
                  <button
                    onClick={handleReset}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition duration-150 border cursor-pointer ${
                      theme === "light"
                        ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                        : "bg-white/5 text-white hover:bg-white/10 border-white/10"
                    }`}
                  >
                    {t("contact.new_msg")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
