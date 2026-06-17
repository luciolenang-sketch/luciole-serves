/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export const Marquee: React.FC = () => {
  const items = [
    "Création de sites internet vitrines",
    "Boutiques e-commerce connectées",
    "Applications Mobiles iOS & Android",
    "Bases de données SQL / NoSQL",
    "Logos & Chartes Graphiques",
    "Spots publicitaires voix off & vidéos",
    "Sélecteur de voix off et jingles",
    "Maintenance & Support Technique pro",
  ];

  return (
    <div className="bg-gold py-4 overflow-hidden whitespace-nowrap border-y border-gold-light/20 relative z-20 shadow-md">
      <div className="inline-flex gap-16 animate-scroll-left text-navy-dark font-extrabold text-sm sm:text-base tracking-wide uppercase">
        {/* Render twice for continuous loop */}
        {[...items, ...items, ...items].map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-3">
            <span className="text-navy text-lg">★</span>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
