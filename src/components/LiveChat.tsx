import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, SendToBack, User, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, onSnapshot, collection, query, orderBy, updateDoc } from "firebase/firestore";

const LucioleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className} 
    style={{ width: size, height: size }}
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
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
);

interface Message {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: Date;
}

export const LiveChat: React.FC = () => {
  const { theme, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [hasTriggeredTypingAssistant, setHasTriggeredTypingAssistant] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [typingTimeoutState, setTypingTimeoutState] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor auth status
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Determine chatSessionId
  useEffect(() => {
    let sessionId = localStorage.getItem("luciole_chat_session_id");
    if (currentUser) {
      sessionId = `uid-${currentUser.uid}`;
    } else if (!sessionId) {
      sessionId = `anon-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("luciole_chat_session_id", sessionId);
    }
    setChatSessionId(sessionId);
  }, [currentUser]);

  // Sync session metadata to Firestore when session is active
  useEffect(() => {
    if (!chatSessionId) return;

    const name = currentUser?.displayName || (currentUser?.email ? currentUser.email.split("@")[0] : `Visiteur ${chatSessionId.replace("anon-", "").substring(0, 4)}`);
    const email = currentUser?.email || "";

    const initSession = async () => {
      try {
        const sessionRef = doc(db, "liveChats", chatSessionId);
        await setDoc(sessionRef, {
          id: chatSessionId,
          visitorName: name,
          visitorEmail: email,
          language: language,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          isUserTyping: false,
          unreadCountForAdmin: 0,
          unreadCountForUser: 0
        }, { merge: true });
      } catch (err) {
        console.error("Error initializing chat session:", err);
        handleFirestoreError(err, OperationType.WRITE, `liveChats/${chatSessionId}`);
      }
    };

    initSession();
  }, [chatSessionId, currentUser, language]);

  // Listen for Live Chat Messages
  useEffect(() => {
    if (!chatSessionId) return;

    const messagesQuery = query(
      collection(db, "liveChats", chatSessionId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let tsDate = new Date();
        if (data.timestamp) {
          try {
            tsDate = data.timestamp.toDate();
          } catch (e) {
            tsDate = new Date(data.timestamp);
          }
        }
        msgs.push({
          id: docSnap.id,
          sender: data.sender || "bot",
          text: data.text || "",
          timestamp: tsDate,
        });
      });

      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        // Seed first welcome message
        const welcomeText = language === "fr" 
          ? "Bonjour ! 👋 Bienvenue chez Luciole Services. Que souhaitez-vous concevoir aujourd'hui ?" 
          : "Hello! 👋 Welcome to Luciole Services. What would you like to build with us today?";
        
        const firstMsgRef = doc(collection(db, "liveChats", chatSessionId, "messages"));
        setDoc(firstMsgRef, {
          id: firstMsgRef.id,
          sender: "bot",
          text: welcomeText,
          timestamp: new Date()
        }).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `liveChats/${chatSessionId}/messages`);
        });
      }
    }, (error) => {
      console.error("Error observing messages: ", error);
      handleFirestoreError(error, OperationType.LIST, `liveChats/${chatSessionId}/messages`);
    });

    // Listen for admin is typing status
    const unsubSession = onSnapshot(doc(db, "liveChats", chatSessionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsAdminTyping(!!data.isAdminTyping);
        
        // Reset unread count for user when they view it
        if (isOpen && data.unreadCountForUser > 0) {
          updateDoc(doc(db, "liveChats", chatSessionId), {
            unreadCountForUser: 0
          }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `liveChats/${chatSessionId}`);
          });
        }
      }
    }, (error) => {
      console.error("Error observing session: ", error);
      handleFirestoreError(error, OperationType.GET, `liveChats/${chatSessionId}`);
    });

    return () => {
      unsubscribe();
      unsubSession();
    };
  }, [chatSessionId, language, isOpen]);

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBotTyping, isAdminTyping]);

  // Handle typing state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (chatSessionId) {
      updateDoc(doc(db, "liveChats", chatSessionId), { isUserTyping: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `liveChats/${chatSessionId}`);
      });

      if (typingTimeoutState) {
        clearTimeout(typingTimeoutState);
      }

      const timeout = setTimeout(() => {
        if (chatSessionId) {
          updateDoc(doc(db, "liveChats", chatSessionId), { isUserTyping: false }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `liveChats/${chatSessionId}`);
          });
        }
      }, 2000);

      setTypingTimeoutState(timeout);
    }

    // Live suggestion response simulation
    if (value.length > 2 && !hasTriggeredTypingAssistant) {
      setHasTriggeredTypingAssistant(true);
      setIsBotTyping(true);
      
      setTimeout(async () => {
        setIsBotTyping(false);
        if (!chatSessionId) return;
        try {
          const msgRef = doc(collection(db, "liveChats", chatSessionId, "messages"));
          await setDoc(msgRef, {
            id: msgRef.id,
            sender: "bot",
            text: language === "fr" 
              ? "⚡ Astuce en direct : Vous pouvez décrire votre projet en quelques mots (site internet, application mobile, studio voix-off) pour obtenir un devis gratuit direct !" 
              : "⚡ Live Hint: Just mention your project goals (website, mobile application, voiceover) to help us prepare a custom proposal outline for you!",
            timestamp: new Date(),
          });
        } catch (e) {
          console.error(e);
          handleFirestoreError(e, OperationType.CREATE, `liveChats/${chatSessionId}/messages`);
        }
      }, 1500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatSessionId) return;

    const userText = inputText;
    setInputText("");

    if (typingTimeoutState) {
      clearTimeout(typingTimeoutState);
    }
    await updateDoc(doc(db, "liveChats", chatSessionId), { isUserTyping: false }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `liveChats/${chatSessionId}`);
    });

    try {
      const userMsgRef = doc(collection(db, "liveChats", chatSessionId, "messages"));
      await setDoc(userMsgRef, {
        id: userMsgRef.id,
        sender: "user",
        text: userText,
        timestamp: new Date()
      });

      const sessionRef = doc(db, "liveChats", chatSessionId);
      await updateDoc(sessionRef, {
        lastMessageText: userText,
        updatedAt: new Date(),
        unreadCountForAdmin: 1
      });

      setIsBotTyping(true);

      // Automated Bot simulation fallback (after 3 seconds)
      setTimeout(async () => {
        setIsBotTyping(false);
        const textToAnalyze = userText.toLowerCase();
        let replyText = "";

        if (language === "fr") {
          if (textToAnalyze.includes("devis") || textToAnalyze.includes("prix") || textToAnalyze.includes("tarif") || textToAnalyze.includes("combien")) {
            replyText = "Parfait ! Pour estimer instantanément le coût de votre projet, nous vous invitons également à tester notre onglet 'Simulateur Budget 📊' juste au-dessus. Un conseiller de l'équipe Luciole prend note et va vous répondre au plus vite ici ou par e-mail.";
          } else if (textToAnalyze.includes("site") || textToAnalyze.includes("web") || textToAnalyze.includes("vitrine")) {
            replyText = "Excellent choix ! Nous créons des sites Web modernes sous React/Next.js optimisés pour le référencement (SEO). Souhaitez-vous un site vitrine ou une boutique d'e-commerce ? L'un de nos agents est également averti de votre message.";
          } else if (textToAnalyze.includes("mobile") || textToAnalyze.includes("app") || textToAnalyze.includes("ios") || textToAnalyze.includes("android")) {
            replyText = "Génial ! Nous développons des applications mobiles cross-platform performantes avec React Native. Dites-nous si votre application requiert des fonctionnalités spécifiques comme la géolocalisation.";
          } else if (textToAnalyze.includes("voix") || textToAnalyze.includes("studio") || textToAnalyze.includes("jingle") || textToAnalyze.includes("audio")) {
            replyText = "Formidable ! Notre studio vocal prépare des jingles percutants et voix-off professionnels. Vous pouvez également tester notre console interactive d'acoustique dans la section 'Vocal Studio 🎙️' !";
          } else {
            replyText = "Votre message a bien été transmis en direct à notre équipe ! L'un de nos ingénieurs va vous répondre ici ou par e-mail dans les plus brefs délais. Vous pouvez aussi nous contacter directement sur WhatsApp pour une réactivité immédiate.";
          }
        } else {
          if (textToAnalyze.includes("quote") || textToAnalyze.includes("price") || textToAnalyze.includes("cost") || textToAnalyze.includes("how much")) {
            replyText = "Wonderful! To get an instant detailed pricing projection, feel free to try our 'Budget Simulator 📊' menu tab above. Our engineers are also reviewing your request right now.";
          } else if (textToAnalyze.includes("site") || textToAnalyze.includes("web") || textToAnalyze.includes("landing")) {
            replyText = "Great! We craft blazing-fast web ecosystems fully optimized for SEO. Are you planning a showcase website or a full e-commerce shop?";
          } else if (textToAnalyze.includes("mobile") || textToAnalyze.includes("app") || textToAnalyze.includes("smartphone")) {
            replyText = "Amazing choice! We build premium cross-platform apps with React Native to ensure flawless native speeds. Tell us more about development details.";
          } else {
            replyText = "Understood perfectly! Your message has been routed to our development team. We will respond directly to you shortly. You can also prompt us via the WhatsApp hotline layout.";
          }
        }

        // Only reply as bot if there is no immediate subsequent message
        if (chatSessionId) {
          const botMsgRef = doc(collection(db, "liveChats", chatSessionId, "messages"));
          await setDoc(botMsgRef, {
            id: botMsgRef.id,
            sender: "bot",
            text: replyText,
            timestamp: new Date()
          }).catch((err) => {
            handleFirestoreError(err, OperationType.CREATE, `liveChats/${chatSessionId}/messages/${botMsgRef.id}`);
          });
        }
      }, 3500);

    } catch (err) {
      console.error("Error sending user message:", err);
      handleFirestoreError(err, OperationType.WRITE, `liveChats/${chatSessionId}`);
    }
  };

  return (
    <>
      {/* Dynamic Pulsing Floating Chat Bubble Button - Positioned beautifully above the WhatsApp button on the right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[88px] right-6 z-[9999] p-4 rounded-full bg-gold hover:bg-gold-light text-navy-dark shadow-lg shadow-gold/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        aria-label="Open support chat"
        id="live-chat-toggle-bubble"
      >
        <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
        {isOpen ? <X size={22} className="rotate-90 transition duration-300" /> : <MessageSquare size={22} />}
      </button>

      {/* Intelligent Interactive Support Portal Popup - Positioned elegantly above the button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={`fixed bottom-[154px] right-6 z-[9999] w-[350px] sm:w-[380px] h-[480px] sm:h-[510px] rounded-2xl border flex flex-col overflow-hidden shadow-2xl backdrop-blur-md ${
              theme === "light" 
                ? "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50" 
                : "bg-slate-950/95 border-white/5 text-slate-100 shadow-black/80"
            }`}
            id="live-chat-portal"
          >
            {/* Header branding */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-navy-dark to-[#162a45] border-b border-white/5 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative select-none pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-[#3b82f6] shadow-[0_0_12px_rgba(251,191,36,0.25)] flex items-center justify-center relative">
                    <LucioleIcon size={20} className="text-slate-950 animate-pulse" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-navy-dark" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-gold tracking-tight leading-none mb-1">
                    Luciole Services
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-300 tracking-wide font-medium font-mono uppercase">
                      {language === "fr" ? "Support en direct" : "Live Assistant"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
                id="close-chat-portal-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Support Message history Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5 space-y-0 text-sm">
              {messages.map((msg) => {
                const isBot = msg.sender === "bot" || msg.sender === "admin";
                const isAdmin = msg.sender === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[85%] ${isBot ? "self-start" : "self-end flex-row-reverse"}`}
                  >
                    {isBot && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isAdmin 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                          : "bg-gold/5 border border-gold/20 text-gold"
                      }`}>
                        {isAdmin ? <User size={12} /> : <LucioleIcon size={14} className="text-gold" />}
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl ${
                        isBot
                          ? isAdmin
                            ? theme === "light"
                              ? "bg-emerald-50 text-slate-800 border border-emerald-100 rounded-tl-sm"
                              : "bg-emerald-950/20 text-emerald-150 border border-emerald-500/10 rounded-tl-sm"
                            : theme === "light"
                              ? "bg-slate-100/90 text-slate-800 rounded-tl-sm"
                              : "bg-white/5 text-slate-100 border border-white/5 rounded-tl-sm"
                          : "bg-gold text-navy-dark font-medium rounded-tr-sm"
                      }`}
                    >
                      {isAdmin && (
                        <span className="block text-[8px] font-sans font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                          {language === "fr" ? "Conseiller" : "Agent"}
                        </span>
                      )}
                      <p className="leading-relaxed m-0">{msg.text}</p>
                      <span className={`block text-[9px] mt-1 text-right font-mono ${
                        isBot ? "text-slate-400" : "text-navy-dark/60"
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Real-time admin typing animation widget */}
              {isAdminTyping && (
                <div className="flex items-start gap-2.5 max-w-[85%] self-start">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <User size={12} className="animate-pulse" />
                  </div>
                  <div className={`p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 ${
                    theme === "light" ? "bg-emerald-50/50 border border-emerald-100" : "bg-emerald-950/10 border border-emerald-500/10"
                  }`}>
                    <span className="text-[10px] text-emerald-400 font-medium select-none mr-1">
                      {language === "fr" ? "L'admin répond..." : "Admin typing..."}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Real-time typing animation widget */}
              {isBotTyping && (
                <div className="flex items-start gap-2.5 max-w-[85%] self-start">
                  <div className="w-7 h-7 rounded-lg bg-gold/5 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                    <LucioleIcon size={14} className="text-gold animate-pulse" />
                  </div>
                  <div className={`p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 ${
                    theme === "light" ? "bg-slate-100/90" : "bg-white/5 border border-white/5"
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick action helper bubbles */}
            <div className={`px-5 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 border-t ${
              theme === "light" ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
            }`}>
              <button
                onClick={() => setInputText(language === "fr" ? "Tarif pour créer un site internet vitrine" : "Price quote for a website development")}
                className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white border-slate-200 hover:border-gold hover:text-gold text-slate-600"
                    : "bg-navy-dark/30 border-white/5 hover:border-gold hover:text-gold text-slate-300"
                }`}
              >
                {language === "fr" ? "💻 Devis Site Web ?" : "💻 Web Quote ?"}
              </button>
              <button
                onClick={() => setInputText(language === "fr" ? "Coût pour concevoir une application mobile " : "Estimate for a software mobile design")}
                className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white border-slate-200 hover:border-gold hover:text-gold text-slate-600"
                    : "bg-navy-dark/30 border-white/5 hover:border-gold hover:text-gold text-slate-300"
                }`}
              >
                {language === "fr" ? "📱 Application Smartphone ?" : "📱 Mobile App ?"}
              </button>
            </div>

            {/* Bottom active message input bar form */}
            <form
              onSubmit={handleSendMessage}
              className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                theme === "light" ? "bg-white border-slate-200" : "bg-slate-950 border-white/5"
              }`}
            >
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={language === "fr" ? "Écrivez votre message ici..." : "Type your message here..."}
                className={`flex-1 text-sm rounded-xl px-3.5 py-2.5 border transition outline-none ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200 focus:border-gold focus:bg-white text-slate-900"
                    : "bg-white/5 border-white/5 focus:border-gold focus:bg-white/10 text-white"
                }`}
                id="live-chat-input-text"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                  inputText.trim()
                    ? "bg-gold hover:bg-gold-light text-navy-dark"
                    : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
                id="live-chat-submit-btn"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
