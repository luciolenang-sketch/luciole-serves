import React, { useState, useEffect } from "react";
import { 
  Users, Smartphone, FileText, Bell, Plus, Trash2, 
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Send, ShieldCheck, Mail, MapPin, DollarSign, Edit3, Save, X, MessageSquare
} from "lucide-react";
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import { formatCurrency } from "../utils";
import { ClientProject, ClientInvoice, ClientNotification } from "./ClientDashboard";
import { AdminDashboard, ProjectRequest } from "./AdminDashboard";
import { AdminLiveSupport } from "./AdminLiveSupport";

interface AdminBoardProps {
  theme: "light" | "dark";
  language: "fr" | "en";
  allUsers: any[];
  projects: ClientProject[];
  invoices: ClientInvoice[];
}

export const AdminBoard: React.FC<AdminBoardProps> = ({
  theme,
  language,
  allUsers,
  projects,
  invoices
}) => {
  const [adminSubTab, setAdminSubTab] = useState<"users" | "projects" | "invoices" | "notifications" | "requests" | "chats">("users");
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Fetch inquiries collection on mount/auth state ready
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        const q = query(collection(db, "projectRequests"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched: ProjectRequest[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as ProjectRequest);
        });
        setRequests(fetched);
      } catch (err) {
        console.error("Network error fetching project requests from Firestore:", err);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;
  
  // Status feedback states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Project Form state
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [projTargetUserId, setProjTargetUserId] = useState("");
  const [projTitle, setProjTitle] = useState("");
  const [projType, setProjType] = useState<"vitrine" | "ecommerce" | "mobile" | "design" | "pub-spot">("vitrine");
  const [projCost, setProjCost] = useState<number>(350000);
  const [projCurrency, setProjCurrency] = useState<"XAF" | "EUR">("XAF");
  
  // Edit Project Progress state
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [exprProgress, setExprProgress] = useState<number>(0);
  const [exprStatus, setExprStatus] = useState<"brief" | "design" | "development" | "qa" | "deployed">("brief");
  const [exprPaymentStatus, setExprPaymentStatus] = useState<"pending" | "issued" | "paid">("pending");

  // New Invoice Form state
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceProjId, setInvoiceProjId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState<number>(150000);
  const [invoiceTax, setInvoiceTax] = useState<number>(30000);
  const [invoiceCurrency, setInvoiceCurrency] = useState<"XAF" | "EUR">("XAF");

  // Manual payment state
  const [clearingInvoiceId, setClearingInvoiceId] = useState<string | null>(null);
  const [manualMethod, setManualMethod] = useState("Orange Money");
  const [manualTxHash, setManualTxHash] = useState("");

  // New Notification Form state
  const [notifTargetUserId, setNotifTargetUserId] = useState("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"message" | "milestone">("message");

  // Display clear messaging
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // 1. PROJECT FUNCTIONS
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTargetUserId || !projTitle) {
      triggerError(language === "fr" ? "Veuillez sélectionner un client et entrer un titre." : "Please select a client and set a title.");
      return;
    }
    setActionLoading("create_project");
    try {
      const generatedProjId = "proj_" + Math.random().toString(36).substring(2, 11).toUpperCase();
      const newProjData: ClientProject = {
        id: generatedProjId,
        userId: projTargetUserId,
        title: projTitle,
        type: projType,
        cost: Number(projCost),
        currency: projCurrency,
        status: "brief",
        progress: 10,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: [
          language === "fr" ? "Configuration de base" : "Initial configuration",
          language === "fr" ? "Analyse de cahier des charges" : "Requirements assessment"
        ]
      };

      await setDoc(doc(db, "projects", generatedProjId), newProjData);
      
      // Auto-create initial invoice for this project as issued
      const generatedInvoiceId = "fact_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const initialInvoice: ClientInvoice = {
        id: generatedInvoiceId,
        projectId: generatedProjId,
        userId: projTargetUserId,
        amount: Math.round(Number(projCost) * 0.5), // 50% deposit
        tax: Math.round(Number(projCost) * 0.5 * 0.1925),
        total: Math.round(Number(projCost) * 0.5 * 1.1925),
        currency: projCurrency,
        status: "unpaid",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "invoices", generatedInvoiceId), initialInvoice);

      triggerSuccess(language === "fr" ? "Projet et facture d'acompte initialisés avec succès !" : "Project established & initial invoice generated!");
      setIsCreatingProj(false);
      setProjTitle("");
    } catch (err: any) {
      triggerError(err.message || "Error establishing project.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProjectStage = async (pId: string) => {
    setActionLoading(`update_proj_${pId}`);
    try {
      const projectRef = doc(db, "projects", pId);
      await updateDoc(projectRef, {
        progress: Number(exprProgress),
        status: exprStatus,
        paymentStatus: exprPaymentStatus,
        updatedAt: new Date().toISOString()
      });
      triggerSuccess(language === "fr" ? "Projet mis à jour de manière sécurisée !" : "Project parameters adjusted successfully.");
      setEditingProjId(null);
    } catch (err: any) {
      triggerError(err.message || "Error updating project status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async (pId: string) => {
    if (!window.confirm(language === "fr" ? "Êtes-vous sûr de vouloir supprimer ce projet ?" : "Are you sure you want to drop this project?")) return;
    setActionLoading(`delete_proj_${pId}`);
    try {
      await deleteDoc(doc(db, "projects", pId));
      triggerSuccess(language === "fr" ? "Projet supprimé." : "Project dropped.");
    } catch (err: any) {
      triggerError(err.message || "Error deletion.");
    } finally {
      setActionLoading(null);
    }
  };

  // 2. INVOICE FUNCTIONS
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceProjId) {
      triggerError(language === "fr" ? "Veuillez sélectionner un projet." : "Please select an active project.");
      return;
    }
    setActionLoading("create_invoice");
    try {
      const matchedProj = projects.find(p => p.id === invoiceProjId);
      if (!matchedProj) throw new Error("Project not resolved.");

      const generatedInvoiceId = "fact_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const amountVal = Number(invoiceAmount);
      const taxVal = Number(invoiceTax);
      const totalVal = amountVal + taxVal;

      const newInvoice: ClientInvoice = {
        id: generatedInvoiceId,
        projectId: invoiceProjId,
        userId: matchedProj.userId,
        amount: amountVal,
        tax: taxVal,
        total: totalVal,
        currency: invoiceCurrency,
        status: "unpaid",
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "invoices", generatedInvoiceId), newInvoice);
      triggerSuccess(language === "fr" ? "Nouvelle facture émise avec succès !" : "Invoice issued securely.");
      setIsCreatingInvoice(false);
    } catch (err: any) {
      triggerError(err.message || "Error issuing invoice.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkInvoiceAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearingInvoiceId) return;
    setActionLoading(`clear_invoice_${clearingInvoiceId}`);
    try {
      const invoiceRef = doc(db, "invoices", clearingInvoiceId);
      await updateDoc(invoiceRef, {
        status: "paid",
        method: manualMethod,
        transactionHash: manualTxHash || "MANUAL_CLEAR_" + Date.now().toString(),
        paidAt: new Date().toISOString()
      });
      triggerSuccess(language === "fr" ? "Facture marquée comme PAYÉE !" : "Invoice status marked as PAID!");
      setClearingInvoiceId(null);
      setManualTxHash("");
    } catch (err: any) {
      triggerError(err.message || "Error validating payment.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInvoice = async (invId: string) => {
    if (!window.confirm(language === "fr" ? "Supprimer cette facture ?" : "Drop this invoice?")) return;
    setActionLoading(`delete_inv_${invId}`);
    try {
      await deleteDoc(doc(db, "invoices", invId));
      triggerSuccess(language === "fr" ? "Facture supprimée." : "Invoice removed.");
    } catch (err: any) {
      triggerError(err.message || "Error dropping invoice.");
    } finally {
      setActionLoading(null);
    }
  };

  // 3. BROADCAST / SEND NOTIFICATION
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      triggerError(language === "fr" ? "Veuillez remplir le titre et le message." : "Incomplete form fields.");
      return;
    }
    setActionLoading("send_notification");
    try {
      const targets = notifTargetUserId === "all" 
        ? allUsers.map(u => u.uid) 
        : [notifTargetUserId];

      for (const targetUid of targets) {
        if (!targetUid) continue;
        const genNotifId = "notif_" + Math.random().toString(36).substring(2, 11).toUpperCase();
        const notificationData: ClientNotification = {
          id: genNotifId,
          userId: targetUid,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          read: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "notifications", genNotifId), notificationData);
      }

      triggerSuccess(
        language === "fr" 
          ? `Notification transmise à ${targets.length} client(s) !` 
          : `Alert dispatch to ${targets.length} user(s) completed!`
      );
      setNotifTitle("");
      setNotifMessage("");
    } catch (err: any) {
      triggerError(err.message || "Error forwarding push alert.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Title Card */}
      <div className={`p-6 rounded-3xl border text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
        theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/40 border-white/5"
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="text-gold" size={20} />
            <span className="text-[10px] font-mono text-gold font-extrabold uppercase tracking-widest leading-none">
              {language === "fr" ? "PANNEAU MAÎTRE ADMINISTRATION" : "ADMINISTRATOR CONTROL CENTRE"}
            </span>
          </div>
          <h3 className={`text-xl font-black leading-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
            {language === "fr" ? "Console Globale Luciole Services" : "Real-time Operations Registry"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === "fr" 
              ? "Superviser les clients, éditer les étapes de développement et valider les acomptes financiers." 
              : "Consolidated register of all projects, invoices and clients."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAdminSubTab("users")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              adminSubTab === "users" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <Users size={12} />
            <span>Clients ({allUsers.length})</span>
          </button>
          <button
            onClick={() => setAdminSubTab("projects")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              adminSubTab === "projects" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <Smartphone size={12} />
            <span>Projets ({projects.length})</span>
          </button>
          <button
            onClick={() => setAdminSubTab("invoices")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              adminSubTab === "invoices" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <FileText size={12} />
            <span>Factures ({invoices.length})</span>
          </button>
          <button
            onClick={() => setAdminSubTab("notifications")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              adminSubTab === "notifications" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <Bell size={12} />
            <span>Alertes</span>
          </button>
          <button
            onClick={() => setAdminSubTab("requests")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer relative ${
              adminSubTab === "requests" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <Mail size={12} />
            <span>{language === "fr" ? "Inquiries / Demandes" : "Requests Inquiries"}</span>
            {pendingRequestsCount > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-black font-sans text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminSubTab("chats")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer relative ${
              adminSubTab === "chats" ? "bg-gold text-slate-950" : theme === "light" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/5 text-slate-350 hover:bg-white/10"
            }`}
          >
            <MessageSquare size={12} />
            <span>{language === "fr" ? "Chats en Direct" : "Live Support"}</span>
          </button>
        </div>
      </div>

      {/* Notifications Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 text-left animate-fadeUp">
          <CheckCircle2 size={14} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left animate-fadeUp">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. USERS SUBTAB */}
      {adminSubTab === "users" && (
        <div className="space-y-4">
          <div className="text-left mb-2">
            <h4 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-800" : "text-white"}`}>
              👥 RECONNAISSANCE DES CLIENTS PARTENAIRES
            </h4>
          </div>

          <div className={`overflow-x-auto border rounded-2xl ${theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/40 border-white/5"}`}>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider ${theme === "light" ? "bg-slate-50 border-slate-100" : "bg-black/35 border-white/5"}`}>
                  <th className="p-4">Identifiant unique (UID)</th>
                  <th className="p-4">Nom complet</th>
                  <th className="p-4">Courriel (Email)</th>
                  <th className="p-4">Téléphone / WhatsApp</th>
                  <th className="p-4">Localisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {language === "fr" ? "Aucun client inscrit pour le moment." : "No client records registered yet."}
                    </td>
                  </tr>
                ) : (
                  allUsers.map((user, idx) => (
                    <tr key={user.uid || idx} className={`${theme === "light" ? "hover:bg-slate-50" : "hover:bg-white/5"}`}>
                      <td className="p-4 font-mono text-[10px] text-amber-500 select-all">{user.uid}</td>
                      <td className="p-4 font-bold">{user.name || "N/A"}</td>
                      <td className="p-4 select-all text-slate-400">{user.email || "N/A"}</td>
                      <td className="p-4 text-slate-400">{user.phone || "N/A"}</td>
                      <td className="p-4 truncate max-w-[150px] text-slate-400">{user.address || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PROJECTS SUBTAB */}
      {adminSubTab === "projects" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h4 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-800" : "text-white"}`}>
              📊 SUIVI GLOBAL DES LIVRABLES ET EXPÉDITIONS
            </h4>
            <button
              onClick={() => setIsCreatingProj(!isCreatingProj)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-transform duration-200"
            >
              <Plus size={13} />
              <span>{language === "fr" ? "Ficher un nouveau projet" : "Issue New Project File"}</span>
            </button>
          </div>

          {/* New Project creation form block */}
          {isCreatingProj && (
            <form onSubmit={handleCreateProject} className={`p-5 rounded-2xl border text-left space-y-4 shadow-inner animate-fadeUp ${
              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#0f172a] border-white/5"
            }`}>
              <h5 className="text-xs font-black uppercase text-gold tracking-widest">{language === "fr" ? "Créer un dossier de projet" : "Establish New Project Folder"}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{language === "fr" ? "Attribuer au Client *" : "Assign Target Client *"}</label>
                  <select
                    required
                    value={projTargetUserId}
                    onChange={(e) => setProjTargetUserId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                    }`}
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {allUsers.map(user => (
                      <option key={user.uid} value={user.uid}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{language === "fr" ? "Titre du projet *" : "Project Reference Title *"}</label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="Ex: Refonte Site E-Commerce Douala"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type de Technologie *</label>
                  <select
                    value={projType}
                    onChange={(e) => setProjType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                    }`}
                  >
                    <option value="vitrine">Site Vitrine Professionnel</option>
                    <option value="ecommerce">Plateforme E-Commerce</option>
                    <option value="mobile">Application Mobile iOS/Android</option>
                    <option value="design">Identité de Marque & Design</option>
                    <option value="pub-spot">Spot Publicitaire Vidéo 3D</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cout Global *</label>
                    <input
                      type="number"
                      required
                      value={projCost}
                      onChange={(e) => setProjCost(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                        theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Devise *</label>
                    <select
                      value={projCurrency}
                      onChange={(e) => setProjCurrency(e.target.value as any)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                        theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                      }`}
                    >
                      <option value="XAF">XAF (FCFA)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading === "create_project"}
                className="px-4 py-2 text-slate-950 bg-gold hover:bg-gold-light rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {actionLoading === "create_project" ? "Création..." : "Valider et Créer dossier"}
              </button>
            </form>
          )}

          {/* Projects map block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const clientObj = allUsers.find(u => u.uid === proj.userId);
              const isEditing = editingProjId === proj.id;
              
              return (
                <div key={proj.id} className={`p-5 rounded-2xl border text-left space-y-4 shadow ${
                  theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/30 border-white/5 backdrop-blur-sm"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {proj.id}
                      </span>
                      <h5 className={`font-black text-sm mt-1.5 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                        {proj.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingProjId(null);
                          } else {
                            setEditingProjId(proj.id);
                            setExprProgress(proj.progress);
                            setExprStatus(proj.status);
                            setExprPaymentStatus(proj.paymentStatus);
                          }
                        }}
                        className={`p-1.5 rounded-lg border hover:scale-105 active:scale-95 transition cursor-pointer text-xs ${
                          theme === "light" ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                        title={language === "fr" ? "Éditer l'avancement" : "Adjust milestones"}
                      >
                        {isEditing ? <X size={12} /> : <Edit3 size={12} />}
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        disabled={actionLoading === `delete_proj_${proj.id}`}
                        className="p-1.5 rounded-lg border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/35 transition cursor-pointer text-red-400"
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-400">
                    <p className="flex items-center gap-1">
                      <Users size={11} className="text-gold shrink-0" />
                      <span>{clientObj ? `${clientObj.name} (${clientObj.email})` : `UID Client: ${proj.userId}`}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <DollarSign size={11} className="text-gold shrink-0" />
                      <span className="font-bold text-slate-300">{formatCurrency(proj.cost, proj.currency)}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Phase: <strong className="text-gold">{proj.status.toUpperCase()}</strong> ({proj.progress}%)</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${proj.paymentStatus === "paid" ? "bg-green-500" : "bg-amber-500"}`} />
                      <span>Comptabilité: <strong className={proj.paymentStatus === "paid" ? "text-green-400" : "text-amber-400"}>{proj.paymentStatus.toUpperCase()}</strong></span>
                    </p>
                  </div>

                  {/* Progressive meter representation bar */}
                  <div className="w-full bg-slate-500/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gold h-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>

                  {/* Inline project parameters modifications form */}
                  {isEditing && (
                    <div className="pt-3 border-t border-dashed border-slate-500/10 space-y-3 animate-fadeUp">
                      <span className="text-[9px] font-bold text-gold uppercase tracking-widest block">{language === "fr" ? "MISE À JOUR DE LA FEUILLE DE ROUTE" : "ROADMAP DISPATCH PARAMETERS"}</span>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">Avancement (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={exprProgress}
                            onChange={(e) => setExprProgress(Number(e.target.value))}
                            className={`w-full px-2 py-1 text-xs rounded border ${
                              theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">Statut de phase</label>
                          <select
                            value={exprStatus}
                            onChange={(e) => setExprStatus(e.target.value as any)}
                            className={`w-full px-2 py-1 text-xs rounded border ${
                              theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                            }`}
                          >
                            <option value="brief">Brief Initial</option>
                            <option value="design">Design / UX</option>
                            <option value="development">Développement</option>
                            <option value="qa">Assurance Qualité</option>
                            <option value="deployed">Livré / Deployed</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">Paiement</label>
                          <select
                            value={exprPaymentStatus}
                            onChange={(e) => setExprPaymentStatus(e.target.value as any)}
                            className={`w-full px-2 py-1 text-xs rounded border ${
                              theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                            }`}
                          >
                            <option value="pending">En attente d'acompte</option>
                            <option value="issued">Factures émises</option>
                            <option value="paid">Intégralement Payé</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateProjectStage(proj.id)}
                        disabled={actionLoading === `update_proj_${proj.id}`}
                        className="py-1 px-3 bg-gold hover:bg-gold-light text-slate-950 font-bold rounded text-[10px] uppercase cursor-pointer"
                      >
                        {actionLoading === `update_proj_${proj.id}` ? "Mise à jour..." : "Sauvegarder"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. INVOICES SUBTAB */}
      {adminSubTab === "invoices" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h4 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-800" : "text-white"}`}>
              💳 ENREGISTREMENTS ET RÈGLEMENTS DE FACTURES
            </h4>
            <button
              onClick={() => setIsCreatingInvoice(!isCreatingInvoice)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-transform duration-200"
            >
              <Plus size={13} />
              <span>{language === "fr" ? "Émettre une nouvelle facture" : "Issue Custom Invoice"}</span>
            </button>
          </div>

          {/* New Invoice Form */}
          {isCreatingInvoice && (
            <form onSubmit={handleCreateInvoice} className={`p-5 rounded-2xl border text-left space-y-4 shadow-inner animate-fadeUp ${
              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#0f172a] border-white/5"
            }`}>
              <h5 className="text-xs font-black uppercase text-gold tracking-widest">{language === "fr" ? "Créer une facture" : "Issue New billing Invoice"}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{language === "fr" ? "Projet Associé *" : "Target Related Project *"}</label>
                  <select
                    required
                    value={invoiceProjId}
                    onChange={(e) => setInvoiceProjId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                    }`}
                  >
                    <option value="">-- Sélectionner un projet --</option>
                    {projects.map(p => {
                      const cu = allUsers.find(u => u.uid === p.userId);
                      return (
                        <option key={p.id} value={p.id}>{p.title} ({cu ? cu.name : p.userId})</option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Montant Brut (Hors Taxe) *</label>
                    <input
                      type="number"
                      required
                      value={invoiceAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setInvoiceAmount(val);
                        setInvoiceTax(Math.round(val * 0.1925));
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                        theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Devise *</label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value as any)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                        theme === "light" ? "bg-white border-slate-200" : "bg-black/35 border-white/10 text-white"
                      }`}
                    >
                      <option value="XAF">XAF</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading === "create_invoice"}
                className="px-4 py-2 text-slate-950 bg-gold hover:bg-gold-light rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {actionLoading === "create_invoice" ? "Émission..." : "Confirmer l'émission"}
              </button>
            </form>
          )}

          {/* Invoices List table view */}
          <div className={`overflow-x-auto border rounded-2xl ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/40 border-white/5"
          }`}>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider ${
                  theme === "light" ? "bg-slate-50 border-slate-100" : "bg-black/35 border-white/5"
                }`}>
                  <th className="p-4">Facture ID / Réf</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Projet lié</th>
                  <th className="p-4">Montant Net à Payer</th>
                  <th className="p-4">Statut Comptable</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Aucun enregistrement comptable enregistré.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const client = allUsers.find(u => u.uid === inv.userId);
                    const proj = projects.find(p => p.id === inv.projectId);
                    const isClearing = clearingInvoiceId === inv.id;

                    return (
                      <tr key={inv.id} className={`${theme === "light" ? "hover:bg-slate-50" : "hover:bg-white/5"}`}>
                        <td className="p-4 font-mono font-black text-amber-500 select-all">{inv.id}</td>
                        <td className="p-4">
                          <p className="font-bold">{client ? client.name : "N/A"}</p>
                          <p className="text-[10px] text-slate-400 select-all">{client ? client.email : inv.userId}</p>
                        </td>
                        <td className="p-4 text-slate-400 truncate max-w-[150px]">{proj ? proj.title : "N/A"}</td>
                        <td className="p-4 font-black text-slate-350 select-all">{formatCurrency(inv.total, inv.currency)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === "paid" 
                              ? "bg-green-500/15 text-green-400" 
                              : "bg-amber-500/15 text-amber-400 animate-pulse"
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${inv.status === "paid" ? "bg-green-500" : "bg-amber-500"}`} />
                            {inv.status.toUpperCase()}
                          </span>
                          {inv.status === "paid" && (
                            <p className="text-[9px] text-slate-400 mt-1 select-all">via {inv.method} ({inv.transactionHash?.substring(0, 14)}...)</p>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== "paid" && (
                              <button
                                onClick={() => {
                                  if (isClearing) {
                                    setClearingInvoiceId(null);
                                  } else {
                                    setClearingInvoiceId(inv.id);
                                    setManualMethod("Orange Money");
                                    setManualTxHash("MAN_" + Math.random().toString(36).substring(2, 9).toUpperCase());
                                  }
                                }}
                                className={`px-2.5 py-1 text-[10px] rounded font-bold border transition cursor-pointer ${
                                  theme === "light" 
                                    ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" 
                                    : "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 text-amber-400"
                                }`}
                              >
                                {isClearing ? "Annuler" : "Payer manuellement"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              disabled={actionLoading === `delete_inv_${inv.id}`}
                              className="p-1.5 rounded-lg border border-red-500/15 hover:bg-red-500/15 text-red-400 transition cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          {/* Manual check clearance parameters panel drop */}
                          {isClearing && (
                            <form onSubmit={handleMarkInvoiceAsPaid} className="mt-3 p-3 text-left rounded-xl bg-[#030712] border border-white/5 space-y-2 animate-fadeUp">
                              <span className="text-[9px] font-bold text-gold uppercase tracking-widest block">SAISIR LES CRÉDENTIELS DE RÈGLEMENT</span>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8px] text-slate-400 block mb-0.5">Mode de transaction</label>
                                  <select
                                    value={manualMethod}
                                    onChange={(e) => setManualMethod(e.target.value)}
                                    className="w-full px-1.5 py-1 text-[10px] rounded bg-white/5 border border-white/10 text-white"
                                  >
                                    <option value="Orange Money">Orange Money</option>
                                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                                    <option value="Virement Bancaire">Virement Bancaire</option>
                                    <option value="Espèces / Cash Direct">Espèces / Cash Direct</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-400 block mb-0.5">Hash / No de référence</label>
                                  <input
                                    type="text"
                                    required
                                    value={manualTxHash}
                                    onChange={(e) => setManualTxHash(e.target.value)}
                                    className="w-full px-1.5 py-1 text-[10px] rounded bg-white/5 border border-white/10 text-white"
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={actionLoading === `clear_invoice_${inv.id}`}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-[9px] uppercase tracking-wider cursor-pointer"
                              >
                                {actionLoading === `clear_invoice_${inv.id}` ? "Validation..." : "Valider le paiement"}
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DISPATCH ALERTS SUBTAB */}
      {adminSubTab === "notifications" && (
        <div className="space-y-6">
          <div className="text-left mb-2">
            <h4 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-800" : "text-white"}`}>
              🔔 TRANSMETTRE DES NOTIFICATIONS & JALONS EN DIRECT
            </h4>
          </div>

          <div className={`p-5 rounded-2xl border text-left ${
            theme === "light" ? "bg-white border-slate-200" : "bg-[#111827]/40 border-white/5 backdrop-blur-md"
          }`}>
            <form onSubmit={handleSendNotification} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Destination de l'Alerte *</label>
                  <select
                    value={notifTargetUserId}
                    onChange={(e) => setNotifTargetUserId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#030712]/50 border-white/10 text-white"
                    }`}
                  >
                    <option value="all">📢 TOUS LES CLIENTS INSCRITS (BROADCAST EN GRANDE POMPE)</option>
                    {allUsers.map(user => (
                      <option key={user.uid} value={user.uid}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Type de Signal *</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                      theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#030712]/50 border-white/10 text-white"
                    }`}
                  >
                    <option value="message">Alerte Message Standard / Chat Info</option>
                    <option value="milestone">Avancement de Jalon / Projet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Sujet de la notification *</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ex: Première réunion de rendu UX ou Validé"
                  className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                    theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#030712]/50 border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Message Détaillé *</label>
                <textarea
                  required
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Bonjour, notre équipe vient de finaliser la maquette d'interface de votre application et elle est prête..."
                  className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold ${
                    theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#030712]/50 border-white/10 text-white"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading === "send_notification"}
                className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:scale-103 active:scale-97 transition"
              >
                <Send size={12} />
                <span>{actionLoading === "send_notification" ? "Envoi..." : "Diffuser l'alerte"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. USER PROJECT REQUESTS INQUIRIES SUBTAB */}
      {adminSubTab === "requests" && (
        <AdminDashboard
          theme={theme}
          language={language}
          allUsers={allUsers}
          requests={requests}
          setRequests={setRequests}
          loading={requestsLoading}
        />
      )}

      {/* 6. ADMIN SYSTEM LIVE SUPPORT CHAT WORKSPACE */}
      {adminSubTab === "chats" && (
        <AdminLiveSupport
          theme={theme}
          language={language}
        />
      )}

    </div>
  );
};
