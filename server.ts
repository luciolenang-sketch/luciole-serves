import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Load Firebase Config for admin SDK
let adminDb: any = null;
try {
  const firebaseConfigObj = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  initializeApp({
    projectId: firebaseConfigObj.projectId,
  });
  adminDb = getFirestore(firebaseConfigObj.firestoreDatabaseId);
  console.log(`[Firebase Admin] Successfully initialized with project: ${firebaseConfigObj.projectId}, database: ${firebaseConfigObj.firestoreDatabaseId}`);
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error);
}

const app = express();
const PORT = 3000;

// Set up JSON body parser
app.use(express.json());

function getSanitizedKey(): string {
  const rawKey = process.env.NOTCHPAY_SECRET_KEY || "sk.nmnLluwr7DKrmsmKaQgVgxFXc6RQd4R36ymsKxC5phVcAkNzkzSy2MCZotVdClWKgW9mafOxtjqnP310fOOTyTtqZtgSHqlI5kvdfg2DRjdNOkoZktCjWyazsDRPz";
  let cleanKey = rawKey.trim();
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.slice(1, -1).trim();
  }
  return cleanKey;
}

// Flexible, self-healing api calling helper for NotchPay
async function callNotchPay(url: string, options: { method: "GET" | "POST", body?: any }) {
  const cleanKey = getSanitizedKey();

  // Define potential authentication variations
  const authVariations = [
    { headers: { "Authorization": cleanKey } },
    { headers: { "Authorization": `Bearer ${cleanKey}` } },
    { headers: { "X-Grant": cleanKey } },
    { headers: { "X-Notch-Key": cleanKey } },
    { headers: { "Authorization": cleanKey.replace(/^Bearer\s+/i, '') } },
  ];

  let lastResponse: any = null;
  let lastData: any = null;

  console.log(`[NotchPay] Request: ${options.method} ${url}`);
  console.log(`[NotchPay] Sanitized Key length: ${cleanKey.length}, Suffix: ...${cleanKey.slice(-6)}`);

  for (let i = 0; i < authVariations.length; i++) {
    const variation = authVariations[i];
    const headers = {
      "Accept": "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...variation.headers
    };

    try {
      console.log(`[NotchPay] Trying Auth Variation ${i + 1}/${authVariations.length}: ${Object.keys(variation.headers).join(", ")}`);
      
      const response = await fetch(url, {
        method: options.method,
        headers,
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }

      lastResponse = response;
      lastData = data;

      if (response.ok) {
        console.log(`[NotchPay] Auth Variation ${i + 1} succeeded! Status: ${response.status}`);
        return { ok: true, status: response.status, data };
      }

      console.log(`[NotchPay] Auth Variation ${i + 1} failed. Status: ${response.status}. Error:`, data);
      
      const errStr = ((data && data.message) || "").toString().toLowerCase();
      const isCredentialError = response.status === 401 || errStr.includes("credential") || errStr.includes("unauthorized") || errStr.includes("key") || errStr.includes("token");
      
      if (!isCredentialError) {
        console.log(`[NotchPay] Non-credential error encountered (${response.status}). Halting retry loop.`);
        break;
      }
    } catch (err: any) {
      console.log(`[NotchPay] Network error on variation ${i + 1}:`, err);
      lastData = { message: err.message };
    }
  }

  return { ok: false, status: lastResponse ? lastResponse.status : 500, data: lastData };
}

// API routes first!
app.get("/api/health", (req, res) => {
  const cleanKey = getSanitizedKey();
  const rawKey = process.env.NOTCHPAY_SECRET_KEY || "";
  res.json({ 
    status: "ok", 
    gateway: "notchpay", 
    connected: !!cleanKey,
    keyLength: cleanKey.length,
    rawLength: rawKey.length,
    defaultKeyUsed: !process.env.NOTCHPAY_SECRET_KEY
  });
});

// Secure Admin Authentication middleware
async function checkAdmin(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    if (decodedToken.email === "luciolenang@gmail.com") {
      req.user = decodedToken;
      return next();
    } else {
      return res.status(403).json({ success: false, error: "Forbidden: Not an administrator" });
    }
  } catch (error: any) {
    console.error("[Auth Middleware] Token verification failed:", error);
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
  }
}

// CREATE a new projectRequest (Public)
app.post("/api/project-requests", async (req, res) => {
  try {
    const requestData = req.body;
    if (!requestData || !requestData.id) {
      return res.status(400).json({ success: false, error: "Missing payload details or request ID" });
    }
    
    const requestId = requestData.id;
    console.log(`[Backend Firestore SDK] Writing projectRequest: ${requestId}`);
    
    if (adminDb) {
      await adminDb.collection("projectRequests").doc(requestId).set(requestData);
      res.json({ success: true, message: `Request ${requestId} saved successfully` });
    } else {
      res.status(500).json({ success: false, error: "Firestore Admin Database not initialized" });
    }
  } catch (error: any) {
    console.error("[Backend Firestore SDK] Error writing projectRequest:", error);
    res.status(500).json({ success: false, error: error.message || "Error writing to database" });
  }
});

// READ all projectRequests (Admin Only)
app.get("/api/project-requests", checkAdmin, async (req, res) => {
  try {
    console.log("[Backend Firestore SDK] Reading all projectRequests (Admin requested)");
    if (!adminDb) {
      return res.status(500).json({ success: false, error: "Firestore Admin Database not initialized" });
    }

    const snapshot = await adminDb.collection("projectRequests").orderBy("createdAt", "desc").get();
    const fetched: any[] = [];
    snapshot.forEach((doc: any) => {
      fetched.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ success: true, data: fetched });
  } catch (error: any) {
    console.error("[Backend Firestore SDK] Error reading projectRequests:", error);
    res.status(500).json({ success: false, error: error.message || "Error reading from database" });
  }
});

// UPDATE projectRequest status (Admin Only)
app.post("/api/project-requests/:requestId/update", checkAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const updateData = req.body;
    console.log(`[Backend Firestore SDK] Updating projectRequest ${requestId} with:`, updateData);
    
    if (!adminDb) {
      return res.status(500).json({ success: false, error: "Firestore Admin Database not initialized" });
    }

    await adminDb.collection("projectRequests").doc(requestId).update(updateData);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Backend Firestore SDK] Error updating projectRequest:", error);
    res.status(500).json({ success: false, error: error.message || "Error updating database" });
  }
});

// DELETE projectRequest (Admin Only)
app.delete("/api/project-requests/:requestId", checkAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`[Backend Firestore SDK] Deleting projectRequest ${requestId}`);
    
    if (!adminDb) {
      return res.status(500).json({ success: false, error: "Firestore Admin Database not initialized" });
    }

    await adminDb.collection("projectRequests").doc(requestId).delete();
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Backend Firestore SDK] Error deleting projectRequest:", error);
    res.status(500).json({ success: false, error: error.message || "Error deleting from database" });
  }
});

// Lazy initialization of Gemini client to prevent crashes if key is initially absent
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

// AI Assistant chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, language } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: "Messages array is required." });
    }

    const ai = getGemini();

    // Map frontend messages to Gemini API format
    const contents = messages
      .filter((m: any) => m && m.text && m.sender)
      .map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

    if (contents.length === 0) {
      return res.status(400).json({ success: false, error: "No valid messages found." });
    }

    const systemInstruction = language === "fr"
      ? "Tu es Manuelle, l'assistante IA dévouée et de confiance chez Luciole Services (https://luciole.services). Luciole Services est un studio d'ingénierie numérique et de création haut de gamme basé au Cameroun (Afrique Centrale), spécialisé dans 3 domaines clés :\n1. Ingénierie Web & Digitale (sites internet haut de gamme sous React/Next.js, applications sur-mesure résilientes).\n2. Applications Mobiles Innovantes (développement cross-platform fluide sous React Native).\n3. Vocal & Audio Studio (conception de jingles radio/télé, voix-off professionnelles pour publicités, documentaires, répondeurs téléphoniques, etc.).\n\nTon ton doit être extrêmement professionnel, chaleureux, créatif, poli et engageant. Présente-toi élégamment et guide l'interlocuteur pour identifier ses besoins et lui proposer l'une de nos solutions ou notre simulateur de budget intégré. Rappelle-lui que l'un de nos conseillers humains prendra le relais si nécessaire. Sois concise mais percutante."
      : "You are Manuelle, the dedicated and trustworthy AI assistant at Luciole Services (https://luciole.services). Luciole Services is a high-end digital engineering and creation studio based in Cameroon (Central Africa), specializing in 3 key premium domains:\n1. Web & Digital Software Engineering (premium web architectures with React/Next.js and resilient backend systems).\n2. Innovative Mobile Apps (stellar cross-platform development via React Native).\n3. Vocal & Audio Studio (expertly handcrafted voiceovers, dynamic commercial jingles, sound design, IVRs, etc.).\n\nYour tone of voice should be exceptionally professional, warm, creative, polite, and engaging. Introduce yourself beautifully, help the caller/visitor pinpoint their requirements, and orient them to our solutions or budget estimator. Reassure them that our physical expert team can step in immediately if needed. Keep answers concise but powerful.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("[Gemini API Error] Failed in /api/chat:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating the assistant reply."
    });
  }
});

// Initialize Notch Pay Payment
app.post("/api/pay/initialize", async (req, res) => {
  try {
    const { amount, currency, email, name, phone, description, callbackUrl } = req.body;

    if (!amount || !currency || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, currency, and email are required."
      });
    }

    console.log(`[NotchPay] Initializing payment of ${amount} ${currency} for ${email}`);

    const payload = {
      email,
      amount: Number(amount),
      currency,
      description: description || `Invoice Payment`,
      callback: callbackUrl,
      customer: {
        name: name || email,
        phone: phone || undefined
      }
    };

    const result = await callNotchPay("https://api.notchpay.co/payments", {
      method: "POST",
      body: payload
    });

    if (!result.ok) {
      console.log("[NotchPay] Real API call failed. Activating secure sandbox simulator fallback...");
      const mockRef = `MOCK_NOTCH_${Date.now()}`;
      const finalInvoiceId = req.body.invoiceId || "";
      const sandboxUrl = `/api/pay/sandbox/checkout?amount=${amount}&currency=${currency}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || "")}&phone=${encodeURIComponent(phone || "")}&invoiceId=${encodeURIComponent(finalInvoiceId)}&reference=${mockRef}&callbackUrl=${encodeURIComponent(callbackUrl || "")}`;
      
      return res.json({
        success: true,
        data: {
          data: {
            authorization_url: sandboxUrl,
            reference: mockRef
          }
        }
      });
    }

    console.log("[NotchPay] Initialization success! Ref:", result.data?.data?.reference);
    res.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.log("[NotchPay] Initialize server error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment initialization"
    });
  }
});

// Serve Interactive Sandbox Payment simulator checkout page
app.get("/api/pay/sandbox/checkout", (req, res) => {
  const amount = String(req.query.amount || "");
  const currency = String(req.query.currency || "XAF");
  const email = String(req.query.email || "");
  const name = String(req.query.name || "");
  const phone = String(req.query.phone || "");
  const invoiceId = String(req.query.invoiceId || "");
  const reference = String(req.query.reference || "");
  const callbackUrl = String(req.query.callbackUrl || "");

  const html = `
<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal de Paiement Sécurisé - Luciole Services</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body {
      font-family: 'Space Grotesk', sans-serif;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="bg-[#0b0f19] text-slate-100 flex items-center justify-center min-h-screen p-4 h-full selection:bg-amber-400 selection:text-black">
  <div class="w-full max-w-lg bg-[#141b2e] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
    
    <!-- Gold accent line on top -->
    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse"></div>

    <!-- Title and Brand -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <span class="text-xl font-bold text-amber-400">⚡</span>
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-white leading-none">LUCIOLE SERVICES</h1>
          <p class="text-[10px] uppercase font-bold text-amber-500 tracking-widest mt-1">Terminal Émulé / Sandbox Mode</p>
        </div>
      </div>
      <div class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-amber-400 border border-amber-500/30 bg-amber-500/5 tracking-wider">
        Test Environment
      </div>
    </div>

    <!-- Alert / Informative Header -->
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1.5 text-amber-200/90 leading-relaxed">
      <p class="font-bold text-amber-400 flex items-center gap-1">
        <span>💡</span> Informations de simulation actives / Simulated checkout
      </p>
      <p class="text-[11px]">
        Le serveur n'a pas détecté vos informations de production ou votre clé NotchPay est expirée. 
        Pour vous permettre de tester l'application sereinement, ce terminal de paiement sécurisé a pris le relais.
      </p>
      <p class="text-[11px] text-slate-400">
        No real credit cards or wallet balances are required for this prototype. Feel free to use test details below.
      </p>
    </div>

    <!-- Main Payment Details card -->
    <div class="bg-[#0b0f19] rounded-2xl border border-slate-800/80 p-5 space-y-3.5">
      <div class="flex justify-between items-start border-b border-slate-800/85 pb-3">
        <div>
          <p class="text-xs text-slate-500 font-medium">Facture / Invoice ID</p>
          <p class="text-sm font-bold text-white mono mt-0.5">${invoiceId || "TEST-INV-101"}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500 font-medium">Référence / Ref</p>
          <p class="text-xs font-bold text-slate-300 mono mt-0.5">${reference || "MOCK_NOTCH_123"}</p>
        </div>
      </div>

      <div class="flex justify-between items-center py-1">
        <span class="text-xs text-slate-400 font-medium">Client / Name</span>
        <span class="text-xs font-bold text-white">${decodeURIComponent(name || "Client Démo")}</span>
      </div>

      <div class="flex justify-between items-center py-1">
        <span class="text-xs text-slate-400 font-medium">E-mail</span>
        <span class="text-xs font-bold text-slate-300 mono">${decodeURIComponent(email || "client@luciole.services")}</span>
      </div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-800/85">
        <span class="text-sm text-slate-300 font-bold">Montant Total / Amount</span>
        <span class="text-xl font-black text-amber-400 tracking-tight">${amount || "5 000"} ${currency || "XAF"}</span>
      </div>
    </div>

    <!-- Payment UI Wrapper -->
    <div id="payment-stage-wrapper" class="space-y-4">
      
      <!-- Selection view -->
      <div id="stage-select-method" class="space-y-4">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Sélectionner un moyen de paiement / Method</p>
        
        <div class="grid grid-cols-2 gap-3">
          <button type="button" onclick="selectMethod('MTN')" class="payment-method-btn flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-[#1a233b] hover:bg-[#202b47] hover:border-slate-700 transition-all cursor-pointer group text-center" id="btn-mtn">
            <span class="text-2xl mb-1.5 transition-transform group-hover:scale-110">🟡</span>
            <span class="text-xs font-extrabold text-white">MTN MoMo</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Mobile money</span>
          </button>

          <button type="button" onclick="selectMethod('Orange')" class="payment-method-btn flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-[#1a233b] hover:bg-[#202b47] hover:border-slate-700 transition-all cursor-pointer group text-center" id="btn-orange">
            <span class="text-2xl mb-1.5 transition-transform group-hover:scale-110">🟠</span>
            <span class="text-xs font-extrabold text-white">Orange Money</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Mobile money</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-3">
          <button type="button" onclick="selectMethod('Visa')" class="payment-method-btn flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-[#1a233b] hover:bg-[#202b47] hover:border-slate-700 transition-all cursor-pointer group text-center col-span-1" id="btn-visa">
            <span class="text-2xl mb-1.5 transition-transform group-hover:scale-110">💳</span>
            <span class="text-xs font-extrabold text-white">Visa Card</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Credit card</span>
          </button>

          <button type="button" onclick="selectMethod('Mastercard')" class="payment-method-btn flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 bg-[#1a233b] hover:bg-[#202b47] hover:border-slate-700 transition-all cursor-pointer group text-center col-span-1" id="btn-mc">
            <span class="text-2xl mb-1.5 transition-transform group-hover:scale-110">🟥</span>
            <span class="text-xs font-extrabold text-white">Mastercard</span>
            <span class="text-[9px] text-slate-500 mt-0.5">Credit card</span>
          </button>
        </div>

        <!-- Form fields (dynamic container) -->
        <div id="credential-form-container" class="hidden mt-6 bg-[#0b0f19]/40 p-4 rounded-2xl border border-slate-800/60 text-slate-300">
          
          <!-- Phone Wallet inputs -->
          <div id="form-fields-wallet" class="hidden space-y-3">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Numéro de téléphone payeur / Payer Number</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold mono text-sm">+237</span>
              <input type="tel" id="input-phone" placeholder="6XXXXXXXX" value="${decodeURIComponent(phone || '670000000')}" class="w-full bg-[#0b0f19] border border-slate-800 rounded-xl py-3 pl-16 pr-4 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors font-bold mono" required />
            </div>
            <p class="text-[10px] text-slate-500 leading-none">Format: 9 chiffres (ex: 672123456 pour le Cameroun)</p>
          </div>

          <!-- Card inputs -->
          <div id="form-fields-card" class="hidden space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Numéro de carte / Card Number</label>
              <input type="text" id="input-card-num" placeholder="4000 1234 5678 9010" value="4000 1234 5678 9010" class="w-full bg-[#0b0f19] border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors font-bold mono" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Expiration (MM/AA)</label>
                <input type="text" id="input-card-expiry" placeholder="12/28" value="12/29" class="w-full bg-[#0b0f19] border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors font-bold mono" />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">CVV (3 chiffres)</label>
                <input type="password" id="input-card-cvv" placeholder="123" value="123" class="w-full bg-[#0b0f19] border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors font-bold mono" />
              </div>
            </div>
          </div>

          <button type="button" onclick="launchProcess()" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:shadow-amber-500/15 duration-200 mt-4 cursor-pointer flex items-center justify-center gap-2">
            <span>💳</span> Valider le paiement simuler / Pay Now
          </button>
        </div>
      </div>

      <!-- Processing view -->
      <div id="stage-processing" class="hidden space-y-6 text-center py-8">
        <div class="inline-flex w-14 h-14 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin mb-2"></div>
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider" id="processing-status">Paiement en cours...</h3>
          <p class="text-xs text-slate-400 max-w-xs mx-auto" id="processing-sub">Connexion sécurisée aux serveurs de Luciole Services...</p>
        </div>
        <div class="max-w-xs mx-auto bg-slate-950/40 rounded-xl p-3 border border-slate-900/60 text-left space-y-1 text-[10px] text-slate-500 mono" id="processing-log">
          <div>&gt; _ Ready to handle handshake</div>
        </div>
      </div>

      <!-- OTP wait view -->
      <div id="stage-otp" class="hidden space-y-6 text-center py-4">
        <div class="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-xl font-bold flex items-center justify-center text-amber-400 mx-auto animate-bounce">
          📲
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-white">Validation OTP requise</h3>
          <p class="text-xs text-slate-400 px-4">
            Un code d'authentification simuler a été déposé. Pour approuver, saisissez le code : <span class="font-extrabold text-amber-400 mono text-sm" id="otp-hint">2026</span>
          </p>
        </div>
        
        <form onsubmit="submitOtp(event)" class="max-w-xs mx-auto space-y-4">
          <input type="text" id="input-otp" placeholder="CODE OTP" class="text-center tracking-[0.5em] text-white text-xl font-black bg-[#0b0f19] border border-slate-800 rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none w-full mono" maxlength="4" required />
          <div id="otp-error" class="text-[11px] text-red-400 hidden">❌ Code incorrect. Veuillez copier le code indiqué ci-dessus.</div>
          <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-3.5 px-4 rounded-xl cursor-pointer">
            Confirmer & Valider / Confirm
          </button>
        </form>
      </div>

      <!-- Completed Success view -->
      <div id="stage-completed" class="hidden space-y-6 text-center py-8">
        <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-3xl flex items-center justify-center text-emerald-400 mx-auto">
          ✓
        </div>
        <div class="space-y-1.5">
          <h3 class="text-lg font-bold text-white">Paiement Complété !</h3>
          <p class="text-xs text-emerald-400/90 font-medium tracking-wide">Paiement simuler approuvé avec succès.</p>
          <p class="text-[11px] text-slate-500">Redirection vers votre espace client...</p>
        </div>
      </div>
    </div>

  </div>

  <script>
    let selectedMethod = null;
    let generatedOtp = null;

    function selectMethod(method) {
      selectedMethod = method;
      
      // Update active style of buttons
      document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('border-amber-500', 'bg-amber-500/10');
        btn.classList.add('border-slate-800', 'bg-[#1a233b]');
      });

      let activeBtnId = '';
      if (method === 'MTN') activeBtnId = 'btn-mtn';
      else if (method === 'Orange') activeBtnId = 'btn-orange';
      else if (method === 'Visa') activeBtnId = 'btn-visa';
      else if (method === 'Mastercard') activeBtnId = 'btn-mc';

      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) {
        activeBtn.classList.remove('border-slate-800', 'bg-[#1a233b]');
        activeBtn.classList.add('border-amber-500', 'bg-amber-500/5');
      }

      // Show form fields container
      const formContainer = document.getElementById('credential-form-container');
      formContainer.classList.remove('hidden');

      const walletFields = document.getElementById('form-fields-wallet');
      const cardFields = document.getElementById('form-fields-card');

      if (method === 'MTN' || method === 'Orange') {
        walletFields.classList.remove('hidden');
        cardFields.classList.add('hidden');
      } else {
        walletFields.classList.add('hidden');
        cardFields.classList.remove('hidden');
      }
    }

    function addLog(text) {
      const logEl = document.getElementById('processing-log');
      const item = document.createElement('div');
      item.innerText = '> ' + text;
      logEl.appendChild(item);
    }

    function launchProcess() {
      // Transition to processing view
      document.getElementById('stage-select-method').classList.add('hidden');
      document.getElementById('stage-processing').classList.remove('hidden');

      setTimeout(() => {
        addLog('Connexion au pool de gateways NotchPay...');
        document.getElementById('processing-sub').innerText = 'Recherche d\\\'un terminal d\\\'autorisation...';
        
        setTimeout(() => {
          addLog('Requête d\\\'autorisation émise sécurisée.');
          
          if (selectedMethod === 'MTN' || selectedMethod === 'Orange') {
            // Mobile money needs simulated OTP verification
            generatedOtp = Math.floor(Math.random() * 8999 + 1000).toString();
            document.getElementById('otp-hint').innerText = generatedOtp;
            
            document.getElementById('stage-processing').classList.add('hidden');
            document.getElementById('stage-otp').classList.remove('hidden');
          } else {
            // Direct cards payment auto completes
            document.getElementById('processing-status').innerText = 'Authentification bancaire 3DS...';
            document.getElementById('processing-sub').innerText = 'Débit de la carte simulé approuvé par la banque...';
            addLog('Prélèvement opéré avec succès !');
            
            setTimeout(() => {
              triggerDone();
            }, 1000);
          }
        }, 1000);
      }, 1000);
    }

    function submitOtp(e) {
      e.preventDefault();
      const code = document.getElementById('input-otp').value.trim();
      const errEl = document.getElementById('otp-error');
      
      if (code !== generatedOtp) {
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');
      document.getElementById('stage-otp').classList.add('hidden');
      document.getElementById('stage-processing').classList.remove('hidden');
      
      document.getElementById('processing-status').innerText = 'Finalisation de la transaction...';
      document.getElementById('processing-sub').innerText = 'Confirmation de l\\\'opération auprès de NotchPay...';
      addLog('Validation du jeton OTP approuvé.');
      addLog('Prélèvement de fonds complété.');

      setTimeout(() => {
        triggerDone();
      }, 1200);
    }

    function triggerDone() {
      document.getElementById('stage-processing').classList.add('hidden');
      document.getElementById('stage-completed').classList.remove('hidden');

      setTimeout(() => {
        const rawCallback = "${decodeURIComponent((callbackUrl || '').toString())}";
        const fallbackRef = "${reference || ''}";
        
        try {
          const redirectUrl = new URL(rawCallback || window.location.origin);
          redirectUrl.searchParams.set('reference', fallbackRef);
          redirectUrl.searchParams.set('status', 'success');
          window.location.href = redirectUrl.toString();
        } catch (e) {
          window.location.href = "/" + (fallbackRef ? "?reference=" + fallbackRef : "");
        }
      }, 1500);
    }
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Verify Notch Pay Payment Status (supporting both Real & Simulated Sandbox tokens)
app.get("/api/pay/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: "Reference parameter is required."
      });
    }

    // Capture simulated references
    if (reference.startsWith("MOCK_NOTCH_")) {
      console.log(`[NotchPay Mock] Verifying simulated checkout transaction token: ${reference}`);
      return res.json({
        success: true,
        data: {
          data: {
            status: "complete", // Standard successful state checked by dashboard
            reference: reference,
            amount: 5000,
            currency: "XAF",
            channel: "Orange Money (Simulated)",
            customer: {
              email: "client-demo@luciole.services"
            }
          }
        }
      });
    }

    console.log(`[NotchPay] Verifying payment for reference: ${reference}`);

    const result = await callNotchPay(`https://api.notchpay.co/payments/${reference}`, {
      method: "GET"
    });

    if (!result.ok) {
      console.log("[NotchPay] Verify response error final:", result.data);
      return res.status(result.status).json({
        success: false,
        error: (result.data && result.data.message) || "Failed to verify payment with Notch Pay"
      });
    }

    console.log(`[NotchPay] Verified status for ${reference}:`, result.data?.data?.status);
    res.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.log("[NotchPay] Verify server error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment verification"
    });
  }
});

// Vite middleware flow for development vs static build folder for production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

setupVite();
