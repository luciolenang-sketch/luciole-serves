import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from "firebase/firestore";
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  Archive, 
  Clock, 
  Inbox, 
  Check, 
  Filter, 
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";

interface AdminLiveSupportProps {
  theme: "light" | "dark";
  language: "fr" | "en";
}

interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  language: string;
  status: "active" | "archived";
  createdAt: any;
  updatedAt: any;
  lastMessageText?: string;
  isUserTyping?: boolean;
  unreadCountForAdmin: number;
  unreadCountForUser: number;
}

interface Message {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: Date;
}

export const AdminLiveSupport: React.FC<AdminLiveSupportProps> = ({ theme, language }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [typingTimeoutState, setTypingTimeoutState] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick templates for replies
  const FR_TEMPLATES = [
    "Bonjour ! Comment puis-je vous aider aujourd'hui ? 😊",
    "J'ai bien pris note de vos besoins. Je prépare votre chiffrage détaillé dès maintenant.",
    "Excellent projet ! Luciole Services est ravi de vous accompagner sur ce projet.",
    "Voici notre contact direct Whatsapp pour un échange téléphonique immédiat : +237..."
  ];

  const EN_TEMPLATES = [
    "Hello! How can I assist you today? 😊",
    "I've noted down your specifications. I am working on your detailed estimation right now.",
    "Amazing project! Luciole Services will be delighted to support your startup.",
    "Here is our WhatsApp hotline for an immediate phone call schedule: +237..."
  ];

  const templates = language === "fr" ? FR_TEMPLATES : EN_TEMPLATES;

  // 1. Listen for all sessions
  useEffect(() => {
    const q = query(
      collection(db, "liveChats"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: ChatSession[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        let created = new Date();
        let updated = new Date();
        if (data.createdAt) {
          try { created = data.createdAt.toDate(); } catch(e) { created = new Date(data.createdAt); }
        }
        if (data.updatedAt) {
          try { updated = data.updatedAt.toDate(); } catch(e) { updated = new Date(data.updatedAt); }
        }
        fetched.push({
          id: snapDoc.id,
          visitorName: data.visitorName || "Visiteur",
          visitorEmail: data.visitorEmail || "",
          language: data.language || "fr",
          status: data.status || "active",
          createdAt: created,
          updatedAt: updated,
          lastMessageText: data.lastMessageText || "",
          isUserTyping: !!data.isUserTyping,
          unreadCountForAdmin: data.unreadCountForAdmin || 0,
          unreadCountForUser: data.unreadCountForUser || 0,
        });
      });
      setSessions(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error loading chat sessions in admin view: ", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "liveChats");
    });

    return () => unsubscribe();
  }, []);

  // 2. Keep the activeSession object synchronized with latest version from sessions
  useEffect(() => {
    if (selectedSessionId) {
      const found = sessions.find(s => s.id === selectedSessionId);
      if (found) {
        setActiveSession(found);
      }
    } else {
      setActiveSession(null);
    }
  }, [selectedSessionId, sessions]);

  // 3. Listen for messages of the active session
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "liveChats", selectedSessionId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let tsDate = new Date();
        if (data.timestamp) {
          try { tsDate = data.timestamp.toDate(); } catch (e) { tsDate = new Date(data.timestamp); }
        }
        msgs.push({
          id: docSnap.id,
          sender: data.sender || "bot",
          text: data.text || "",
          timestamp: tsDate,
        });
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Error observing admin session messages: ", error);
      handleFirestoreError(error, OperationType.LIST, `liveChats/${selectedSessionId}/messages`);
    });

    // Reset unread counts on mount or new message
    const resetUnreadCount = async () => {
      try {
        await updateDoc(doc(db, "liveChats", selectedSessionId), {
          unreadCountForAdmin: 0
        });
      } catch (e) {
        console.error("Error resetting unread tracking count: ", e);
        handleFirestoreError(e, OperationType.UPDATE, `liveChats/${selectedSessionId}`);
      }
    };
    resetUnreadCount();

    return () => unsubscribe();
  }, [selectedSessionId]);

  // 4. Auto scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeSession?.isUserTyping]);

  // 5. Handling Typing Indicators
  const handleAdminTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = e.target.value;
    setInputText(textValue);

    if (selectedSessionId) {
      updateDoc(doc(db, "liveChats", selectedSessionId), { isAdminTyping: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `liveChats/${selectedSessionId}`);
      });

      if (typingTimeoutState) {
        clearTimeout(typingTimeoutState);
      }

      const timeout = setTimeout(() => {
        if (selectedSessionId) {
          updateDoc(doc(db, "liveChats", selectedSessionId), { isAdminTyping: false }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `liveChats/${selectedSessionId}`);
          });
        }
      }, 2000);

      setTypingTimeoutState(timeout);
    }
  };

  // 6. Send Response
  const handleSendAdminReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !selectedSessionId) return;

    if (!customText) {
      setInputText("");
    }

    if (typingTimeoutState) {
      clearTimeout(typingTimeoutState);
    }
    await updateDoc(doc(db, "liveChats", selectedSessionId), { isAdminTyping: false }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `liveChats/${selectedSessionId}`);
    });

    try {
      const msgRef = doc(collection(db, "liveChats", selectedSessionId, "messages"));
      await setDoc(msgRef, {
        id: msgRef.id,
        sender: "admin",
        text: textToSend,
        timestamp: new Date()
      });

      await updateDoc(doc(db, "liveChats", selectedSessionId), {
        lastMessageText: textToSend,
        updatedAt: new Date(),
        unreadCountForUser: 1
      });
    } catch (err) {
      console.error("Error sending admin reply:", err);
      handleFirestoreError(err, OperationType.WRITE, `liveChats/${selectedSessionId}`);
    }
  };

  // 7. Session administrative controls
  const toggleArchiveSession = async () => {
    if (!selectedSessionId || !activeSession) return;
    const newStatus = activeSession.status === "active" ? "archived" : "active";
    try {
      await updateDoc(doc(db, "liveChats", selectedSessionId), {
        status: newStatus
      });
    } catch (e) {
      console.error("Error archiving session:", e);
      handleFirestoreError(e, OperationType.UPDATE, `liveChats/${selectedSessionId}`);
    }
  };

  const deleteSession = async () => {
    if (!selectedSessionId) return;
    if (!window.confirm(language === "fr" ? "Voulez-vous vraiment supprimer définitivement cette discussion ?" : "Permanently delete this discussion?")) return;
    try {
      const sessionRef = doc(db, "liveChats", selectedSessionId);
      // Optional: Delete messages nested inside
      const msgSnaps = await getDocs(collection(db, "liveChats", selectedSessionId, "messages"));
      const deletePromises = msgSnaps.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      await deleteDoc(sessionRef);
      setSelectedSessionId(null);
    } catch (e) {
      console.error("Error deleting session: ", e);
      handleFirestoreError(e, OperationType.DELETE, `liveChats/${selectedSessionId}`);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const statusMatch = showArchived ? s.status === "archived" : s.status === "active";
    if (!statusMatch) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        s.visitorName.toLowerCase().includes(term) ||
        (s.visitorEmail && s.visitorEmail.toLowerCase().includes(term)) ||
        (s.lastMessageText && s.lastMessageText.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className={`w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border ${
      theme === "light" 
        ? "bg-white border-slate-200 shadow-sm" 
        : "bg-slate-900/60 border-white/5 shadow-2xl"
    }`}>
      {/* Session Navigation Column */}
      <div className={`col-span-1 lg:col-span-4 border-r flex flex-col h-[580px] ${
        theme === "light" ? "border-slate-100 bg-slate-50/50" : "border-white/5 bg-[#0a0f1d]/40"
      }`}>
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-light-gray-or-border flex flex-col gap-3 shrink-0" style={{ borderBottomWidth: "1px", borderBottomColor: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
              {language === "fr" ? "Discussions Support" : "Support Discussions"}
            </h4>
            
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                showArchived
                  ? "bg-amber-500/10 text-amber-400"
                  : theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Archive size={10} />
              <span>{showArchived ? (language === "fr" ? "Archivées" : "Archived") : (language === "fr" ? "Actives" : "Active")}</span>
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 select-none pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === "fr" ? "Filtrer les visiteurs..." : "Filter visitors..."}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none transition ${
                theme === "light" 
                  ? "bg-white border border-slate-200 focus:border-gold" 
                  : "bg-slate-950 border border-white/5 focus:border-gold text-white"
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* List items Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-transparent">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-gold animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Loading dynamic connections...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
              <Inbox size={26} className="text-slate-600 animate-pulse" />
              <p className="text-xs font-medium">
                {language === "fr" ? "Aucun chat actif trouvé" : "No active conversation found"}
              </p>
              <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto">
                {language === "fr" ? "Les messages reçus en direct s'afficheront ici." : "Standard live user queries populate lists here."}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full p-3 rounded-xl transition text-left flex items-start gap-3 relative cursor-pointer ${
                    isSelected
                      ? "bg-gold text-slate-950 font-bold"
                      : theme === "light"
                        ? "bg-white hover:bg-slate-100/75 border border-slate-150 text-slate-800"
                        : "bg-[#0c1224] hover:bg-white/5 border border-white/5 text-slate-200"
                  }`}
                >
                  {/* Indicator green bulb */}
                  <div className="relative shrink-0 mt-0.5">
                    <span className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${isSelected ? "bg-slate-950/10 text-slate-950" : "bg-gold/10 text-gold"}`}>
                      <User size={15} />
                    </span>
                    {session.isUserTyping && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold truncate tracking-tight">
                        {session.visitorName}
                      </h4>
                      <span className={`text-[9px] font-mono shrink-0 ${isSelected ? "text-slate-900/60" : "text-slate-500"}`}>
                        {session.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {session.visitorEmail && (
                      <p className={`text-[10px] truncate mb-1 ${isSelected ? "text-slate-900/70" : "text-slate-400"}`}>
                        {session.visitorEmail}
                      </p>
                    )}

                    <p className={`text-[11px] truncate leading-tight ${isSelected ? "text-slate-900/80 font-medium" : "text-slate-400/90"}`}>
                      {session.isUserTyping ? (
                        <span className="text-emerald-400 font-bold animate-pulse">
                          {language === "fr" ? "Typing..." : "Typing..."}
                        </span>
                      ) : (
                        session.lastMessageText || (language === "fr" ? "Nouvelle discussion" : "No message yet")
                      )}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                    <span className={`text-[8px] font-mono font-bold tracking-wide px-1 rounded uppercase ${
                      isSelected 
                        ? "bg-slate-950/20 text-slate-950" 
                        : "bg-white/10 text-slate-300 border border-white/15"
                    }`}>
                      {session.language}
                    </span>

                    {session.unreadCountForAdmin > 0 && (
                      <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-red-600 text-[10px] font-black font-sans text-white flex items-center justify-center animate-bounce">
                        {session.unreadCountForAdmin}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Workspace Area */}
      <div className={`col-span-1 lg:col-span-8 flex flex-col h-[580px] bg-transparent`}>
        {activeSession ? (
          <>
            {/* Header toolbar */}
            <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0" style={{ borderBottomWidth: "1px", borderBottomColor: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)" }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-bold truncate ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                    {activeSession.visitorName}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    activeSession.status === "active" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "bg-slate-500/20 text-slate-400"
                  }`}>
                    {activeSession.status}
                  </span>
                </div>
                {activeSession.visitorEmail && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {activeSession.visitorEmail}
                  </p>
                )}
              </div>

              {/* Administrative Actions toolbar button group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleArchiveSession}
                  className={`p-2 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer border ${
                    theme === "light"
                      ? "bg-white border-slate-200 hover:bg-slate-50 hover:text-indigo-600 text-slate-600"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:text-gold text-slate-300"
                  }`}
                  title={activeSession.status === "active" ? "Archiver la session" : "Réactiver la session"}
                >
                  <Archive size={14} />
                  <span className="hidden sm:inline">
                    {activeSession.status === "active" 
                      ? (language === "fr" ? "Archiver" : "Archive") 
                      : (language === "fr" ? "Réactiver" : "Reactivate")}
                  </span>
                </button>

                <button
                  onClick={deleteSession}
                  className="p-2 rounded-lg text-xs transition border bg-red-600/10 text-red-500 border-red-500/10 hover:bg-red-500 hover:text-white cursor-pointer"
                  title="Supprimer la discussion"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Messages Workspace panel */}
            <div className={`flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 space-y-0 ${
              theme === "light" ? "bg-slate-50/20" : "bg-slate-950/20"
            }`}>
              {messages.map((msg) => {
                const isAdmin = msg.sender === "admin";
                const isBot = msg.sender === "bot";
                
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-[80%] ${
                      isAdmin ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    {!isAdmin && (
                      <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                        isBot 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {isBot ? <Sparkles size={12} /> : <User size={12} />}
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold tracking-wide mb-1 flex items-center gap-1.5 ${
                        isAdmin 
                          ? "text-gold self-end justify-end flex-row-reverse" 
                          : isBot 
                            ? "text-purple-400 self-start" 
                            : "text-emerald-400 self-start"
                      }`}>
                        {isAdmin ? (
                          <>
                            <span>{language === "fr" ? "ADMINISTRATEUR (Vous)" : "ADMINISTRATOR (You)"}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                          </>
                        ) : isBot ? (
                          <>
                            <Sparkles size={11} className="text-purple-400 shrink-0 animate-pulse" />
                            <span>{language === "fr" ? "ASSISTANT IA" : "AI ASSISTANT"}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 shrink-0" />
                            <span>{language === "fr" ? `CLIENT (${activeSession.visitorName})` : `CLIENT (${activeSession.visitorName})`}</span>
                          </>
                        )}
                      </span>
                      <div className={`p-3.5 rounded-2xl text-xs sm:text-sm transition-all duration-150 border ${
                        isAdmin
                          ? "bg-gold border-gold text-slate-950 font-semibold rounded-tr-sm shadow-md"
                          : isBot
                            ? theme === "light"
                              ? "bg-purple-50/70 border-purple-150 text-purple-950 rounded-tl-sm"
                              : "bg-purple-950/20 border-purple-500/15 text-purple-250 rounded-tl-sm"
                            : theme === "light"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-950 rounded-tl-sm"
                              : "bg-emerald-900/15 border-emerald-500/20 text-emerald-100 rounded-tl-sm"
                      }`}>
                        <p className="leading-relaxed m-0 whitespace-pre-wrap">{msg.text}</p>
                        <span className={`block text-[9px] mt-1 text-right font-mono ${
                          isAdmin ? "text-slate-950/60" : "text-slate-400/75"
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeSession.isUserTyping && (
                <div className="flex items-start gap-3 max-w-[80%] self-start">
                  <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 bg-gold/10 text-gold">
                    <User size={12} className="animate-pulse" />
                  </div>
                  <div className={`p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 ${
                    theme === "light" ? "bg-slate-100" : "bg-white/5"
                  }`}>
                    <span className="text-[10px] text-gold font-medium animate-pulse">
                      {language === "fr" ? "Le client écrit..." : "Client typing..."}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick response template bubbles */}
            <div className="px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto shrink-0 border-t" style={{ borderTopWidth: "1px", borderTopColor: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)" }}>
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAdminReply(undefined, tpl)}
                  className={`text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full border transition cursor-pointer hover:border-gold hover:text-gold ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-600"
                      : "bg-[#0b1022] border-white/5 text-slate-300"
                  }`}
                >
                  {tpl.length > 35 ? tpl.substring(0, 35) + "..." : tpl}
                </button>
              ))}
            </div>

            {/* Response input bar form */}
            <form
              onSubmit={(e) => handleSendAdminReply(e)}
              className="p-4 border-t flex items-center gap-3 shrink-0"
              style={{ borderTopWidth: "1px", borderTopColor: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)" }}
            >
              <input
                type="text"
                value={inputText}
                onChange={handleAdminTyping}
                placeholder={language === "fr" ? "Écrivez une réponse..." : "Type a response as Administrator..."}
                className={`flex-1 text-xs sm:text-sm rounded-xl px-4 py-3 border transition focus:outline-none focus:border-gold ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-250 text-slate-900"
                    : "bg-[#030712] border-white/5 text-white"
                }`}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-gold hover:bg-gold-light text-slate-950 transition hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md shadow-gold/10"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gold/5 border border-gold/10 flex items-center justify-center text-gold animate-pulse mb-2">
              <MessageSquare size={24} />
            </div>
            <h3 className={`text-sm font-bold ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>
              {language === "fr" ? "Espace Assistance en Direct" : "Live Chat Admin Terminal"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {language === "fr" 
                ? "Sélectionnez une conversation dans la barre latérale gauche pour commencer à dialoguer avec les clients et prospects en temps réel." 
                : "Select an active conversation thread from the list to start answering visitor and client queries in real-time."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
