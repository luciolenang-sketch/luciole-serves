/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Lock, User, Mail, LogOut, FileText, Printer, CheckCircle2, 
  ArrowRight, CreditCard, RefreshCw, AlertCircle, Plus, Sparkles,
  Smartphone, Laptop, Database, Clock, ChevronRight, Globe, MapPin, ShieldCheck,
  Bell, MessageSquare, Trash2
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatCurrency } from "../utils";
import { AdminBoard } from "./AdminBoard";

import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  onSnapshot, 
  where 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";

// Projects & Invoice Interfaces
export interface ClientProject {
  id: string;
  userId: string;
  title: string;
  type: "vitrine" | "ecommerce" | "mobile" | "design" | "pub-spot";
  cost: number;
  currency: "XAF" | "EUR";
  status: "brief" | "design" | "development" | "qa" | "deployed";
  progress: number;
  paymentStatus: "pending" | "issued" | "paid";
  createdAt: string;
  updatedAt: string;
  features: string[];
}

export interface ClientInvoice {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  tax: number;
  total: number;
  currency: "XAF" | "EUR";
  status: "unpaid" | "paid";
  createdAt: string;
  method?: "Orange Money" | "MTN Mobile Money" | "Visa" | "Mastercard" | string;
  phoneContact?: string;
  transactionHash?: string;
  paidAt?: string;
}

export interface ClientNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "milestone" | "message";
  read: boolean;
  createdAt: string;
}

export const ClientDashboard: React.FC = () => {
  const { theme, language, t, showToast } = useApp();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [authFormPhase, setAuthFormPhase] = useState<"fill_fields" | "verify_email_otp">("fill_fields");
  const [generatedSignUpCode, setGeneratedSignUpCode] = useState("");
  const [signupOtpInput, setSignupOtpInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Core functional state
  const [activeTab, setActiveTab] = useState<"projects" | "billing" | "account" | "admin">("projects");
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  
  // Custom Project creation dialog state
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjType, setNewProjType] = useState<"vitrine" | "ecommerce" | "mobile" | "design" | "pub-spot">("vitrine");
  const [newProjCost, setNewProjCost] = useState(250000);
  const [newProjCurrency, setNewProjCurrency] = useState<"XAF" | "EUR">("XAF");

  // Dynamic customization options
  const [calcMonths, setCalcMonths] = useState<0 | 3 | 6 | 12>(3);
  const [calcJingle, setCalcJingle] = useState<boolean>(false);
  const [calcLogo, setCalcLogo] = useState<boolean>(false);
  const [calcVoiceOff, setCalcVoiceOff] = useState<boolean>(false);

  // Auto-calc cost effect
  useEffect(() => {
    let base = 250000;
    if (newProjType === "vitrine") base = 250000;
    else if (newProjType === "ecommerce") base = 500000;
    else if (newProjType === "mobile") base = 900000;
    else if (newProjType === "design") base = 100000;
    else if (newProjType === "pub-spot") base = 150000;

    // Support duration
    if (calcMonths === 6) base += 35000;
    if (calcMonths === 12) base += 100000;

    // Checkboxes addons
    if (calcJingle) base += 50000;
    if (calcLogo && newProjType !== "design") base += 100000;
    if (calcVoiceOff) base += 75000;

    if (newProjCurrency === "EUR") {
      setNewProjCost(Math.round(base / 655));
    } else {
      setNewProjCost(base);
    }
  }, [newProjType, newProjCurrency, calcMonths, calcJingle, calcLogo, calcVoiceOff]);

  // Payment workflow state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<ClientInvoice | null>(null);
  const [billingOption, setBillingOption] = useState<"direct" | "partner">("partner");
  const [paymentMethod, setPaymentMethod] = useState<"Orange" | "MTN" | "Visa" | "Master" | null>("MTN"); // Default to MTN or a clean value
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentClientLastName, setPaymentClientLastName] = useState("");
  const [paymentClientFirstName, setPaymentClientFirstName] = useState("");
  const [paymentClientPhone, setPaymentClientPhone] = useState("");
  const [paymentClientEmail, setPaymentClientEmail] = useState("");
  const [paymentCardName, setPaymentCardName] = useState("");
  const [paymentCardNum, setPaymentCardNum] = useState("");
  const [paymentCardExpiry, setPaymentCardExpiry] = useState("");
  const [paymentCardCVC, setPaymentCardCVC] = useState("");
  
  // Gateway interactive loader state
  const [paymentStep, setPaymentStep] = useState<"idle" | "connecting" | "otp_wait" | "processing" | "completed">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [paymentLogs, setPaymentLogs] = useState<string[]>([]);

  // Real-time payment verification from redirect callback
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Auto-verify payment on return mount
  useEffect(() => {
    const checkRedirectPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlQueryRef = params.get("reference") || params.get("payment");
      
      const savedStoredRef = localStorage.getItem("pendingPaymentRef");
      const savedStoredInvoiceId = localStorage.getItem("pendingInvoiceId");
      const savedStoredProjectId = localStorage.getItem("pendingProjectId");
      
      const activeRef = urlQueryRef || savedStoredRef;
      
      if (activeRef && savedStoredInvoiceId) {
        setIsVerifyingPayment(true);
        setVerificationError("");
        setVerificationSuccess(false);
        
        console.log(`[NotchPay] Active checkout reference found. Verifying: ${activeRef}`);
        
        try {
          const res = await fetch(`/api/pay/verify/${activeRef}`);
          const result = await res.json() as any;
          
          if (result.success && result.data?.data) {
            const txData = result.data.data;
            const txStatus = txData.status; // e.g., "complete", "approved", "success"
            
            console.log(`[NotchPay] Transaction status: ${txStatus}`);
            
            if (txStatus === "complete" || txStatus === "approved" || txStatus === "paid" || txStatus === "success") {
              const invoiceDocRef = doc(db, "invoices", savedStoredInvoiceId);
              const projectDocRef = doc(db, "projects", savedStoredProjectId || "");
              const currentPaidAt = new Date().toISOString();
              const paymentMethodUsed = txData.channel || "Notch Pay Gateway";
              
              // Securely update invoice status in Firestore
              await updateDoc(invoiceDocRef, {
                status: "paid",
                method: paymentMethodUsed,
                transactionHash: activeRef,
                paidAt: currentPaidAt
              });
              
              // Update master project status optionally
              if (savedStoredProjectId) {
                const projectSnap = await getDoc(projectDocRef);
                if (projectSnap.exists()) {
                  const projData = projectSnap.data();
                  const currentProgVal = projData.progress || 0;
                  const currentStatusVal = projData.status || "brief";
                  
                  await updateDoc(projectDocRef, {
                    paymentStatus: "paid",
                    status: currentStatusVal === "brief" ? "design" : currentStatusVal,
                    progress: currentProgVal < 30 ? 35 : currentProgVal,
                    updatedAt: currentPaidAt
                  });
                }
              }
              
              setVerificationSuccess(true);
              setVerificationError("");
              
              // Evict staging reference keys
              localStorage.removeItem("pendingPaymentRef");
              localStorage.removeItem("pendingInvoiceId");
              localStorage.removeItem("pendingProjectId");
              
              // Flush parameters from the location query bar cleanly
              if (urlQueryRef) {
                const urlFlushPath = window.location.pathname;
                window.history.replaceState({}, document.title, urlFlushPath);
              }
            } else {
              setVerificationError(
                language === "fr" 
                  ? `Transaction non-finalisée (Statut de la passerelle : "${txStatus}").` 
                  : `Payment pending or incomplete (Gateway feedback: "${txStatus}").`
              );
            }
          } else {
            setVerificationError(result.error || "Cannot confirm invoice validation signature.");
          }
        } catch (err: any) {
          console.error("Client side verification error:", err);
          setVerificationError(err.message || "Network verification issue.");
        } finally {
          setIsVerifyingPayment(false);
        }
      }
    };

    if (isAuthenticated && auth.currentUser) {
      checkRedirectPayment();
    }
  }, [isAuthenticated, language]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const notif of unread) {
        const docRef = doc(db, "notifications", notif.id);
        await updateDoc(docRef, { read: true });
      }
    } catch (error) {
      console.error("Error marking all as read: ", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleCreateMockNotification = async (type: "milestone" | "message") => {
    if (!auth.currentUser) return;
    const nId = `mock-notif-${Date.now()}`;
    const notificationData: ClientNotification = {
      id: nId,
      userId: auth.currentUser.uid,
      title: type === "milestone"
        ? (language === "fr" ? "Jalon Projet Terminé 🚀" : "Project Milestone Achieved 🚀")
        : (language === "fr" ? "Message de l'Équipe 💬" : "New Message from Team 💬"),
      message: type === "milestone"
        ? (language === "fr" 
            ? "L'étape de validation 'Charte Graphique & UI Design' de votre projet Mobile a été complétée avec succès !"
            : "The 'Graphic layouts & UI Design' validation stage of your Mobile project has been successfully completed!")
        : (language === "fr"
            ? "Bonjour Partenaire ! Notre équipe d'ingénierie a finalisé le paramétrage de l'arborescence. Veuillez la passer en revue."
            : "Hello partner! Our engineering team has finalized the visual sitemap layout. Please check your files."),
      type,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "notifications", nId), notificationData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${nId}`);
    }
  };

  // Seed default demo projects helper
  const seedDemoProjectsForUser = async (uid: string) => {
    try {
      const demoProjects = [
        {
          id: `luc-proj-1-${uid.substring(0, 5)}`,
          title: "Yéma Deliveries Mobile App",
          type: "mobile" as const,
          cost: 950000,
          currency: "XAF" as const,
          status: "design" as const,
          progress: 35,
          paymentStatus: "pending" as const,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["Geolocalisation GPS", "Intégration WhatsApp Notifications", "Gateway MTN/Orange Money"]
        },
        {
          id: `luc-proj-2-${uid.substring(0, 5)}`,
          title: "E-Boutique Glamour Douala",
          type: "ecommerce" as const,
          cost: 500000,
          currency: "XAF" as const,
          status: "deployed" as const,
          progress: 100,
          paymentStatus: "paid" as const,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["Panier intelligent", "Certificat de sécurité SSL", "Console de gestion d'inventaire"]
        }
      ];

      for (const proj of demoProjects) {
        const projData = {
          id: proj.id,
          userId: uid,
          title: proj.title,
          type: proj.type,
          cost: proj.cost,
          currency: proj.currency,
          status: proj.status,
          progress: proj.progress,
          paymentStatus: proj.paymentStatus,
          createdAt: proj.createdAt,
          updatedAt: proj.createdAt,
          features: proj.features
        };
        try {
          await setDoc(doc(db, "projects", proj.id), projData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `projects/${proj.id}`);
        }

        const taxRate = proj.currency === "XAF" ? 0.1925 : 0.20;
        const tax = Math.round(proj.cost * taxRate);
        const total = proj.cost + tax;
        const invoiceId = `INV-${proj.id.replace("luc-proj-", "")}-${proj.createdAt.substring(2, 4)}${proj.createdAt.substring(5, 7)}`;

        const invoiceData = {
          id: invoiceId,
          projectId: proj.id,
          userId: uid,
          amount: proj.cost,
          tax: tax,
          total: total,
          currency: proj.currency,
          status: proj.paymentStatus === "paid" ? "paid" as const : "unpaid" as const,
          createdAt: proj.createdAt,
          method: proj.paymentStatus === "paid" ? "MTN Mobile Money" : "",
          transactionHash: proj.paymentStatus === "paid" ? `TXN-DEMO-${Math.floor(Math.random() * 89999 + 10000)}` : "",
          paidAt: proj.paymentStatus === "paid" ? proj.createdAt : ""
        };

        try {
          await setDoc(doc(db, "invoices", invoiceId), invoiceData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `invoices/${invoiceId}`);
        }
      }

      // Seed default demo notifications securely
      const demoNotifications: ClientNotification[] = [
        {
          id: `demo-notif-1-${uid.substring(0, 5)}`,
          userId: uid,
          title: language === "fr" ? "Brief Projet Validé 🚀" : "Project Specifications Scoped 🚀",
          message: language === "fr" 
            ? "Bienvenue chez Luciole Services ! Le cahier des charges de votre application mobile a été validé par nos ingénieurs."
            : "Welcome to Luciole Services! The specification brief for your mobile application has been reviewed and validated.",
          type: "milestone",
          read: false,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `demo-notif-2-${uid.substring(0, 5)}`,
          userId: uid,
          title: language === "fr" ? "Message de l'Équipe 💬" : "Message from Engineering Desk 💬",
          message: language === "fr"
            ? "Bonjour Partenaire ! Votre espace de suivi sécurisé est initialisé de manière transparente. N'hésitez pas à simuler de nouvelles notifications."
            : "Hello partner! Your tracking client vault has been securely initialized. Please explore progress metrics and settle statements as needed.",
          type: "message",
          read: false,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const notif of demoNotifications) {
        try {
          await setDoc(doc(db, "notifications", notif.id), notif);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `notifications/${notif.id}`);
        }
      }
    } catch (e) {
      console.error("Error seeding demo projects: ", e);
    }
  };

  // Set up Firebase Authentication change listener
  useEffect(() => {
    let unsubscribeProjects: (() => void) | null = null;
    let unsubscribeInvoices: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous listeners
      if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
      }
      if (unsubscribeInvoices) {
        unsubscribeInvoices();
        unsubscribeInvoices = null;
      }
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }
      if (unsubscribeUsers) {
        unsubscribeUsers();
        unsubscribeUsers = null;
      }

      if (firebaseUser) {
        setIsAuthenticated(true);
        setEmail(firebaseUser.email || "");
        
        // Load user profile details
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userProfileData = userSnap.data();
            setFullName(userProfileData.name || "");
            setPhone(userProfileData.phone || "");
          } else {
            const userProfileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "Client Partenaire",
              phone: "+237 600 00 00 00",
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userProfileData);
            setFullName(userProfileData.name);
            setPhone(userProfileData.phone);
          }
        } catch (error) {
          console.error("Error setting up user profile document: ", error);
        }

        const isUserAdmin = firebaseUser.email === "luciolenang@gmail.com";

        if (isUserAdmin) {
          unsubscribeUsers = onSnapshot(
            collection(db, "users"),
            (snapshot) => {
              const uList: any[] = [];
              snapshot.forEach((doc) => {
                uList.push(doc.data());
              });
              setAllUsers(uList);
            },
            (error) => {
              console.error("Error setting up user profiles list listener: ", error);
            }
          );
        }

        // Listener for Projects
        const projectsQuery = isUserAdmin
          ? query(collection(db, "projects"))
          : query(collection(db, "projects"), where("userId", "==", firebaseUser.uid));

        unsubscribeProjects = onSnapshot(
          projectsQuery,
          (snapshot) => {
            const list: ClientProject[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                userId: data.userId || "",
                title: data.title,
                type: data.type,
                cost: data.cost,
                currency: data.currency,
                status: data.status,
                progress: data.progress,
                paymentStatus: data.paymentStatus,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt || data.createdAt,
                features: data.features || []
              });
            });

            if (list.length === 0 && !isUserAdmin) {
              // Seed default projects securely
              seedDemoProjectsForUser(firebaseUser.uid);
            } else {
              setProjects(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, "projects");
          }
        );

        // Listener for Invoices
        const invoicesQuery = isUserAdmin
          ? query(collection(db, "invoices"))
          : query(collection(db, "invoices"), where("userId", "==", firebaseUser.uid));

        unsubscribeInvoices = onSnapshot(
          invoicesQuery,
          (snapshot) => {
            const list: ClientInvoice[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                projectId: data.projectId,
                userId: data.userId || "",
                amount: data.amount,
                tax: data.tax,
                total: data.total,
                currency: data.currency,
                status: data.status,
                createdAt: data.createdAt,
                method: data.method,
                transactionHash: data.transactionHash,
                paidAt: data.paidAt
              });
            });
            setInvoices(list);
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, "invoices");
          }
        );

        // Listener for Notifications
        const notificationsQuery = isUserAdmin
          ? query(collection(db, "notifications"))
          : query(collection(db, "notifications"), where("userId", "==", firebaseUser.uid));

        unsubscribeNotifications = onSnapshot(
          notificationsQuery,
          (snapshot) => {
            const list: ClientNotification[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                userId: data.userId || "",
                title: data.title || "",
                message: data.message || "",
                type: data.type || "message",
                read: !!data.read,
                createdAt: data.createdAt || ""
              });
            });
            setNotifications(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, "notifications");
          }
        );

      } else {
        setIsAuthenticated(false);
        setProjects([]);
        setInvoices([]);
        setNotifications([]);
        setAllUsers([]);
        setFullName("");
        setEmail("");
        setPhone("");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProjects) unsubscribeProjects();
      if (unsubscribeInvoices) unsubscribeInvoices();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  // Generate dynamic invoice for a project
  const getInvoiceForProject = (proj: ClientProject): ClientInvoice => {
    const found = invoices.find(inv => inv.projectId === proj.id);
    if (found) return found;

    const defaultAmount = proj.cost;
    const taxRate = proj.currency === "XAF" ? 0.1925 : 0.20;
    const tax = Math.round(defaultAmount * taxRate);
    const total = defaultAmount + tax;

    return {
      id: `INV-${proj.id.replace("luc-proj-", "")}-${proj.createdAt.substring(2, 4)}${proj.createdAt.substring(5, 7)}`,
      projectId: proj.id,
      userId: proj.userId,
      amount: defaultAmount,
      tax: tax,
      total: total,
      currency: proj.currency,
      status: proj.paymentStatus === "paid" ? "paid" : "unpaid",
      createdAt: proj.createdAt
    };
  };

  // Auth Submit Action (Email/Password)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setResetSuccessMessage("");
    
    if (!email) {
      setAuthError(language === "fr" ? "Veuillez remplir tous les champs requis." : "Please fill in all required fields.");
      return;
    }

    if (authMode === "signup") {
      if (!password) {
        setAuthError(language === "fr" ? "Veuillez renseigner votre mot de passe." : "Please fill in all required fields.");
        return;
      }
      if (!fullName) {
        setAuthError(language === "fr" ? "Veuillez renseigner votre nom complet." : "Please provide your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError(language === "fr" ? "Les mots de passe ne correspondent pas !" : "Passwords do not match!");
        return;
      }

      setIsAuthLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userProfile = {
          uid: user.uid,
          email: email,
          name: fullName,
          phone: phone || "+237 600 00 00 00",
          address: address || "Douala, Cameroun",
          createdAt: new Date().toISOString(),
          status: "active"
        };
        await setDoc(doc(db, "users", user.uid), userProfile);
        
        setFullName(fullName);
        setPhone(userProfile.phone);
        setAddress(userProfile.address);
        setConfirmPassword("");
        showToast(
          language === "fr" 
            ? `Inscription réussie ! Bienvenue ${fullName}.` 
            : `Registration successful! Welcome ${fullName}.`,
          "success"
        );
      } catch (error: any) {
        console.error("Auth sign up error: ", error);
        let errMsg = error.message;
        if (error.code === "auth/email-already-in-use") {
          errMsg = language === "fr" ? "Cette adresse e-mail est déjà utilisée." : "Email is already in use.";
        } else if (error.code === "auth/weak-password") {
          errMsg = language === "fr" ? "Le mot de passe doit contenir au moins 6 caractères." : "Password should be at least 6 characters.";
        }
        setAuthError(errMsg);
      } finally {
        setIsAuthLoading(false);
      }
      return;
    }

    // Login mode
    if (!password) {
      setAuthError(language === "fr" ? "Veuillez renseigner votre mot de passe." : "Please fill in all required fields.");
      return;
    }
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast(
        language === "fr" 
          ? "Connexion réussie ! Bienvenue sur votre Espace Client." 
          : "Login successful! Welcome to your Client Portal.",
        "success"
      );
    } catch (error: any) {
      console.error("Auth login error: ", error);
      let errMsg = error.message;
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errMsg = language === "fr" ? "Adresse email ou mot de passe incorrect." : "Invalid email address or password.";
      }
      setAuthError(errMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Forgot Password Submit Action
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setResetSuccessMessage("");
    
    if (!email) {
      setAuthError(language === "fr" ? "Veuillez entrer votre adresse e-mail." : "Please enter your email address.");
      return;
    }

    setIsAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccessMessage(
        language === "fr" 
          ? "Un e-mail de réinitialisation de mot de passe a été envoyé avec succès !" 
          : "A password reset email has been sent successfully!"
      );
    } catch (error: any) {
      console.error("Forgot password error: ", error);
      let errMsg = error.message;
      if (error.code === "auth/invalid-email") {
        errMsg = language === "fr" ? "Adresse e-mail non valide." : "Invalid email address.";
      } else if (error.code === "auth/user-not-found") {
        errMsg = language === "fr" ? "Aucun utilisateur trouvé avec cette adresse e-mail." : "No user found with this email address.";
      }
      setAuthError(errMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Deprecated simulated verification code handler
  const handleConfirmSignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError("");
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const userProfile = {
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || "Google User-Client",
          phone: "+237 600 00 00 00",
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, userProfile);
      }
      showToast(
        language === "fr" 
          ? `Connexion via Google réussie ! Bienvenue, ${user.displayName || "Client"}.` 
          : `Google login successful! Welcome, ${user.displayName || "Client"}.`,
        "success"
      );
    } catch (error: any) {
      console.error("Google login error: ", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign Out handle
  const handleLogOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeLogOutAction = async () => {
    try {
      await signOut(auth);
      setSelectedProjectId(null);
      setActivePaymentInvoice(null);
      showToast(
        language === "fr" 
          ? "Vous vous êtes déconnecté avec succès." 
          : "Successfully logged out.",
        "info"
      );
    } catch (error) {
      console.error("Sign out error: ", error);
    }
  };

  // Quick setup new project inside Firestore
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle || !auth.currentUser) return;

    try {
      const projId = `luc-proj-${Date.now().toString().substring(8)}`;
      const selectedFeaturesList = [
        newProjType === "mobile" ? "App Mobile Native (Android & iOS)" : "Interface Web Responsive",
        `Maintenance / Assistance technique (${calcMonths} mois)`,
        calcJingle ? "Signature sonore / Jingle publicitaire de marque (+50 000 XAF)" : null,
        calcLogo ? "Proposition de Logo professionnel & Identité visuelle (+100 000 XAF)" : null,
        calcVoiceOff ? "Voix-off Studio enregistrée pour promotion (+75 000 XAF)" : null,
        "Analyse SEO et optimisation de visibilité sur Google",
        "Hébergement cloud sécurisé avec certificat SSL inclus"
      ].filter(Boolean) as string[];

      const newProj = {
        id: projId,
        userId: auth.currentUser.uid,
        title: newProjTitle,
        type: newProjType,
        cost: newProjCost,
        currency: newProjCurrency,
        status: "brief" as const,
        progress: 10,
        paymentStatus: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: selectedFeaturesList
      };

      await setDoc(doc(db, "projects", projId), newProj);

      const taxRate = newProjCurrency === "XAF" ? 0.1925 : 0.20;
      const tax = Math.round(newProjCost * taxRate);
      const total = newProjCost + tax;
      const invoiceId = `INV-${projId.replace("luc-proj-", "")}-${newProj.createdAt.substring(2, 4)}${newProj.createdAt.substring(5, 7)}`;

      const invoiceData = {
        id: invoiceId,
        projectId: projId,
        userId: auth.currentUser.uid,
        amount: newProjCost,
        tax: tax,
        total: total,
        currency: newProjCurrency,
        status: "unpaid" as const,
        createdAt: newProj.createdAt
      };

      await setDoc(doc(db, "invoices", invoiceId), invoiceData);

      setNewProjTitle("");
      setIsCreatingProject(false);
      setSelectedProjectId(projId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "projects");
    }
  };

  // Import custom configured estimate from estimator
  const handleImportEstimatedProject = async () => {
    if (!auth.currentUser) return;
    try {
      const budgetTotal = 250000;
      const projId = `luc-proj-est-${Math.floor(Math.random() * 899 + 100)}`;
      const newProj = {
        id: projId,
        userId: auth.currentUser.uid,
        title: language === "fr" ? "Projet Personnalisé Estimé" : "Custom Estimated Project Plan",
        type: "vitrine" as const,
        cost: budgetTotal,
        currency: "XAF" as const,
        status: "brief" as const,
        progress: 15,
        paymentStatus: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: [
          language === "fr" ? "Design responsive haut de gamme" : "High-end responsive design",
          language === "fr" ? "Multi-langues Français & Anglais" : "French & English Multilingual SEO",
          language === "fr" ? "Optimisation SEO premium Google" : "Premium Google SEO optimizations"
        ]
      };

      await setDoc(doc(db, "projects", projId), newProj);

      const taxRate = 0.1925;
      const tax = Math.round(budgetTotal * taxRate);
      const total = budgetTotal + tax;
      const invoiceId = `INV-${projId.replace("luc-proj-", "")}-${newProj.createdAt.substring(2, 4)}${newProj.createdAt.substring(5, 7)}`;

      const invoiceData = {
        id: invoiceId,
        projectId: projId,
        userId: auth.currentUser.uid,
        amount: budgetTotal,
        tax: tax,
        total: total,
        currency: "XAF" as const,
        status: "unpaid" as const,
        createdAt: newProj.createdAt
      };

      await setDoc(doc(db, "invoices", invoiceId), invoiceData);

      setSelectedProjectId(projId);
      setActiveTab("projects");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "projects");
    }
  };

  // Initiate invoice checkout workflow
  const handlePayInvoiceClick = (invoice: ClientInvoice) => {
    setActivePaymentInvoice(invoice);
    setPaymentMethod(null);
    setPaymentStep("idle");
    setPaymentLogs([]);
    
    if (auth.currentUser) {
      setPaymentClientEmail(auth.currentUser.email || "");
      const names = (fullName || auth.currentUser.displayName || "Client").split(" ");
      setPaymentClientFirstName(names[0] || "");
      setPaymentClientLastName(names.slice(1).join(" ") || "");
      setPaymentClientPhone(phone || "");
      setPaymentPhone(phone || "");
    }
  };

  // Trigger MTN MoMo / Orange Money / Cards step progress simulation
  const handleStartPaymentEmulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;

    setPaymentStep("connecting");
    const methodLabel = paymentMethod === "Orange" ? "Orange Money" : paymentMethod === "MTN" ? "MTN Mobile Money" : paymentMethod === "Visa" ? "Visa Card" : "Mastercard";
    const detailLog = paymentMethod === "Orange" || paymentMethod === "MTN" ? paymentPhone : paymentCardName;
    
    setPaymentLogs([
      language === "fr" ? `Connexion sécurisée aux serveurs de Luciole Services...` : "Establishing secure link to Luciole Services gateway...",
      language === "fr" ? `Initialisation de la passerelle de paiement [${methodLabel}]` : `Initializing [${methodLabel}] payment gateway API module...`,
      language === "fr" ? `Envoi de la requête de débit pour ${detailLog}...` : `Sending charge request credentials for ${detailLog}...`
    ]);

    // Step 2: Trigger OTP simulation for Mobile Wallet
    setTimeout(() => {
      if (paymentMethod === "Orange" || paymentMethod === "MTN") {
        const randomOtp = Math.floor(Math.random() * 8999 + 1000).toString();
        setOtpCode(randomOtp);
        setPaymentStep("otp_wait");
        setPaymentLogs(prev => [
          ...prev,
          language === "fr" 
            ? `⚠️ [SIMULATION ACCÈS : Code d'approbation envoyé sur votre téléphone : ${randomOtp}]` 
            : `⚠️ [SIMULATION SYSTEM: OTP confirmation code dispatched to your handset: ${randomOtp}]`,
          language === "fr" ? "Veuillez entrer le code de sécurité à 4 chiffres." : "Please enter the 4-digit verification code below."
        ]);
      } else {
        // Direct processing for credit cards list
        setPaymentStep("processing");
        setPaymentLogs(prev => [
          ...prev,
          language === "fr" ? "Authentification 3D Secure par carte bancaire..." : "Verifying credit authentication 3D Secure credentials...",
          language === "fr" ? "Vérification des fonds en cours..." : "Authorizing transaction funds..."
        ]);
        
        setTimeout(() => {
          triggerSuccessPayment();
        }, 1500);
      }
    }, 1500);
  };

  // Confirm verification code code submit
  const handleVerifyOtpCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOtp !== otpCode) {
      setPaymentLogs(prev => [
        ...prev,
        language === "fr" ? "❌ Code d'authentification invalide. Veuillez réessayer." : "❌ Code mistmatch. Try again."
      ]);
      return;
    }

    setPaymentStep("processing");
    setPaymentLogs(prev => [
      ...prev,
      language === "fr" ? "Authentification réussie." : "Verification accepted.",
      language === "fr" ? "Transactions Mobile Money validée avec succès !" : "Processing direct merchant payment..."
    ]);

    setTimeout(() => {
      triggerSuccessPayment();
    }, 1200);
  };

  // Complete payments updates in Firestore
  const triggerSuccessPayment = async () => {
    if (!activePaymentInvoice || !auth.currentUser) return;

    try {
      setPaymentStep("completed");
      const finalMethod = paymentMethod === "Orange" ? "Orange Money" : paymentMethod === "MTN" ? "MTN Mobile Money" : paymentMethod === "Visa" ? "Visa" : "Mastercard";
      const paidAtStr = new Date().toISOString();
      const finalTxnHash = `LUC-TXN-${Date.now().toString().substring(6)}-${Math.floor(Math.random() * 899 + 100)}`;

      const invoiceRef = doc(db, "invoices", activePaymentInvoice.id);
      const projectRef = doc(db, "projects", activePaymentInvoice.projectId);

      await updateDoc(invoiceRef, {
        status: "paid",
        method: finalMethod,
        transactionHash: finalTxnHash,
        paidAt: paidAtStr
      });

      // Update project status optionally
      const projSnap = await getDoc(projectRef);
      if (projSnap.exists()) {
        const projData = projSnap.data();
        const currentProgress = projData.progress || 0;
        const currentStatus = projData.status || "brief";

        await updateDoc(projectRef, {
          paymentStatus: "paid",
          status: currentStatus === "brief" ? "design" : currentStatus,
          progress: currentProgress < 30 ? 35 : currentProgress,
          updatedAt: new Date().toISOString()
        });
      }

      // Update local view invoice
      setActivePaymentInvoice(prev => prev ? {
        ...prev,
        status: "paid",
        method: finalMethod,
        transactionHash: finalTxnHash,
        paidAt: paidAtStr
      } : null);

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "invoices");
    }
  };

  // Real secure Notch Pay session checkout initiator
  const handleStartRealPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    setPaymentStep("connecting");
    setPaymentLogs([
      language === "fr" 
        ? "Génération de la session de paiement sécurisée..." 
        : "Generating secure online checkout session...",
      language === "fr"
        ? "Liaison au serveur de passerelle universel (MTN, Orange Money, Cartes)..."
        : "Establishing connection with universal checkout (MTN, Orange, Credit Cards)..."
    ]);

    try {
      const customerFullName = `${paymentClientFirstName} ${paymentClientLastName}`.trim();
      const callbackPath = window.location.origin + window.location.pathname;

      console.log("[NotchPay] Requesting checkout session from API...");
      const response = await fetch("/api/pay/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: activePaymentInvoice.total,
          currency: activePaymentInvoice.currency,
          email: paymentClientEmail.trim(),
          name: customerFullName || auth.currentUser?.email || "Partner Client",
          phone: paymentClientPhone.trim() || undefined,
          description: `Luciole Services - Invoice ${activePaymentInvoice.id}`,
          invoiceId: activePaymentInvoice.id,
          callbackUrl: callbackPath
        })
      });

      const result = await response.json() as any;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Cannot create payment checkout URL.");
      }

      const checkoutUrl = result.data?.data?.authorization_url;
      const paymentReference = result.data?.data?.reference;

      if (!checkoutUrl || !paymentReference) {
        throw new Error("Invalid payload containing empty authorization url or billing key.");
      }

      setPaymentLogs(prev => [
        ...prev,
        language === "fr" ? "✅ Session générée avec succès !" : "✅ Session created successfully!",
        language === "fr" ? "Redirection vers l'espace de paiement sécurisé..." : "Redirecting to secure payment page..."
      ]);

      // Cache details in localStorage for dynamic validation on redirect back
      localStorage.setItem("pendingPaymentRef", paymentReference);
      localStorage.setItem("pendingInvoiceId", activePaymentInvoice.id);
      localStorage.setItem("pendingProjectId", activePaymentInvoice.projectId);

      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 900);

    } catch (err: any) {
      console.error("[NotchPay] Error initializing payment:", err);
      setPaymentStep("idle");
      setPaymentLogs(prev => [
        ...prev,
        `❌ ${language === "fr" ? "Erreur de connexion" : "Connection error"}: ${err.message || "Failed to initialize payment gateway API"}`
      ]);
    }
  };

  // Manual payment state checker as a safety net
  const handleManualPaymentVerify = async () => {
    const savedRef = localStorage.getItem("pendingPaymentRef");
    const savedInvoiceId = localStorage.getItem("pendingInvoiceId");
    const savedProjectId = localStorage.getItem("pendingProjectId");

    if (!savedRef || !savedInvoiceId) {
      alert(language === "fr" ? "Aucun enregistrement de transaction trouvé localement." : "No active transaction keys located local-side.");
      return;
    }

    setIsVerifyingPayment(true);
    setVerificationError("");
    setVerificationSuccess(false);

    try {
      const res = await fetch(`/api/pay/verify/${savedRef}`);
      const result = await res.json() as any;

      if (result.success && result.data?.data) {
        const txData = result.data.data;
        const txStatus = txData.status;

        if (txStatus === "complete" || txStatus === "approved" || txStatus === "paid" || txStatus === "success") {
          const invoiceRef = doc(db, "invoices", savedInvoiceId);
          const projectRef = doc(db, "projects", savedProjectId || "");
          const paidAtStr = new Date().toISOString();
          const methodUsed = txData.channel || "Notch Pay Gateway";

          await updateDoc(invoiceRef, {
            status: "paid",
            method: methodUsed,
            transactionHash: savedRef,
            paidAt: paidAtStr
          });

          if (savedProjectId) {
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
              const projData = projectSnap.data();
              const currentProg = projData.progress || 0;
              const currentStat = projData.status || "brief";

              await updateDoc(projectRef, {
                paymentStatus: "paid",
                status: currentStat === "brief" ? "design" : currentStat,
                progress: currentProg < 30 ? 35 : currentProg,
                updatedAt: paidAtStr
              });
            }
          }

          setVerificationSuccess(true);
          localStorage.removeItem("pendingPaymentRef");
          localStorage.removeItem("pendingInvoiceId");
          localStorage.removeItem("pendingProjectId");
        } else {
          setVerificationError(
            language === "fr"
              ? `Votre paiement n'est pas encore complété (Statut : "${txStatus}").`
              : `Your payment is not complete yet (Status: "${txStatus}").`
          );
        }
      } else {
        setVerificationError(result.error || "Failed to verify transaction status.");
      }
    } catch (err: any) {
      setVerificationError(err.message || "Network checking error.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Computed details of currently selected project
  const currentProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <section id="espace-client" className={`py-24 border-t transition-colors duration-300 relative z-30 ${
      theme === "light" 
        ? "bg-gradient-to-b from-slate-50 to-white text-slate-800 border-slate-200" 
        : "bg-transparent text-slate-100 border-white/5"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-gold font-bold uppercase tracking-[0.2em] text-xs block mb-3">
            {language === "fr" ? "Espace Utilisateur Premium" : "Client Workspace Portal"}
          </span>
          <h2 className={`font-display font-black text-3xl sm:text-4xl leading-tight mb-3 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            {language === "fr" ? "Suivi de Projet & Facturation" : "Project Progress & Billing"}
          </h2>
          <p className={`text-base leading-relaxed ${
            theme === "light" ? "text-slate-600" : "text-slate-400"
          }`}>
            {language === "fr" 
              ? "Connectez-vous pour suivre en direct l'avancement de vos applications, consulter vos devis et régler vos factures via Mobile Money ou Carte."
              : "Sign in to track real-time coding milestones, check legal documents, and settle statements."
            }
          </p>
        </div>

        {/* 1. AUTHENTICATION SHIELD */}
        {!isAuthenticated ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8">
            {/* Left Column: Brand Showcase like Facebook/Stripe International */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/35 text-gold text-xs font-bold tracking-wide">
                  <Globe size={13} className="animate-spin-slow" />
                  <span>{language === "fr" ? "Portail Entreprise International" : "International Corporate Portal"}</span>
                </div>
                
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none">
                  <span className="text-gold">Luciole</span>{" "}
                  <span className={theme === "light" ? "text-slate-900" : "text-white"}>Services</span>
                </h1>
                
                <p className={`text-base sm:text-lg leading-relaxed max-w-xl ${
                  theme === "light" ? "text-slate-600" : "text-slate-300"
                }`}>
                  {language === "fr"
                    ? "Avec notre espace partenaire de classe internationale, gérez l'intégralité de vos projets digitaux et audiovisuels, consultez vos devis en temps réel et réglez vos transactions en toute sérénité."
                    : "Manage your complex digital solutions and international audio productions directly from our responsive partner terminal with multi-currency options."}
                </p>
              </div>

              {/* Feature Highlights bento block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className={`p-4 rounded-2xl border transition hover:shadow-md ${
                  theme === "light" ? "bg-white/65 border-slate-100" : "bg-white/5 border-white/5"
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-3">
                    <ShieldCheck size={18} />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${theme === "light" ? "text-slate-850" : "text-white"}`}>
                    {language === "fr" ? "Sécurité de Bout en Bout" : "End to End Encryption"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === "fr" ? "Authentification double facteur pour protéger vos cahiers des charges." : "Secure sessions to safeguard your source variables and specifications."}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border transition hover:shadow-md ${
                  theme === "light" ? "bg-white/65 border-slate-100" : "bg-white/5 border-white/5"
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-3">
                    <CreditCard size={18} />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${theme === "light" ? "text-slate-850" : "text-white"}`}>
                    {language === "fr" ? "Passerelle Multi-Devises" : "Seamless Pay Gateways"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === "fr" ? "Règlement en un clic via MTN, Orange Money ou carte de crédit nationale et mondiale." : "Direct authorization for local wallets or general Mastercard/Visa forms."}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border transition hover:shadow-md ${
                  theme === "light" ? "bg-white/65 border-slate-100" : "bg-white/5 border-white/5"
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-3">
                    <Bell size={18} />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${theme === "light" ? "text-slate-850" : "text-white"}`}>
                    {language === "fr" ? "Alertes Temps Réel" : "Live Progress Tracking"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === "fr" ? "Notifications instantanées lors du franchissement d'un jalon technique." : "Get instant feedback and alerts as our engineering nodes hit key milestones."}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border transition hover:shadow-md ${
                  theme === "light" ? "bg-white/65 border-slate-100" : "bg-white/5 border-white/5"
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-3">
                    <FileText size={18} />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${theme === "light" ? "text-slate-850" : "text-white"}`}>
                    {language === "fr" ? "Devis & Suivi Simplifié" : "Sleek Statements"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === "fr" ? "Générez d'élégants rapports récapitulatifs en PDF ou factures certifiées." : "Transact and print instant digital receipts and secure certificates."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Facebook-like/Stripe-like Auth Card */}
            <div className="lg:col-span-5 bg-transparent">
              <div className={`rounded-3xl border p-8 shadow-2xl backdrop-blur-md transition duration-300 relative ${
                theme === "light" 
                  ? "bg-white border-slate-200 shadow-slate-200/50" 
                  : "bg-slate-900/40 border-white/10 shadow-black/80"
              }`}>
                
                {/* Secure Badge icon top right of card */}
                <span className="absolute top-4 right-4 text-emerald-500 flex items-center gap-1 text-[10px] font-mono tracking-widest font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={11} />
                  SSL SAFE
                </span>

                {/* Form header */}
                <div className="text-left mb-6">
                  <h3 className={`font-display font-black text-2xl leading-tight mb-1.5 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                    {authMode === "login" 
                      ? (language === "fr" ? "Connexion Partenaire" : "Partner Gateway Sign In") 
                      : authMode === "forgot_password"
                        ? (language === "fr" ? "Restauration d'accès" : "Access Recovery")
                        : (language === "fr" ? "Inscription Partenaire" : "Register Enterprise Client")
                    }
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    {authMode === "login" 
                      ? (language === "fr" ? "Accédez en toute sécurité à vos logiciels et factures." : "Access authorization node locally or with biometric values.")
                      : authMode === "forgot_password"
                        ? (language === "fr" ? "Réinitialisez votre clé secrète en un clic." : "Enter enterprise verification email for recovery.")
                        : (language === "fr" ? "Créez votre profil pour l'alignement de nos livrables." : "Deploy temporary access database profiles safely.")
                    }
                  </p>
                </div>

                {authError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2 animate-shake">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {resetSuccessMessage && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeUp">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                {/* Submit Forms */}
                {authMode === "forgot_password" ? (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 animate-fadeUp">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        {language === "fr" ? "Adresse E-mail *" : "Email Address *"}
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@luciole-serves.com"
                          className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 rounded-xl font-bold bg-gold hover:bg-gold-light text-white font-display text-xs uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {isAuthLoading ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        language === "fr" ? "Envoyer le lien de réinitialisation" : "Send Reset Link"
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError("");
                          setResetSuccessMessage("");
                        }}
                        className="text-xs text-gold font-bold hover:underline cursor-pointer"
                      >
                        {language === "fr" ? "← Retourner à la connexion" : "← Back to Sign In"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === "signup" && (
                      <div className="animate-fadeUp">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                          {language === "fr" ? "Nom Complet / Entreprise *" : "Company / Full Name *"}
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Africa Consult Group"
                            className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="animate-fadeUp">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        {language === "fr" ? "Adresse E-mail de Connexion *" : "Enterprise Email Address *"}
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@luciole-serves.com"
                          className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {authMode === "signup" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeUp">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            {language === "fr" ? "Ville & Pays *" : "City & Country *"}
                          </label>
                          <div className="relative">
                            <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Douala, Cameroun"
                              className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                                theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            {language === "fr" ? "Téléphone WhatsApp *" : "WhatsApp Handset *"}
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+237 699 95 80 89"
                            className={`w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="animate-fadeUp">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {language === "fr" ? "Mot de passe de Sécurité *" : "Secret Password *"}
                        </label>
                        {authMode === "login" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("forgot_password");
                              setAuthError("");
                              setResetSuccessMessage("");
                            }}
                            className="text-[11px] text-gold font-bold hover:underline cursor-pointer"
                          >
                            {language === "fr" ? "Mot de passe oublié ?" : "Forgot password?"}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {authMode === "signup" && (
                      <div className="animate-fadeUp">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                          {language === "fr" ? "Confirmer le Mot de Passe *" : "Confirm Secret Password *"}
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all duration-200 ${
                              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 mt-2 rounded-xl font-bold bg-gold hover:bg-gold-light text-white font-display text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold/15 hover:shadow-gold/25 transform active:scale-[0.98]"
                    >
                      {isAuthLoading ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : authMode === "login" ? (
                        language === "fr" ? "Se Connecter" : "Log In Securely"
                      ) : (
                        language === "fr" ? "Créer l'Espace Collaboratif" : "Initialize Client Account"
                      )}
                    </button>
                  </form>
                )}

                {/* Switch Login / Sign Up buttons - Styled like Facebook's "Create New Account" bottom divider but highly elegant */}
                {authMode !== "forgot_password" && (
                  <div className="space-y-4 pt-6 mt-6 border-t border-slate-500/10 text-center">
                    <p className="text-xs text-slate-400">
                      {authMode === "login"
                        ? (language === "fr" ? "Nouveau chez Luciole Services ?" : "New corporate customer?")
                        : (language === "fr" ? "Vous êtes déjà enregistré ?" : "Already registered as an enterprise partner?")
                      }
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "login" ? "signup" : "login");
                        setAuthError("");
                        setResetSuccessMessage("");
                      }}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold border border-gold text-gold hover:bg-gold hover:text-white transition duration-200 cursor-pointer w-full text-center"
                    >
                      {authMode === "login"
                        ? (language === "fr" ? "Créer un espace partenaire client" : "Create new corporate space")
                        : (language === "fr" ? "Retour à la page de connexion" : "Return to Log In")
                      }
                    </button>
                  </div>
                )}

                {/* Third-party Sign In option (Google) */}
                {authMode !== "forgot_password" && (
                  <div className="mt-4">
                    <div className="relative my-4 text-center">
                      <span className="absolute inset-x-0 top-1/2 border-b border-slate-500/10" />
                      <span className={`relative text-[10px] font-bold uppercase tracking-wider px-2.5 ${theme === "light" ? "bg-white text-slate-450" : "bg-[#1c2637] text-slate-400"}`}>
                        {language === "fr" ? "Authentification alternative" : "Alternative Credentials"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className={`w-full py-2.5 px-4 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                        theme === "light" 
                          ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-205" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-gold/30"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>{language === "fr" ? "Se connecter avec Google Client Connect" : "Connect with Google Workspace Client"}</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        ) : (
          
          /* 2. AUTHENTICATED BOARD SYSTEM */
          <div className="space-y-6">
            
            {/* Unified Top Navigation Header with Notification Center */}
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
              theme === "light" 
                ? "bg-white/80 border-slate-200/80 shadow-slate-100" 
                : "bg-slate-900/60 border-white/5 shadow-black/40"
            }`}>
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/25">
                  <Sparkles size={18} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-mono text-gold font-extrabold uppercase tracking-widest block leading-none">
                    {language === "fr" ? "PRODUCTIONS DIGITALES" : "DIGITAL COMPONENT HUB"}
                  </span>
                  <h3 className={`text-base font-black truncate leading-tight mt-1 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                    {language === "fr" ? "Cabinet de Pilotage en Temps Réel" : "Real-time Operations Suite"}
                  </h3>
                </div>
              </div>

              {/* Notification Badge Group & Status */}
              <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-t-0 border-slate-500/10 pt-3 sm:pt-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold tracking-wider ${
                  theme === "light" 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-150" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYNCED
                </span>

                {/* Real-time Notification Center Controller */}
                <div className="relative">
                  {/* Notification Bell Button */}
                  <button
                    id="notification-bell"
                    type="button"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`relative p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
                      theme === "light" 
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800" 
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                    }`}
                  >
                    <Bell size={16} />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-mono font-extrabold text-white items-center justify-center">
                          {unreadNotificationsCount}
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel for Notification Center */}
                  {isNotificationOpen && (
                    <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border shadow-2xl p-4 z-50 text-left animate-fadeUp ${
                      theme === "light" 
                        ? "bg-white border-slate-200 shadow-slate-300 text-slate-900" 
                        : "bg-[#162031] border-white/10 shadow-black/85 text-white"
                    }`}>
                      <div className="flex items-center justify-between border-b border-dashed border-slate-500/15 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-gold" />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                            {language === "fr" ? "Alertes & Messages" : "Alert Center & Inbox"}
                          </h4>
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                          >
                            {language === "fr" ? "Tout marquer lu" : "Mark all read"}
                          </button>
                        )}
                      </div>

                      {/* Notification list controls */}

                      {/* Log / Alert queue */}
                      <div className="max-h-64 overflow-y-auto space-y-2.5 divide-y divide-dashed divide-slate-500/10 min-h-[60px]">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-xs">
                            {language === "fr" 
                              ? "Aucun message ou jalon récent reçu." 
                              : "No milestones or team letters reported."
                            }
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`pt-2.5 first:pt-0 flex items-start gap-2.5 ${!notif.read ? "bg-amber-500/5 border-l-2 border-gold -mx-4 px-4 py-1.5 rounded-lg" : ""}`}>
                              <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center ${
                                notif.type === "milestone" ? "text-gold" : "text-blue-400"
                              }`}>
                                {notif.type === "milestone" ? <Sparkles size={12} /> : <MessageSquare size={12} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className={`text-[11px] font-black truncate leading-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                                    {notif.title}
                                  </h5>
                                  <span className="text-[8px] font-mono text-slate-500 shrink-0">
                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-450 mt-1 leading-relaxed">
                                  {notif.message}
                                </p>
                                <div className="flex justify-between items-center mt-2 border-t border-slate-500/5 pt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="text-[9px] text-red-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                                  >
                                    <Trash2 size={10} />
                                    <span>{language === "fr" ? "Supprimer" : "Delete"}</span>
                                  </button>

                                  {!notif.read && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                                    >
                                      ✓ {language === "fr" ? "Lu" : "Read"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar navigation control card */}
            <div className={`lg:col-span-3 border rounded-3xl p-6 shadow-xl ${
              theme === "light" ? "bg-white border-slate-200" : "bg-[#1e293b]/30 border-white/5 backdrop-blur-md"
            }`}>
              
              {/* Profile Card badge */}
              <div className="flex items-center gap-3.5 border-b border-dashed border-slate-500/20 pb-5 mb-5 text-left">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-[#3b82f6] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className={`text-sm font-black truncate leading-none mb-1 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                    {fullName}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">{email}</span>
                </div>
              </div>

               {/* Sidebar Tabs */}
              <div className="space-y-1.5 mb-6">
                {(() => {
                  const menuTabs = [
                    { id: "projects", label: language === "fr" ? "📊 Mes Projets" : "📊 Project Milestones", icon: Smartphone },
                    { id: "billing", label: language === "fr" ? "💳 Factures & Paiements" : "💳 Billing Receipts", icon: FileText },
                  ];
                  if (email === "luciolenang@gmail.com") {
                    menuTabs.push({
                      id: "admin",
                      label: language === "fr" ? "👑 Espace Admin" : "👑 Admin Workspace",
                      icon: ShieldCheck
                    });
                  }
                  return menuTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setSelectedProjectId(null); setActivePaymentInvoice(null); }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition-all cursor-pointer ${
                          isActive
                            ? "bg-gold text-white font-extrabold shadow-md shadow-gold/15"
                            : theme === "light"
                              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Import pending estimate alert */}
              <div className={`p-4 rounded-2xl mb-6 text-left border ${
                theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#020617]/40 border-white/5"
              }`}>
                <h5 className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1 flex items-center gap-1.5 leading-none">
                  <Sparkles size={11} />
                  <span>{language === "fr" ? "Devis en Attente" : "Pending Estimate"}</span>
                </h5>
                <p className="text-[10.5px] text-slate-400 leading-normal mb-3">
                  {language === "fr" 
                    ? "Vous avez un projet configuré dans notre outil d'estimation de budget ?" 
                    : "You have a project configured in our budgeting estimator tool?"
                  }
                </p>
                <button
                  type="button"
                  onClick={handleImportEstimatedProject}
                  className="w-full py-2 rounded-lg bg-gold/10 hover:bg-gold text-gold hover:text-white border border-gold/20 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  {language === "fr" ? "Importer le projet" : "Import Estimated project"}
                </button>
              </div>

              {/* Log out option */}
              <button
                type="button"
                onClick={handleLogOut}
                className="w-full py-3.5 rounded-xl font-bold hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20 text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer pt-3 border-t border-dashed"
              >
                <LogOut size={13} />
                <span>{language === "fr" ? "Se Déconnecter" : "Sign Out"}</span>
              </button>

            </div>

            {/* Main Area Workspace content panels */}
            <div className="lg:col-span-9">
              
              {/* AREA A: MY PROJECTS TAB */}
              {activeTab === "projects" && !selectedProjectId && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className={`font-display font-black text-xl leading-none ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                        {language === "fr" ? "Tableau de Suivi des livrables" : "Active Coding Lifecycles"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {language === "fr" ? "Suivez les étapes de prototypage et test en temps réel" : "Real-time updates directly from Douala engineering branch"}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCreatingProject(true)}
                      className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-white text-xs font-bold leading-none flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>{language === "fr" ? "Lancer un projet" : "Initiate Project"}</span>
                    </button>
                  </div>

                  {/* Create project dialog panel */}
                  {isCreatingProject && (
                    <form 
                      onSubmit={handleCreateProject}
                      className={`border rounded-3xl p-6 md:p-8 text-left animate-fadeUp shadow-2xl ${
                        theme === "light" ? "bg-white border-slate-200" : "bg-[#111827]/80 border-white/5 backdrop-blur-md"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-4 mb-6 border-dashed border-slate-500/20">
                        <div>
                          <h4 className={`text-base font-black ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                            {language === "fr" ? "Configurateur de Projet sur Mesure" : "Tailor-Made Project Configurator"}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {language === "fr" ? "Ajustez vos options pour obtenir un devis instantané réaliste" : "Adjust your specifications to calculate instant pricing dynamically"}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-gold/15 text-gold border border-gold/10">
                          {language === "fr" ? "Édition Devis" : "Quote Draft"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{language === "fr" ? "Nom de votre Projet *" : "Project Title *"}</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex: Refonte Site E-Commerce / App Mob"
                            value={newProjTitle}
                            onChange={(e) => setNewProjTitle(e.target.value)}
                            className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none focus:border-gold transition ${
                              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{language === "fr" ? "Type d'Infrastructure principale" : "Core Platform"}</label>
                          <select
                            value={newProjType}
                            onChange={(e) => setNewProjType(e.target.value as any)}
                            className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none cursor-pointer focus:border-gold transition ${
                              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#1f2937] text-white border-white/10"
                            }`}
                          >
                            <option value="vitrine">🌐 Site Web Vitrine Professionnel (Base: 250 000 XAF)</option>
                            <option value="ecommerce">🛒 Plateforme E-Commerce Complète (Base: 500 000 XAF)</option>
                            <option value="mobile">📱 Application Mobile Double iOS & Android (Base: 900 000 XAF)</option>
                            <option value="design">🎨 Charte Graphique & Branding Premium (Base: 100 000 XAF)</option>
                            <option value="pub-spot">🎙️ Spot Commercial / Jingle Audio Studio (Base: 150 000 XAF)</option>
                          </select>
                        </div>
                      </div>

                      {/* Support & Maintenance Duration Selectors */}
                      <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                          {language === "fr" ? "Durée de l'Assistance & Maintenance Technique Luciole" : "Luciole Support & Maintenance Duration"}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { value: 0, label: language === "fr" ? "0 mois (Support initial)" : "0 mo (Init support)", price: "+0" },
                            { value: 3, label: language === "fr" ? "3 mois d'assistance" : "3 mo assistance", price: "Inclus" },
                            { value: 6, label: language === "fr" ? "6 mois de maintenance" : "6 mo maintenance", price: "+35 000 XAF" },
                            { value: 12, label: language === "fr" ? "12 mois d'assistance complète" : "12 mo premium maintenance", price: "+100 000 XAF" }
                          ].map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => setCalcMonths(option.value as any)}
                              className={`py-3 px-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                calcMonths === option.value
                                  ? "bg-gold border-gold text-white font-extrabold shadow-md shadow-gold/15"
                                  : theme === "light"
                                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                              }`}
                            >
                              <span className="text-xs">{option.label}</span>
                              <span className={`text-[9px] font-mono ${calcMonths === option.value ? "text-white/80" : "text-amber-500 font-bold"}`}>
                                {option.price}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Addons Selectors */}
                      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                          calcLogo ? "border-gold/50 bg-gold/5" : "border-slate-500/10"
                        }`}>
                          <input
                            type="checkbox"
                            id="calcLogo"
                            checked={calcLogo}
                            disabled={newProjType === "design"}
                            onChange={(e) => setCalcLogo(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded accent-gold focus:ring-gold cursor-pointer"
                          />
                          <label htmlFor="calcLogo" className="text-left shrink-1 select-none cursor-pointer">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">🎨 Création Logo (+100k)</span>
                            <span className="block text-[10px] leading-tight text-slate-500">Intégration d'une identité de marque moderne et chartée.</span>
                          </label>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                          calcJingle ? "border-gold/50 bg-gold/5" : "border-slate-500/10"
                        }`}>
                          <input
                            type="checkbox"
                            id="calcJingle"
                            checked={calcJingle}
                            onChange={(e) => setCalcJingle(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded accent-gold focus:ring-gold cursor-pointer"
                          />
                          <label htmlFor="calcJingle" className="text-left shrink-1 select-none cursor-pointer">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">🎙️ Spot Jingle (+50k)</span>
                            <span className="block text-[10px] leading-tight text-slate-500">Un habillage sonore identitaire réalisé par un ingénieur son.</span>
                          </label>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                          calcVoiceOff ? "border-gold/50 bg-gold/5" : "border-slate-500/10"
                        }`}>
                          <input
                            type="checkbox"
                            id="calcVoiceOff"
                            checked={calcVoiceOff}
                            onChange={(e) => setCalcVoiceOff(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded accent-gold focus:ring-gold cursor-pointer"
                          />
                          <label htmlFor="calcVoiceOff" className="text-left shrink-1 select-none cursor-pointer">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">🗣️ Voix-Off Studio (+75k)</span>
                            <span className="block text-[10px] leading-tight text-slate-500">Une voix off de studio Pro pour accompagner vos supports.</span>
                          </label>
                        </div>
                      </div>

                      {/* Currency & Financial Overview Card */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4 border-t border-dashed border-slate-500/20 mb-6">
                        <div className="md:col-span-4 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{language === "fr" ? "Devise du Contrat" : "Contract Currency"}</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNewProjCurrency("XAF")}
                              className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition cursor-pointer ${
                                newProjCurrency === "XAF" ? "bg-gold text-white border-gold shadow-md" : theme === "light" ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10"
                              }`}
                            >XAF (CFA)</button>
                            <button
                              type="button"
                              onClick={() => setNewProjCurrency("EUR")}
                              className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition cursor-pointer ${
                                newProjCurrency === "EUR" ? "bg-gold text-white border-gold shadow-md" : theme === "light" ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10"
                              }`}
                            >EUR (€)</button>
                          </div>
                        </div>

                        {/* Realtime quote calculations box */}
                        <div className={`md:col-span-8 p-5 rounded-2xl border text-left ${
                          theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/5"
                        }`}>
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="text-slate-400 font-bold">{language === "fr" ? "Budget HT Estimé :" : "Estimated Cost (Pre-tax) :"}</span>
                            <span className={`font-black font-mono ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                              {formatCurrency(newProjCost, newProjCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2.5 text-xs pb-2 border-b border-dashed border-slate-500/20 text-slate-400">
                            <span>{language === "fr" ? "Taxes d'administration (19.25% XAF / 20% EUR) :" : "Processing Taxes :"}</span>
                            <span className="font-mono">
                              {formatCurrency(Math.round(newProjCost * (newProjCurrency === "XAF" ? 0.1925 : 0.20)), newProjCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-gold uppercase tracking-wider">{language === "fr" ? "TOTAL CLÉ EN MAIN (TTC) :" : "NET TOTAL (TAX INCL.) :"}</span>
                            <span className="text-lg font-black font-mono text-gold">
                              {formatCurrency(newProjCost + Math.round(newProjCost * (newProjCurrency === "XAF" ? 0.1925 : 0.20)), newProjCurrency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCreatingProject(false)}
                          className={`px-5 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            theme === "light" ? "border-slate-200 text-slate-500 hover:bg-slate-100" : "border-white/10 text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          {language === "fr" ? "Annuler" : "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-xl bg-gold text-white hover:bg-gold-light text-xs font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-gold/15"
                        >
                          {language === "fr" ? "Créer ce Projet & Facture" : "Generate Custom Proposal"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Dynamic Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((proj) => {
                      const IconType = proj.type === "mobile" ? Smartphone : proj.type === "ecommerce" || proj.type === "vitrine" ? Laptop : Database;
                      return (
                        <div
                          key={proj.id}
                          className={`border rounded-2xl p-5 text-left flex flex-col justify-between transition-all duration-350 hover:shadow-lg relative overflow-hidden group ${
                            theme === "light" ? "bg-white border-slate-200/80 shadow-sm" : "bg-[#1e293b]/20 border-white/5"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div className="inline-flex p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/10">
                                <IconType size={18} />
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border leading-none ${
                                proj.paymentStatus === "paid"
                                  ? "bg-green-500/10 border-green-500/20 text-[#34d399]"
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}>
                                {proj.paymentStatus === "paid" ? (language === "fr" ? "Facture Payée" : "Billing Settle") : (language === "fr" ? "En attente" : "Pending Action")}
                              </span>
                            </div>

                            <h4 className={`font-display font-black text-base truncate mb-1 transition group-hover:text-gold ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                              {proj.title}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 block mb-4 uppercase">
                              {proj.type} Project Plan
                            </span>

                            {/* Progress bar visualizer */}
                            <div className="space-y-1.5 mb-5">
                              <div className="flex justify-between items-baseline text-[10.5px] font-mono font-bold leading-none">
                                <span className="text-slate-400 lowercase">{proj.status} phase</span>
                                <span className="text-gold-light">{proj.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-500/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-500 to-[#3b82f6] transition-all duration-1000" 
                                  style={{ width: `${proj.progress}%` }} 
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedProjectId(proj.id)}
                            className={`w-full py-2.5 rounded-xl border font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              theme === "light"
                                ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                                : "bg-white/5 hover:bg-white/10 text-white border-white/5 hover:border-gold/30"
                            }`}
                          >
                            <span>{language === "fr" ? "Suivre ce projet" : "Track Milestones"}</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AREA B: SINGLE PROJECT DETAILED tracking view */}
              {activeTab === "projects" && selectedProjectId && currentProject && (
                <div className="space-y-6 animate-fadeUp text-left">
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold transition font-bold"
                  >
                    <span>← {language === "fr" ? "Retour au tableau" : "Back to dashboard"}</span>
                  </button>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-[#1e293b]/30 border-white/5"
                  }`}>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6 border-b border-dashed border-slate-500/20 pb-5">
                      <div>
                        <h3 className={`font-display font-black text-2xl ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                          {currentProject.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {language === "fr" ? `Créé le ${new Date(currentProject.createdAt).toLocaleDateString("fr-FR")}` : `Initiated on ${new Date(currentProject.createdAt).toLocaleDateString("en-US")}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold px-3.5 py-1.5 rounded-xl border border-gold/15">
                          {formatCurrency(currentProject.cost, currentProject.currency)}
                        </span>
                        {currentProject.paymentStatus === "unpaid" && (
                          <button
                            onClick={() => handlePayInvoiceClick(getInvoiceForProject(currentProject))}
                            className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            {language === "fr" ? "Payer l'acompte" : "Pay deposit"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress details timeline bar */}
                    <div className="space-y-2.5 mb-8">
                      <div className="flex justify-between text-xs font-mono font-extrabold leading-none">
                        <span className="text-slate-500">Status: {currentProject.status.toUpperCase()}</span>
                        <span className="text-gold">{currentProject.progress}% {language === "fr" ? "réalisé" : "completed"}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-[#3b82f6] transition-all duration-1000" 
                          style={{ width: `${currentProject.progress}%` }} 
                        />
                      </div>
                    </div>

                    {/* Milestones list tracker representitive */}
                    <h4 className={`font-display font-semibold text-sm mb-4 ${theme === "light" ? "text-slate-950" : "text-white"}`}>
                      {language === "fr" ? "Étapes & Jalons prioritaires :" : "Milestone Validation stages:"}
                    </h4>
                    
                    <div className="space-y-3.5">
                      {[
                        { 
                          phase: "brief", 
                          title: language === "fr" ? "Brief & Cahier des charges" : "Specifications & Project scoping", 
                          desc: language === "fr" ? "Clarification de l'arborescence, maquettage et choix technologique." : "Scope review, functional blueprints mapping and tech architecture validation.",
                          targetProgress: 20
                        },
                        { 
                          phase: "design", 
                          title: language === "fr" ? "Charte Graphique & UX Mockups" : "Graphic layouts & UI Design", 
                          desc: language === "fr" ? "Création des mockups personnalisés ou maquette vectorielle interactive sous Figma." : "Custom template styling, high fidelity templates and interactive assets creation.",
                          targetProgress: 40
                        },
                        { 
                          phase: "development", 
                          title: language === "fr" ? "Développement Logiciel" : "Core Software Engineering & APIs", 
                          desc: language === "fr" ? "Écriture des composants React, modélisation de base de données PostgreSQL, intégration d'APIs tierces." : "Writing type-safe TypeScript files, coding backend server endpoints, linking Stripe/MoMo webhooks.",
                          targetProgress: 80
                        },
                        { 
                          phase: "qa", 
                          title: language === "fr" ? "Recette, Tests & Audit de vitesse" : "Product QA, Testing & Speed Audit", 
                          desc: language === "fr" ? "Phase finale de débogage, auditing Lighthouse, tests d'intégration, vérification de compatibilité mobile." : "Integrative load testing, mobile responsive viewport checking and lighthouse score boosting.",
                          targetProgress: 95
                        },
                        { 
                          phase: "deployed", 
                          title: language === "fr" ? "Déploiement Live" : "Final Release & DNS cloud configurations", 
                          desc: language === "fr" ? "Mise en ligne sur serveurs Cloud, liaison du nom de domaine personnalisé et remise des clés d'administration." : "Direct live deployment, DNS domain mapping and secure handover of credential packages.",
                          targetProgress: 100
                        }
                      ].map((item, index) => {
                        const isDone = currentProject.progress >= item.targetProgress;
                        const isCurrent = currentProject.status === item.phase;
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-4 rounded-2xl border transition flex items-start gap-4 ${
                              isDone 
                                ? theme === "light" ? "bg-green-50/40 border-green-200" : "bg-green-500/5 border-green-500/10" 
                                : isCurrent 
                                  ? "border-gold bg-gold/5" 
                                  : theme === "light" ? "bg-slate-50 border-slate-200" : "bg-white/5 border-transparent opacity-50"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold leading-none ${
                              isDone 
                                ? "bg-green-500 text-white" 
                                : isCurrent 
                                  ? "bg-gold text-slate-950 animate-pulse" 
                                  : "bg-slate-500/20 text-slate-400"
                            }`}>
                              {isDone ? "✓" : index + 1}
                            </div>
                            <div>
                              <h5 className={`font-bold text-sm ${isDone ? "text-[#10b981]" : isCurrent ? "text-gold" : theme === "light" ? "text-slate-800" : "text-slate-350"}`}>
                                {item.title}
                              </h5>
                              <p className="text-xs text-slate-400 leading-normal mt-1">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}


              {/* AREA C: BILLING / INVOICES TAB */}
              {activeTab === "billing" && !activePaymentInvoice && (
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h3 className={`font-display font-black text-xl leading-none ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                      {language === "fr" ? "Enregistrements Comptables" : "Billing Statements"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === "fr" ? "Payez et téléchargez vos factures Luciole Services" : "Settle and export official invoice documentation"}
                    </p>
                  </div>

                  <div className={`overflow-x-auto border rounded-2xl ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
                  }`}>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b font-bold text-slate-400 uppercase ${
                          theme === "light" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5"
                        }`}>
                          <th className="p-4">Facture No</th>
                          <th className="p-4">Projet lié</th>
                          <th className="p-4">Montant Total</th>
                          <th className="p-4">Statut</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-500/10 font-medium">
                        {projects.map((proj) => {
                          const invoice = getInvoiceForProject(proj);
                          return (
                            <tr key={proj.id} className={theme === "light" ? "hover:bg-slate-50/50" : "hover:bg-white/2"}>
                              <td className="p-4 font-mono font-bold text-slate-400">{invoice.id}</td>
                              <td className={`p-4 font-semibold ${theme === "light" ? "text-slate-900" : "text-white"}`}>{proj.title}</td>
                              <td className="p-4 text-gold-light font-bold">{formatCurrency(invoice.total, invoice.currency)}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-1 text-[9px] font-bold rounded-lg border ${
                                  invoice.status === "paid" 
                                    ? "bg-green-500/10 border-green-500/20 text-[#34d399]" 
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}>
                                  {invoice.status === "paid" ? (language === "fr" ? "PAIEMENT EFFECTUÉ" : "PAID RECEIPT") : (language === "fr" ? "NON RÉGLÉ" : "UNPAID STATEMENT")}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {invoice.status === "unpaid" ? (
                                  <button
                                    onClick={() => handlePayInvoiceClick(invoice)}
                                    className="px-3.5 py-1.5 bg-gold hover:bg-gold-light text-white text-[10px] font-bold rounded-lg uppercase tracking-wider cursor-pointer"
                                  >
                                    {language === "fr" ? "Régler" : "Pay invoice"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePayInvoiceClick(invoice)}
                                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                                      theme === "light" ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                                    }`}
                                  >
                                    {language === "fr" ? "Reçu PDF" : "Receipt PDF"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AREA D: DETAILED INVOICE CHECKOUT / PRINT LOGS */}
              {activePaymentInvoice && (
                <div className="space-y-6 animate-fadeUp text-left">
                  <button
                    onClick={() => { setActivePaymentInvoice(null); setPaymentStep("idle"); }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold transition font-bold"
                  >
                    <span>← {language === "fr" ? "Retour à mes factures" : "Back to invoices"}</span>
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Invoice statement Details (Looks exactly like a real PDF bill!) */}
                    <div id="commercial-printable-receipt" className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-xl relative overflow-hidden print:p-0 print:border-none print:shadow-none ${
                      theme === "light" ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900/40 border-white/5"
                    }`}>
                      
                      {/* Big Glowing Paid Watermark stamp */}
                      {activePaymentInvoice.status === "paid" && (
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none border-4 border-dashed border-green-500/30 text-green-500/25 px-8 py-3.5 rounded-2xl transform rotate-12 flex flex-col items-center justify-center pointer-events-none">
                          <span className="font-display font-black text-3xl tracking-[0.25em] leading-none mb-1">FACTURÉ & REGLE</span>
                          <span className="text-[10px] font-mono tracking-widest">{activePaymentInvoice.paidAt?.substring(0, 10)}</span>
                        </div>
                      )}

                      {/* Receipt top part */}
                      <div className="flex justify-between items-start gap-4 mb-8">
                        <div>
                          <h4 className={`font-display font-black text-lg ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                            LUCIOLE SERVICES Sarl
                          </h4>
                          <p className="text-[10.5px] text-slate-400 mt-1 leading-normal max-w-xs">
                            Cabinet d'Ingénierie Digitale & Studio Vocal.<br />
                            BP 409, Douala - Cameroun.<br />
                            N° Contribuable: M06230918F
                          </p>
                        </div>
                        <div className="text-right">
                          <h3 className="font-display font-black text-sm text-gold block tracking-wider uppercase">
                            FACTURE OFFICIELLE
                          </h3>
                          <span className="font-mono text-xs text-slate-400 block font-bold mb-1">{activePaymentInvoice.id}</span>
                          <span className="text-[10px] text-slate-400 block">{language === "fr" ? "Date: " : "Issue: "} {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Client parameters */}
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-500/10 py-4 mb-6 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">Facturé à :</span>
                          <p className={`font-extrabold ${theme === "light" ? "text-slate-900" : "text-white"}`}>{fullName}</p>
                          <p className="text-slate-500">{email}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block mb-1">Passerelle :</span>
                          <p className="font-bold text-slate-400">{activePaymentInvoice.method || "Mobile Money Simulator"}</p>
                          <p className="font-mono text-[9px] text-slate-500">{activePaymentInvoice.transactionHash || ""}</p>
                        </div>
                      </div>

                      {/* Items ledger */}
                      <div className="space-y-3.5 mb-8 text-xs">
                        <div className="flex justify-between items-center font-bold text-slate-400 uppercase tracking-wider pb-1">
                          <span>Désignation des prestations</span>
                          <span>Sous-total</span>
                        </div>
                        <div className="border-b border-slate-500/10" />
                        
                        <div className="flex justify-between items-baseline gap-4 py-1.5">
                          <div>
                            <p className={`font-bold ${theme === "light" ? "text-slate-900" : "text-white"}`}>Frais d'ingénierie & de production de code source</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Hébergement cloud de micro-service, liaison DNS customisée</p>
                          </div>
                          <span className={`font-bold shrink-0 ${theme === "light" ? "text-slate-800" : "text-white"}`}>{formatCurrency(activePaymentInvoice.amount, activePaymentInvoice.currency)}</span>
                        </div>
                      </div>

                      {/* Recap total calculations */}
                      <div className="border-t border-slate-500/10 pt-4 flex flex-col items-end text-xs font-semibold">
                        <div className="w-full sm:w-64 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Montant H.T.:</span>
                            <span className={theme === "light" ? "text-slate-800" : "text-white/90"}>{formatCurrency(activePaymentInvoice.amount, activePaymentInvoice.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">TVA (Standard 19.25%):</span>
                            <span className={theme === "light" ? "text-slate-800" : "text-white/90"}>{formatCurrency(activePaymentInvoice.tax, activePaymentInvoice.currency)}</span>
                          </div>
                          <div className="border-b border-slate-500/10 my-1" />
                          <div className="flex justify-between items-baseline font-bold">
                            <span className="text-gold-light">TOTAL T.T.C.:</span>
                            <span className="text-lg text-gold font-display font-black tracking-tight">{formatCurrency(activePaymentInvoice.total, activePaymentInvoice.currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Signature footer */}
                      <div className="mt-12 text-center text-[10px] text-slate-500 italic max-w-sm mx-auto">
                        {language === "fr" 
                          ? "*Cette facture certifie la réception de fonds ou d'une promesse juridique d'engagement. Luciole Services Sarl." 
                          : "*Official billing credentials verifying payment dispatch. Issued by certified accounting node on behalf of Luciole Services Sarl."
                        }
                      </div>

                      {/* Receipt Print button */}
                      {activePaymentInvoice.status === "paid" && (
                        <button
                          onClick={handlePrintReceipt}
                          className={`mt-6 w-full py-2.5 rounded-xl border font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:border-gold cursor-pointer transition print:hidden ${
                            theme === "light" ? "bg-slate-100 text-slate-800 border-slate-200" : "bg-white/5 text-white border-white/5"
                          }`}
                        >
                          <Printer size={13} />
                          <span>Exporter la facture (Print PDF)</span>
                        </button>
                      )}

                    </div>

                    {/* GATEWAY PAYMENT SELECTOR COMPONENT & LOGS */}
                    <div className="lg:col-span-5">
                      {isVerifyingPayment ? (
                        <div className={`rounded-3xl border p-6 text-center shadow-xl animate-pulse ${
                          theme === "light" ? "bg-white border-slate-205" : "bg-slate-900/60 border-white/10"
                        }`}>
                          <RefreshCw size={30} className="text-gold animate-spin mx-auto mb-4" />
                          <h4 className={`font-display font-black text-xs uppercase tracking-widest ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                            {language === "fr" ? "VÉRIFICATION SÉCURISÉE..." : "VERIFYING TRANSACTION..."}
                          </h4>
                          <p className="text-slate-400 text-xs mt-1">
                            {language === "fr" 
                              ? "Interrogation des serveurs de Notch Pay pour valider le règlement..." 
                              : "Querying Notch Pay api services to confirm the transaction status..."}
                          </p>
                        </div>
                      ) : verificationError ? (
                        <div className={`rounded-3xl border p-6 text-center shadow-xl ${
                          theme === "light" ? "bg-white border-red-200" : "bg-slate-900/60 border-red-500/10"
                        }`}>
                          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                          <h4 className="font-display font-black text-xs text-red-500 uppercase tracking-widest">
                            {language === "fr" ? "ÉCHEC DE VÉRIFICATION" : "VERIFICATION ERROR"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {verificationError}
                          </p>
                          <div className="space-y-2 mt-4">
                            <button
                              onClick={handleManualPaymentVerify}
                              className="w-full py-2.5 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold-light transition cursor-pointer"
                            >
                              {language === "fr" ? "Réessayer de vérifier le statut" : "Retry transaction check"}
                            </button>
                            <button
                              onClick={() => setVerificationError("")}
                              className="w-full py-2 text-slate-400 font-bold rounded-xl text-[10px] hover:text-white transition cursor-pointer"
                            >
                              {language === "fr" ? "Retourner au formulaire" : "Go back to billing form"}
                            </button>
                          </div>
                        </div>
                      ) : activePaymentInvoice.status === "unpaid" ? (
                        <div className={`rounded-3xl border p-6 text-left shadow-xl ${
                          theme === "light" ? "bg-white border-slate-205" : "bg-slate-900/60 border-white/10"
                        }`}>
                          <h4 className={`font-display font-black text-sm mb-4 tracking-wide ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                            REGLER LA FACTURE NO. {activePaymentInvoice.id}
                          </h4>
                          
                          {paymentStep === "idle" && (
                            <form onSubmit={handleStartRealPayment} className="space-y-4">
                              
                              {/* 1. Billing Identity Card */}
                              <div className="p-4 rounded-2xl border text-xs bg-slate-500/5 border-dashed border-slate-500/10 space-y-3.5">
                                <span className="text-[10px] font-bold text-gold block tracking-widest uppercase">
                                  {language === "fr" ? "Coordonnées de Facturation SECURE :" : "Secure Billing Parameters :"}
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 block mb-1">{language === "fr" ? "Nom *" : "Last Name *"}</label>
                                    <input
                                      type="text"
                                      required
                                      value={paymentClientLastName}
                                      onChange={(e) => setPaymentClientLastName(e.target.value)}
                                      placeholder="Ex: Kouam"
                                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold transition ${
                                        theme === "light" ? "bg-white border-slate-200" : "bg-black/55 border-white/5 text-white"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 block mb-1">{language === "fr" ? "Prénom *" : "First Name *"}</label>
                                    <input
                                      type="text"
                                      required
                                      value={paymentClientFirstName}
                                      onChange={(e) => setPaymentClientFirstName(e.target.value)}
                                      placeholder="Ex: Marc"
                                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold transition ${
                                        theme === "light" ? "bg-white border-slate-200" : "bg-black/55 border-white/5 text-white"
                                      }`}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 block mb-1">{language === "fr" ? "E-mail de facturation *" : "Billing E-mail *"}</label>
                                    <input
                                      type="email"
                                      required
                                      value={paymentClientEmail}
                                      onChange={(e) => setPaymentClientEmail(e.target.value)}
                                      placeholder="Ex: marc@gmail.com"
                                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold transition ${
                                        theme === "light" ? "bg-white border-slate-200" : "bg-black/55 border-white/5 text-white"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 block mb-1">{language === "fr" ? "Mobile de contact *" : "Mobile Phone *"}</label>
                                    <input
                                      type="tel"
                                      required
                                      value={paymentClientPhone}
                                      onChange={(e) => setPaymentClientPhone(e.target.value)}
                                      placeholder="Ex: +237 600 00 00 00"
                                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold transition ${
                                        theme === "light" ? "bg-white border-slate-200" : "bg-black/55 border-white/5 text-white"
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
 
                              <div className="p-4 rounded-2xl text-[10px] leading-relaxed bg-blue-500/5 text-blue-400 border border-blue-500/10">
                                {language === "fr" 
                                  ? "💡 Redirection sécurisée vers Notch Pay (MTN MoMo, Orange Money, Visa, Mastercard) en 1-clic pour un paiement réel d'acompte." 
                                  : "💡 Safely checkout directly with standard Notch Pay tools (MTN Money, Orange Money, Credit Cards) with fully secure SSL channels."}
                              </div>
 
                              <button
                                type="submit"
                                disabled={!paymentClientLastName || !paymentClientFirstName || !paymentClientEmail || !paymentClientPhone}
                                className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-slate-950 font-display text-xs font-black uppercase tracking-widest transition shadow-md cursor-pointer disabled:opacity-40"
                              >
                                {language === "fr" ? "Procéder au règlement via Notch Pay (Réel)" : "Pay securely with Notch Pay (Real)"}
                              </button>
                            </form>
                          )}
 
                          {/* Gateway interactive loader state */}
                          {paymentStep === "connecting" && (
                            <div className="space-y-6 text-center py-6 animate-fadeUp">
                              <RefreshCw size={24} className="text-gold animate-spin mx-auto" />
                              <div>
                                <h5 className="text-xs font-bold text-gold uppercase tracking-widest text-[#d97706] mb-2 animate-pulse">
                                  {language === "fr" ? "CONNEXION SÉCURISÉE..." : "INITIALIZING CONNECTION..."}
                                </h5>
                                <div className="mt-4 p-4 rounded-xl font-mono text-[10px] bg-black/45 text-blue-300 space-y-1.5 border border-white/5 text-left">
                                  {paymentLogs.map((log, i) => (
                                    <p key={i} className="truncate">{log}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
 
                          {/* Manual check helper if localStorage contains staging reference && not in transaction simulation */}
                          {paymentStep === "idle" && localStorage.getItem("pendingPaymentRef") && (
                            <div className="mt-4 pt-4 border-t border-slate-500/10 text-center">
                              <p className="text-[10px] text-slate-400 mb-2">
                                {language === "fr" ? "Un paiement de cet acompte est-il déjà en cours ?" : "Do you have a pending checkout transaction?"}
                              </p>
                              <button
                                onClick={handleManualPaymentVerify}
                                className="text-gold text-[10.5px] font-bold hover:underline cursor-pointer"
                              >
                                {language === "fr" ? "👉 Forcer la vérification manuelle" : "👉 Force verification check"}
                              </button>
                            </div>
                          )}

                        </div>
                      ) : (
                        /* Success statement receipt panel link */
                        <div className={`rounded-3xl border p-6 text-center shadow-xl animate-fadeUp ${
                          theme === "light" ? "bg-white border-green-200" : "bg-green-500/5 border-green-500/10"
                        }`}>
                          <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3 animate-bounce" />
                          <h4 className="font-display font-black text-sm text-[#10b981] uppercase tracking-wider">
                            Règlement Effectué !
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {language === "fr" 
                              ? "Votre paiement réel a été pris en compte de manière sécurisée via Notch Pay. Votre projet entame sa phase de développement." 
                              : "Your payment has been cleared via Notch Pay secure system. Your project status is promoted."
                            }
                          </p>
                          <div className="mt-4 p-3 rounded-xl bg-black/35 font-mono text-[9px] text-[#27c93f] space-y-1 text-left">
                            <p>REF: {activePaymentInvoice.transactionHash}</p>
                            <p>GATEWAY: {activePaymentInvoice.method}</p>
                            <p>PROD_CLEARANCE: APPROVED SUCCESS</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* AREA D: SYSTEM ADMIN CONTROL DEPLOYMENT PANEL TAB */}
              {activeTab === "admin" && (
                <AdminBoard 
                  theme={theme}
                  language={language}
                  allUsers={allUsers}
                  projects={projects}
                  invoices={invoices}
                />
              )}

            </div>

          </div>
        </div>
      )}
        
      </div>

      {showSignOutConfirm && (
        <div id="dashboard-signout-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in text-left">
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
                  id="dashboard-signout-no"
                  onClick={() => setShowSignOutConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-250"
                      : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/10"
                  }`}
                >
                  {language === "fr" ? "Non, rester" : "No, cancel"}
                </button>
                <button
                  id="dashboard-signout-yes"
                  onClick={async () => {
                    setShowSignOutConfirm(false);
                    await executeLogOutAction();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer font-bold"
                >
                  {language === "fr" ? "Oui, se déconnecter" : "Yes, sign out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
