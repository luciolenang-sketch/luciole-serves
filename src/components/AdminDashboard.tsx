/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Mail, User, Phone, Calendar, DollarSign, Check, X, 
  Trash2, Archive, Briefcase, Clock, Search, CheckCircle2, 
  AlertCircle, ExternalLink, Inbox, MessageSquare, Filter, Layers, Bell
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { formatCurrency } from "../utils";
import { ClientProject, ClientInvoice } from "./ClientDashboard";

export interface ProjectRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: "pending" | "reviewed" | "accepted" | "rejected" | "archived";
  createdAt: string;
  userId?: string;
  estimateBudget?: number;
  estimateCurrency?: string;
  estimateFeatures?: string[];
}

interface AdminDashboardProps {
  theme: "light" | "dark";
  language: "fr" | "en";
  allUsers: any[];
  requests: ProjectRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ProjectRequest[]>>;
  loading: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  theme,
  language,
  allUsers,
  requests,
  setRequests,
  loading
}) => {
  const [filteredRequests, setFilteredRequests] = useState<ProjectRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);

  // Operation feedback states
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Conversion process state
  const [convertingRequest, setConvertingRequest] = useState<ProjectRequest | null>(null);
  const [convertTargetUserId, setConvertTargetUserId] = useState("");
  const [convertTitle, setConvertTitle] = useState("");
  const [convertCost, setConvertCost] = useState(0);
  const [convertCurrency, setConvertCurrency] = useState("XAF");
  const [isConverting, setIsConverting] = useState(false);

  // Filter requests based on status and search query
  useEffect(() => {
    let result = [...requests];

    if (statusFilter !== "all") {
      result = result.filter(r => r.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        r.service.toLowerCase().includes(term) ||
        r.message.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(result);
  }, [requests, statusFilter, searchTerm]);

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const triggerError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  // Change request status in Firestore
  const handleUpdateStatus = async (requestId: string, newStatus: ProjectRequest["status"]) => {
    setIsUpdating(requestId);
    try {
      await updateDoc(doc(db, "projectRequests", requestId), { status: newStatus });
      
      // Update local state if currently selected
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      
      // Update local list requests
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
      
      const successLabel = language === "fr" 
        ? `Statut mis à jour : ${newStatus}` 
        : `Status adjusted: ${newStatus}`;
      triggerSuccess(successLabel);
    } catch (error: any) {
      triggerError(error.message || "Error updating status");
    } finally {
      setIsUpdating(null);
    }
  };

  // Delete Request permanently
  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm(language === "fr" ? "Confirmez-vous la suppression permanente de cette requête ?" : "Are you sure you want to permanently delete this request?")) {
      return;
    }
    setIsUpdating(requestId);
    try {
      await deleteDoc(doc(db, "projectRequests", requestId));
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(null);
      }
      triggerSuccess(language === "fr" ? "Requête supprimée définitivement" : "Request permanently deleted");
    } catch (error: any) {
      triggerError(error.message || "Error deleting request");
    } finally {
      setIsUpdating(null);
    }
  };

  // Setup Conversion parameters
  const startConversion = (req: ProjectRequest) => {
    setConvertingRequest(req);
    setConvertTitle(req.service || req.name + " Project");
    setConvertCost(req.estimateBudget || 250000);
    setConvertCurrency(req.estimateCurrency || "XAF");
    // Default to the request's userId or the first client
    setConvertTargetUserId(req.userId || (allUsers.length > 0 ? allUsers[0].uid : ""));
  };

  // Complete conversion of Inquiry into a Live Project
  const handleConvertInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingRequest) return;
    if (!convertTargetUserId) {
      triggerError(language === "fr" ? "Veuillez sélectionner ou assigner un client existant" : "Please assign this to an existing client user first.");
      return;
    }

    setIsConverting(true);
    try {
      const generatedProjId = "proj_" + Math.random().toString(36).substring(2, 11).toUpperCase();
      
      const features = convertingRequest.estimateFeatures && convertingRequest.estimateFeatures.length > 0 
        ? convertingRequest.estimateFeatures 
        : [
            language === "fr" ? "Identité UI/UX spécifique" : "Tailored visual parameters",
            language === "fr" ? "Formulaire de contact dynamique" : "Interactive contact structures"
          ];

      const newProjData: ClientProject = {
        id: generatedProjId,
        userId: convertTargetUserId,
        title: convertTitle,
        type: "vitrine", // general type placeholder
        cost: Number(convertCost),
        currency: convertCurrency as "XAF" | "EUR",
        status: "brief",
        progress: 10,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: features
      };

      // Create Live Project
      await setDoc(doc(db, "projects", generatedProjId), newProjData);

      // Create deposit invoice (50%)
      const generatedInvoiceId = "fact_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const initialInvoice: ClientInvoice = {
        id: generatedInvoiceId,
        projectId: generatedProjId,
        userId: convertTargetUserId,
        amount: Math.round(Number(convertCost) * 0.5),
        tax: Math.round(Number(convertCost) * 0.5 * 0.1925),
        total: Math.round(Number(convertCost) * 0.5 * 1.1925),
        currency: convertCurrency as "XAF" | "EUR",
        status: "unpaid",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "invoices", generatedInvoiceId), initialInvoice);

      // Create instant in-app notification to client
      const generatedNotifId = "notif_" + Math.random().toString(36).substring(2, 11).toUpperCase();
      const notificationData = {
        id: generatedNotifId,
        userId: convertTargetUserId,
        title: language === "fr" ? "Nouveau projet initialisé !" : "New project initialized!",
        message: language === "fr" 
          ? `Votre demande concernant "${convertTitle}" de ${formatCurrency(Number(convertCost), convertCurrency)} a été validée. Votre interface client est désormais prête.` 
          : `Your request regarding "${convertTitle}" costing ${formatCurrency(Number(convertCost), convertCurrency)} has been approved. Your clientspace is ready.`,
        type: "message",
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "notifications", generatedNotifId), notificationData);

      // Update status of projectRequest to 'accepted'
      await updateDoc(doc(db, "projectRequests", convertingRequest.id), { status: "accepted" });

      setRequests(prev => prev.map(r => r.id === convertingRequest.id ? { ...r, status: "accepted" } : r));

      triggerSuccess(language === "fr" ? "Inquiry convertie en projet actif et notifié au client !" : "Inquiry upgraded to active contract and billed successfully!");
      setConvertingRequest(null);
      
      // Close detail view if it belonged to this converted item
      if (selectedRequest && selectedRequest.id === convertingRequest.id) {
        setSelectedRequest({ ...selectedRequest, status: "accepted" });
      }
    } catch (err: any) {
      triggerError(err.message || "Error during upgrade lifecycle.");
    } finally {
      setIsConverting(false);
    }
  };

  // Helper translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        title: "Demandes de Projets & Devis",
        subtitle: "Pôle administrateur de revue des messages de contact et simulations d'estimations en ligne",
        searchPlaceholder: "Chercher par nom, email, téléphone ou message...",
        statusAll: "Tous les statuts",
        statusPending: "En attente",
        statusReviewed: "Revue effectuée",
        statusAccepted: "Acceptés",
        statusRejected: "Refusés",
        statusArchived: "Archivés",
        notProvided: "Non spécifié",
        budgetEst: "Budget Simulateur",
        contactDetails: "Coordonnées de l'expéditeur",
        detailsTitle: "Détails de l'Inquiry",
        statusLabel: "Statut",
        messageLabel: "Message optionnel / Expression des besoins",
        convertBtn: "Convertir en Projet Actif",
        deleteBtn: "Supprimer",
        estimatedOptions: "Options Simulées",
        noRequestSelected: "Sélectionnez une demande à gauche pour afficher les détails et outils d'administration.",
        noResults: "Aucun résultat ne correspond aux filtres appliqués.",
        emptyRequests: "La collection est vide. Aucun client n'a envoyé de demande d'estimation ou de contact pour le moment.",
        statsInquiries: "Demandes globales",
        statsPending: "Messages non traités",
        statsReviewed: "Inquiries analysées",
        statsEstimates: "Avec Devis Simulateur"
      },
      en: {
        title: "Project Requests & Inquiries",
        subtitle: "Admin review workspace for client contact entries and pricing budget simulations",
        searchPlaceholder: "Search by person, email, phone connection or notes...",
        statusAll: "All Statuses",
        statusPending: "Pending Review",
        statusReviewed: "Reviewed",
        statusAccepted: "Approved",
        statusRejected: "Declined",
        statusArchived: "Archived",
        notProvided: "Not set",
        budgetEst: "Budget estimate",
        contactDetails: "Contact Coordinates",
        detailsTitle: "Inquiry Details Assessment",
        statusLabel: "Status State",
        messageLabel: "Client details / Written statement content",
        convertBtn: "Upgrade to Live Project",
        deleteBtn: "Delete Inquiry",
        estimatedOptions: "Simulated Features",
        noRequestSelected: "Select an active request on the left listing to open detail review utilities.",
        noResults: "No project request records match your active query.",
        emptyRequests: "Inquiry list is empty. No clients have filed custom estimate sheets or contact forms yet.",
        statsInquiries: "Total Inquiries",
        statsPending: "Awaiting Action",
        statsReviewed: "Reviewed Entries",
        statsEstimates: "With Estimated Budgets"
      }
    };
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  // Compute Statistics
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const reviewedCount = requests.filter(r => r.status === "reviewed").length;
  const estimateCount = requests.filter(r => r.estimateBudget && r.estimateBudget > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className={`font-display font-black text-xl flex items-center gap-2 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            <Inbox className="text-gold" size={20} />
            <span>{t("title")}</span>
            <button 
              onClick={() => setStatusFilter("pending")}
              className="relative ml-2 flex items-center p-1.5 rounded-full transition-all duration-300 hover:scale-105 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-amber-500 cursor-pointer"
              title={language === "fr" ? "Afficher les demandes en attente" : "Show pending requests"}
              id="admin-requests-bell-button"
            >
              <Bell size={18} className={pendingCount > 0 ? "text-red-500 animate-pulse" : ""} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Operation Status Feedback */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 text-left animate-fadeUp">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left animate-fadeUp">
          <AlertCircle size={14} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Brief Info Statistics Row - Styled compactly */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: TOTAL */}
        <div className={`p-4 rounded-2xl border transition flex items-center gap-3.5 ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/45 border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/10 text-gold flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("statsInquiries")}</span>
            <span className={`text-lg font-black font-display leading-none block mt-1 ${theme === "light" ? "text-slate-950" : "text-white"}`}>{totalCount}</span>
          </div>
        </div>

        {/* STAT 2: PENDING */}
        <div className={`p-4 rounded-2xl border transition flex items-center gap-3.5 ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/45 border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("statsPending")}</span>
            <span className="text-lg font-black font-display text-yellow-500 leading-none block mt-1">{pendingCount}</span>
          </div>
        </div>

        {/* STAT 3: REVIEWED */}
        <div className={`p-4 rounded-2xl border transition flex items-center gap-3.5 ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/45 border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("statsReviewed")}</span>
            <span className={`text-lg font-black font-display leading-none block mt-1 ${theme === "light" ? "text-slate-950" : "text-white"}`}>{reviewedCount}</span>
          </div>
        </div>

        {/* STAT 4: WITH ESTIMATE */}
        <div className={`p-4 rounded-2xl border transition flex items-center gap-3.5 ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/45 border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t("statsEstimates")}</span>
            <span className="text-lg font-black font-display text-emerald-400 leading-none block mt-1">{estimateCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Segment */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between ${
        theme === "light" ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-white/5"
      }`}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-gold"
                : "bg-slate-950/60 border-white/5 text-white placeholder:text-white/20 focus:border-gold"
            }`}
          />
        </div>

        {/* Filter Buttons Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <Filter size={13} className="text-slate-400 mr-1 hidden sm:block" />
          {[
            { id: "all", label: t("statusAll") },
            { id: "pending", label: t("statusPending") },
            { id: "reviewed", label: t("statusReviewed") },
            { id: "accepted", label: t("statusAccepted") },
            { id: "rejected", label: t("statusRejected") },
            { id: "archived", label: t("statusArchived") }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition shrink-0 cursor-pointer ${
                statusFilter === btn.id
                  ? "bg-gold text-slate-950"
                  : theme === "light"
                    ? "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                    : "bg-slate-950/40 border border-white/5 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container: Split screen Listing vs Details */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400">{language === "fr" ? "Chargement des demandes..." : "Retrieving system inquiries..."}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/20 border-white/10"
        }`}>
          <Inbox size={48} className="text-slate-500 mb-4" />
          <p className={`font-display font-bold text-sm mb-1 ${theme === "light" ? "text-slate-800" : "text-white"}`}>
            {t("emptyRequests")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: LISTING */}
          <div className="xl:col-span-6 space-y-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-450 italic">
                {t("noResults")}
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const statusStyles = {
                  pending: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                  reviewed: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                  accepted: "bg-green-500/10 border-green-500/20 text-green-400",
                  rejected: "bg-red-500/10 border-red-500/20 text-red-400",
                  archived: "bg-slate-500/10 border-slate-500/20 text-slate-400"
                }[req.status];

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      isSelected 
                        ? theme === "light"
                          ? "bg-slate-50 border-gold/70"
                          : "bg-slate-900 border-gold/60"
                        : theme === "light"
                          ? "bg-white border-slate-200 hover:border-slate-300"
                          : "bg-slate-900/35 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Visual highlighted left anchor bar */}
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold rounded-r-lg" />}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className={`font-display font-extrabold text-sm tracking-tight leading-snug ${
                          theme === "light" ? "text-slate-900" : "text-white"
                        }`}>
                          {req.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{req.email}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block border shrink-0 ${statusStyles}`}>
                        {t(`status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}`)}
                      </span>
                    </div>

                    <p className={`text-xs my-3 line-clamp-2 leading-relaxed ${
                      theme === "light" ? "text-slate-600" : "text-slate-300"
                    }`}>
                      {req.message}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar size={12} className="text-gold" />
                        <span>{new Date(req.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {req.estimateBudget && req.estimateBudget > 0 && (
                        <div className="flex items-center gap-1 p-1 px-2 rounded bg-amber-500/10 text-gold text-[10px] font-extrabold">
                          <DollarSign size={10} />
                          <span>{formatCurrency(req.estimateBudget, req.estimateCurrency || "XAF")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT PANEL: DETAILS ASSESSMENT */}
          <div className="xl:col-span-6">
            {!selectedRequest ? (
              <div className={`p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center py-24 ${
                theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#0b0f19]/35 border-white/5"
              }`}>
                <Inbox size={32} className="text-slate-500 mb-3 animate-pulse" />
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  {t("noRequestSelected")}
                </p>
              </div>
            ) : (
              <div className={`rounded-3xl p-6 border shadow-xl text-left flex flex-col gap-5 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-slate-900 border-white/5"
              }`}>
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1">ID: {selectedRequest.id}</span>
                    <h3 className={`font-display font-black text-lg ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}>
                      {selectedRequest.name}
                    </h3>
                    <p className="text-xs text-slate-550 flex items-center gap-1.5 mt-1 font-semibold">
                      <Calendar size={13} className="text-gold" />
                      <span>{new Date(selectedRequest.createdAt).toLocaleString(language === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">{t("statusLabel")}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold block uppercase border mt-0.5 ${
                      {
                        pending: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                        reviewed: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                        accepted: "bg-green-500/10 border-green-500/20 text-green-400",
                        rejected: "bg-red-500/10 border-red-500/20 text-red-400",
                        archived: "bg-slate-500/10 border-slate-500/20 text-slate-400"
                      }[selectedRequest.status]
                    }`}>
                      {t(`status${selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}`)}
                    </span>
                  </div>
                </div>

                {/* Sender Details Cards */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t("contactDetails")}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* EMAIL CARD */}
                    <a 
                      href={`mailto:${selectedRequest.email}`}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                        theme === "light" ? "bg-slate-50 hover:bg-slate-100 border-slate-200" : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <Mail size={14} className="text-gold shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none block">Email</span>
                        <span className={`text-xs font-semibold block truncate mt-0.5 ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                          {selectedRequest.email || t("notProvided")}
                        </span>
                      </div>
                    </a>

                    {/* PHONE CARD */}
                    <div 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        theme === "light" ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Phone size={14} className="text-gold shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block leading-none">Phone</span>
                          <span className={`text-xs font-semibold block truncate mt-0.5 ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                            {selectedRequest.phone || t("notProvided")}
                          </span>
                        </div>
                      </div>

                      {selectedRequest.phone && (
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {/* WhatsApp chat click */}
                          <a 
                            href={`https://wa.me/${selectedRequest.phone.replace(/[^0-9]/g, "")}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/25 text-emerald-400 border border-green-500/10"
                            title="WhatsApp Chat"
                          >
                            <MessageSquare size={13} />
                          </a>
                          {/* Direct calling */}
                          <a 
                            href={`tel:${selectedRequest.phone}`}
                            className="p-1.5 rounded-lg bg-gold/15 hover:bg-gold/30 text-gold border border-gold/10"
                            title="Direct Call"
                          >
                            <Phone size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estimate info if submitted from our pricing module */}
                {selectedRequest.estimateBudget && selectedRequest.estimateBudget > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 to-gold/10 border border-gold/15 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-gold" />
                        <span className="text-[10px] uppercase font-display font-black text-gold tracking-wider">{t("budgetEst")}</span>
                      </div>
                      <span className="font-display font-black text-base text-gold-light">
                        {formatCurrency(selectedRequest.estimateBudget, selectedRequest.estimateCurrency || "XAF")}
                      </span>
                    </div>

                    {/* Features list bullet points */}
                    {selectedRequest.estimateFeatures && selectedRequest.estimateFeatures.length > 0 && (
                      <div className="space-y-1.5 border-t border-gold/10 pt-2.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t("estimatedOptions")} :</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300 font-mono text-[10px]">
                          {selectedRequest.estimateFeatures.map((feat, index) => (
                            <div key={index} className="flex items-center gap-1.5 block truncate">
                              <div className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Requested Work/Message Content */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t("messageLabel")}</h4>
                  <div className={`p-4 rounded-xl text-xs font-medium leading-relaxed font-mono ${
                    theme === "light" ? "bg-slate-50 border border-slate-200 text-slate-700" : "bg-black/25 text-slate-300 border border-white/5"
                  }`}>
                    {selectedRequest.message}
                  </div>
                </div>

                {/* Administrative Decision Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/10 pt-4 mt-2">
                  {/* Transition Status Buttons */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Transitions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRequest.status !== "reviewed" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, "reviewed")}
                          disabled={isUpdating === selectedRequest.id}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/10 text-blue-400 transition cursor-pointer"
                        >
                          {language === "fr" ? "Revue OK" : "Reviewed OK"}
                        </button>
                      )}
                      {selectedRequest.status !== "archived" && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, "archived")}
                          disabled={isUpdating === selectedRequest.id}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-500/15 hover:bg-slate-500/25 border border-slate-500/10 text-slate-400 transition cursor-pointer"
                        >
                          {language === "fr" ? "Archiver" : "Archive"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(selectedRequest.id)}
                        disabled={isUpdating === selectedRequest.id}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-500/10 text-red-400 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={10} />
                        <span>{t("deleteBtn")}</span>
                      </button>
                    </div>
                  </div>

                  {/* HIGH VALUE: Convert to Project Trigger */}
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => startConversion(selectedRequest)}
                      className="w-full py-2.5 rounded-xl text-xs font-black bg-gold hover:bg-gold-light text-slate-950 hover:shadow-lg transition flex items-center justify-center gap-1.5 uppercase hover:shadow-gold/15 cursor-pointer"
                    >
                      <Briefcase size={13} />
                      <span>{t("convertBtn")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONVERSION PANEL MODAL Overlay */}
      {convertingRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-md w-full rounded-3xl border p-6 flex flex-col gap-4 text-left relative ${
            theme === "light" ? "bg-white border-slate-200" : "bg-[#111827] border-white/10"
          }`}>
            <button 
              onClick={() => setConvertingRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className={`font-display font-black text-base flex items-center gap-2 ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}>
                <Briefcase size={18} className="text-gold" />
                <span>{language === "fr" ? "Convertir en Projet Actif" : "Convert into Client Contract"}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === "fr" 
                  ? "Ceci initialisera un projet dynamique dans le système et éditera l'acompte initial client." 
                  : "This will spawn a dynamic active project inside the database and draft the accompanying deposit bill."
                }
              </p>
            </div>

            <form onSubmit={handleConvertInquiry} className="space-y-4">
              {/* ASSIGN USER */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {language === "fr" ? "Client rattaché" : "Associated Client Account"}
                </label>
                <select
                  value={convertTargetUserId}
                  onChange={(e) => setConvertTargetUserId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-gold ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-[#0b0f19] border-white/5 text-white"
                  }`}
                >
                  <option value="">{language === "fr" ? "-- Sélectionner un client --" : "-- Select a client --"}</option>
                  {allUsers.map(userProfile => (
                    <option key={userProfile.uid} value={userProfile.uid}>
                      {userProfile.name} ({userProfile.email})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-1 italic">
                  {language === "fr" 
                    ? "*Le projet et l'acompte de paiement s'afficheront sur le tableau de bord de ce client." 
                    : "*The resulting contract and billings will register directly in this client's terminal workspace."
                  }
                </p>
              </div>

              {/* PROJECT TITLE */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {language === "fr" ? "Intitulé du contrat" : "Contract Title"}
                </label>
                <input
                  type="text"
                  required
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-gold ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                      : "bg-[#0b0f19] border-white/5 text-white placeholder:text-white/20"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* COST BUDGET */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {language === "fr" ? "Budget HT Global" : "Total Project Budget"}
                  </label>
                  <input
                    type="number"
                    required
                    value={convertCost}
                    onChange={(e) => setConvertCost(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-gold ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                        : "bg-[#0b0f19] border-white/5 text-white placeholder:text-white/20"
                    }`}
                  />
                </div>

                {/* CURRENCY */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Currency
                  </label>
                  <select
                    value={convertCurrency}
                    onChange={(e) => setConvertCurrency(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-gold ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-[#0b0f19] border-white/5 text-white"
                    }`}
                  >
                    <option value="XAF">Franc CFA (XAF)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>

              {/* ACTION BTNS */}
              <button
                type="submit"
                disabled={isConverting}
                className="w-full mt-4 py-3 rounded-xl text-xs font-black bg-gold text-slate-950 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:bg-gold-light focus:outline-none cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{language === "fr" ? "Traitement..." : "Upgrading..."}</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{language === "fr" ? "Lancer le contrat & l'acompte" : "Launch Project Contract"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
