/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

const corporateTeamImg = "/images/corporate_team_vector_1781529512565.jpg";
const phoneProductivityImg = "/images/phone_productivity_vector_1781529525196.jpg";
const dbCodingImg = "/images/coding_database_vector_1781529539964.jpg";
const sfxStudioImg = "/images/vocal_studio_vector_1781529554333.jpg";

// Slide 1 Illustrator: Interactive team building solutions
export const TeamIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 900 600" className="w-full h-full object-cover select-none bg-navy-dark">
      {/* Decorative grids */}
      <circle cx="780" cy="90" r="120" fill="#D4A017" opacity="0.1" />
      <circle cx="80" cy="480" r="150" fill="#D4A017" opacity="0.08" aria-hidden="true" />
      
      {/* Table */}
      <ellipse cx="450" cy="540" rx="380" ry="34" fill="#000000" opacity="0.25" />
      <rect x="180" y="380" width="540" height="26" rx="8" fill="url(#deskGrad)" />
      <rect x="210" y="406" width="35" height="120" fill="#a1750e" />
      <rect x="655" y="406" width="35" height="120" fill="#a1750e" />

      {/* Main Screen */}
      <rect x="340" y="160" width="220" height="150" rx="10" fill="#FFFFFF" />
      <rect x="352" y="172" width="196" height="126" rx="4" fill="#1B3A4B" />
      <rect x="370" y="190" width="70" height="8" rx="4" fill="#F1C94A" className="animate-pulse" />
      <rect x="370" y="210" width="120" height="6" rx="3" fill="#D4A017" />
      <rect x="370" y="225" width="90" height="6" rx="3" fill="#6B7C85" />
      <rect x="370" y="240" width="140" height="6" rx="3" fill="#6B7C85" />
      
      {/* Laptop Left */}
      <rect x="200" y="350" width="110" height="8" rx="3" fill="#E2E8EC" />
      <rect x="215" y="290" width="80" height="60" rx="5" fill="#FFFFFF" />
      <rect x="220" y="295" width="70" height="48" rx="2" fill="#0E2229" />
      <rect x="228" y="302" width="35" height="4" rx="2" fill="#F1C94A" />
      <rect x="228" y="312" width="45" height="3" rx="1.5" fill="#6B7C85" />

      {/* Coffee Cup */}
      <rect x="610" y="340" width="30" height="36" rx="5" fill="#FFFFFF" />
      <path d="M640 348 C650 348, 650 360, 640 360" fill="none" stroke="#FFFFFF" strokeWidth="4" />
      <ellipse cx="625" cy="340" rx="15" ry="3" fill="#D4A017" />

      {/* Plant potted */}
      <rect x="690" y="335" width="30" height="35" rx="5" fill="#A1750E" />
      <path d="M705 335 C680 300, 670 280, 665 285" stroke="#4CAF50" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M705 335 C725 300, 735 275, 740 280" stroke="#81C784" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Designer woman */}
      <g>
        <rect x="290" y="330" width="14" height="60" rx="4" fill="#6B7C85" />
        <rect x="370" y="330" width="14" height="60" rx="4" fill="#6B7C85" />
        <path d="M285 330 Q340 290 395 330" fill="none" stroke="#6B7C85" strokeWidth="12" strokeLinecap="round" />
        <rect x="305" y="315" width="90" height="65" rx="25" fill="#1B3A4B" />
        {/* head */}
        <circle cx="350" cy="245" r="30" fill="#8D5524" />
        <path d="M320 240 A30 30 0 0 1 380 240 Q380 220 350 220 Q320 220 320 240 Z" fill="#0E2229" />
        <circle cx="340" cy="245" r="3" fill="#0E2229" />
        <circle cx="360" cy="245" r="3" fill="#0E2229" />
        <path d="M340 258 Q350 266 360 258" stroke="#0E2229" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Coder man */}
      <g>
        <rect x="520" y="330" width="12" height="60" rx="4" fill="#6B7C85" />
        <rect x="600" y="330" width="12" height="60" rx="4" fill="#6B7C85" />
        <path d="M515 330 Q565 290 615 330" fill="none" stroke="#6B7C85" strokeWidth="12" strokeLinecap="round" />
        <rect x="535" y="315" width="90" height="65" rx="25" fill="#D4A017" />
        {/* head */}
        <circle cx="580" cy="245" r="30" fill="#C58F59" />
        <path d="M552 240 A30 30 0 0 1 608 240 Q600 215 580 215 T552 240" fill="#0E2229" />
        <circle cx="570" cy="245" r="3" fill="#0E2229" />
        <circle cx="592" cy="245" r="3" fill="#0E2229" />
        <path d="M572 258 Q580 264 588 258" stroke="#0E2229" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1C94A" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Slide 2 Illustrator: Dedicated developer dashboard coding
export const CoderIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 900 600" className="w-full h-full object-cover select-none bg-navy-dark">
      {/* Graphic effects */}
      <circle cx="740" cy="120" r="140" fill="#D4A017" opacity="0.07" />
      <ellipse cx="450" cy="540" rx="380" ry="30" fill="#000000" opacity="0.22" />

      {/* Console framework */}
      <rect x="220" y="100" width="460" height="340" rx="14" fill="#FFFFFF" />
      <rect x="220" y="100" width="460" height="42" rx="14" fill="#1B3A4B" />
      <circle cx="250" cy="121" r="6" fill="#FF5F56" />
      <circle cx="270" cy="121" r="6" fill="#FFBD2E" />
      <circle cx="290" cy="121" r="6" fill="#27C93F" />
      <rect x="330" y="111" width="240" height="20" rx="10" fill="#0E2229" />

      {/* Inside console */}
      <rect x="236" y="156" width="428" height="270" rx="6" fill="#0E2229" />
      <rect x="256" y="180" width="80" height="12" rx="4" fill="#F1C94A" />
      <rect x="256" y="205" width="180" height="8" rx="3" fill="#D4A017" />
      <rect x="256" y="222" width="280" height="6" rx="3" fill="#6B7C85" />
      <rect x="256" y="238" width="220" height="6" rx="3" fill="#6B7C85" />
      <rect x="256" y="260" width="100" height="12" rx="4" fill="#81C784" />
      <rect x="256" y="282" width="240" height="6" rx="3" fill="#6B7C85" />
      <rect x="256" y="298" width="160" height="6" rx="3" fill="#6B7C85" />
      <rect x="256" y="325" width="120" height="12" rx="4" fill="#F1C94A" />
      <rect x="256" y="348" width="290" height="6" rx="3" fill="#6B7C85" />
      <rect x="256" y="364" width="210" height="6" rx="3" fill="#6B7C85" />

      {/* Hand typing */}
      <g className="animate-float">
        <path d="M140 480 Q210 400 320 440" fill="none" stroke="#C58F59" strokeWidth="18" strokeLinecap="round" />
        <path d="M760 480 Q690 400 580 440" fill="none" stroke="#C58F59" strokeWidth="18" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// Slide 3 Illustrator: Professional customized web panels
export const WebCreationIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 900 600" className="w-full h-full object-cover select-none bg-navy-dark">
      <circle cx="150" cy="120" r="100" fill="#D4A017" opacity="0.08" />
      <circle cx="750" cy="460" r="140" fill="#D4A017" opacity="0.05" />

      {/* Floating panels */}
      <g className="animate-float" style={{ animationDelay: "1s" }}>
        <rect x="180" y="80" width="310" height="230" rx="12" fill="#FFFFFF" />
        <rect x="180" y="80" width="310" height="35" rx="12" fill="#E2E8EC" />
        <circle cx="210" cy="97" r="5" fill="#FF5F56" />
        <circle cx="225" cy="97" r="5" fill="#FFBD2E" />
        <circle cx="240" cy="97" r="5" fill="#27C93F" />
        
        <rect x="210" y="140" width="160" height="16" rx="8" fill="#1B3A4B" />
        <rect x="210" y="170" width="230" height="8" rx="4" fill="#6B7C85" />
        <rect x="210" y="185" width="180" height="8" rx="4" fill="#6B7C85" />
        <rect x="210" y="215" width="100" height="30" rx="15" fill="#D4A017" />
        {/* small chart bar */}
        <rect x="350" y="215" width="20" height="60" rx="4" fill="#81C784" />
        <rect x="380" y="195" width="20" height="80" rx="4" fill="#F1C94A" />
        <rect x="410" y="225" width="20" height="50" rx="4" fill="#1B3A4B" />
      </g>

      <g className="animate-float" style={{ animationDelay: "3s" }}>
        <rect x="440" y="250" width="280" height="230" rx="12" fill="#FFFFFF" />
        <rect x="440" y="250" width="280" height="35" rx="12" fill="#1B3A4B" />
        <circle cx="470" cy="267" r="5" fill="#D4A017" />
        <rect x="490" y="262" width="100" height="10" rx="5" fill="#FFFFFF" opacity="0.7" />

        <rect x="475" y="310" width="210" height="100" rx="8" fill="#F7F5F1" />
        {/* Draw a gorgeous vector audio voice wave indicator */}
        <path d="M 495 360 Q 515 310, 535 360 T 575 360 T 615 360 T 655 360" fill="none" stroke="#D4A017" strokeWidth="4" strokeLinecap="round" />
        <circle cx="535" cy="310" r="5" fill="#F1C94A" />
        <circle cx="575" cy="410" r="5" fill="#1B3A4B" />
        <text x="580" y="425" fontFamily="Poppins" fontSize="11" fill="#6B7C85" textAnchor="middle">Audio Signal Master</text>
      </g>
    </svg>
  );
};

// Slide 4 / AV Section: Recording micro studio wave audio vectors
export const AudioRecordingIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 900 600" className="w-full h-full object-cover select-none bg-navy-dark">
      {/* Ambient glowing circles */}
      <circle cx="450" cy="300" r="180" fill="#D4A017" opacity="0.05" />
      <ellipse cx="450" cy="540" rx="320" ry="24" fill="#000000" opacity="0.3" />

      {/* Mic stand */}
      <rect x="445" y="260" width="10" height="240" rx="5" fill="#FFFFFF" />
      <ellipse cx="450" cy="495" rx="50" ry="12" fill="#1B3A4B" />

      {/* Mic dynamic */}
      <rect x="425" y="160" width="50" height="110" rx="25" fill="#D4A017" />
      <rect x="432" y="170" width="36" height="90" rx="18" fill="#F1C94A" />
      {/* grid lines */}
      <line x1="425" y1="200" x2="475" y2="200" stroke="#1B3A4B" strokeWidth="3" />
      <line x1="425" y1="215" x2="475" y2="215" stroke="#1B3A4B" strokeWidth="3" />
      <line x1="425" y1="230" x2="475" y2="230" stroke="#1B3A4B" strokeWidth="3" />

      {/* Sound waves expanding */}
      <path d="M 390 190 Q 360 215, 390 240" fill="none" stroke="#F1C94A" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
      <path d="M 365 175 Q 320 215, 365 255" fill="none" stroke="#F1C94A" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      
      <path d="M 510 190 Q 540 215, 510 240" fill="none" stroke="#F1C94A" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
      <path d="M 535 175 Q 580 215, 535 255" fill="none" stroke="#F1C94A" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      {/* Equalizer mixer tray */}
      <rect x="250" y="400" width="400" height="110" rx="14" fill="#FFFFFF" />
      <rect x="270" y="415" width="360" height="15" rx="6" fill="#1B3A4B" />
      <circle cx="340" cy="422" r="10" fill="#D4A017" />

      {/* Faders */}
      <line x1="300" y1="450" x2="300" y2="495" stroke="#E2E8EC" strokeWidth="6" strokeLinecap="round" />
      <circle cx="300" cy="470" r="10" fill="#1B3A4B" />

      <line x1="380" y1="450" x2="380" y2="495" stroke="#E2E8EC" strokeWidth="6" strokeLinecap="round" />
      <circle cx="380" cy="460" r="10" fill="#D4A017" />

      <line x1="460" y1="450" x2="460" y2="495" stroke="#E2E8EC" strokeWidth="6" strokeLinecap="round" />
      <circle cx="460" cy="485" r="10" fill="#1B3A4B" />

      <line x1="540" y1="450" x2="540" y2="495" stroke="#E2E8EC" strokeWidth="6" strokeLinecap="round" />
      <circle cx="540" cy="455" r="10" fill="#81C784" />

      <line x1="600" y1="450" x2="600" y2="495" stroke="#E2E8EC" strokeWidth="6" strokeLinecap="round" />
      <circle cx="600" cy="475" r="10" fill="#D4A017" />
    </svg>
  );
};

// Generic drawing helper for realisations tabs
export const ShowcaseIllustration: React.FC<{ type: string }> = ({ type }) => {
  let imgSrc = "";
  let tag = "";
  
  switch (type) {
    case "ecommerce":
      imgSrc = phoneProductivityImg;
      tag = "E-Commerce Luxe";
      break;
    case "vitrine":
      imgSrc = corporateTeamImg;
      tag = "Corporate & Audit";
      break;
    case "dashboard":
      imgSrc = dbCodingImg;
      tag = "Giga-Data Portal";
      break;
    case "gestions":
      imgSrc = phoneProductivityImg;
      tag = "App Logistique Mobile";
      break;
    case "reservation":
      imgSrc = phoneProductivityImg;
      tag = "Santé iOS & Android";
      break;
    case "shopping":
    default:
      imgSrc = corporateTeamImg;
      tag = "Identité & Marque";
  }

  return (
    <div className="relative w-full h-full overflow-hidden group/illust">
      <img 
        src={imgSrc} 
        alt={tag} 
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/illust:scale-110"
        referrerPolicy="no-referrer"
      />
      {/* 3D premium glass frame borders */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3 px-2 py-0.5 text-[8px] font-bold tracking-widest text-amber-400 bg-black/75 border border-amber-400/20 rounded uppercase font-mono">
        {tag}
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/50 text-[10px] font-mono leading-none">
        <span>RESOLUTION: 3D HD</span>
        <span>STATUS: ACTIVE</span>
      </div>
    </div>
  );
};
