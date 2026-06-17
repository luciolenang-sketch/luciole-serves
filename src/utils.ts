/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Format pricing into convenient regional systems (Euro or FCFA for Central/West Africa)
export function formatCurrency(amount: number, currency: "EUR" | "XAF"): string {
  if (currency === "XAF") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}

// Custom interactive synth frequency generator using browser AudioContext
export function playSynthTone(frequency: number, type: OscillatorType = "sine", duration: number = 0.5): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("AudioContext is not allowed or supported on this device/iframe yet.", err);
  }
}

// Speak the client's custom text using the browser HTML5 SpeechSynthesis API
export function speakText(text: string, isFemale: boolean): void {
  try {
    if (!("speechSynthesis" in window)) {
      // Fallback
      playSynthTone(isFemale ? 659.25 : 329.63, "sine", 0.8);
      return;
    }

    // Cancel current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    utterance.pitch = isFemale ? 1.2 : 0.85;

    // Find a matching French voice if possible
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith("fr") && (isFemale ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("chloe") || v.name.toLowerCase().includes("hortense") : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("paul")));
    
    if (frVoice) {
      utterance.voice = frVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis failed", err);
    playSynthTone(isFemale ? 659.25 : 329.63, "sine", 0.5);
  }
}
