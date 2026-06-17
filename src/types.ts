/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "digital" | "audiovisual" | "support";
  features: string[];
}

export interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  category: "sites" | "apps" | "design";
  badge: string;
  description: string;
  client: string;
  year: string;
  techs: string[];
  svgKey: "ecommerce" | "vitrine" | "dashboard" | "gestions" | "reservation" | "shopping";
}

export interface Testimonial {
  id: string;
  stars: number;
  content: string;
  author: string;
  role: string;
  location: string;
  avatarSvg: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: "homme" | "femme";
  tone: string;
  sampleText: string;
  speechSynthesisVoiceName?: string; // Standard Web Speech API voice filters
}

export interface SoundEffect {
  id: string;
  name: string;
  emoji: string;
  frequency: number; // Synth fallback frequency
  type: OscillatorType; // Synth type
  duration: number;
}
