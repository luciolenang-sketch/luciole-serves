/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, ShowcaseItem, Testimonial, VoiceProfile, SoundEffect } from "./types";

export const SERVICES: Service[] = [
  {
    id: "create-web",
    title: "Création de sites web",
    description: "Sites vitrines modernes, boutiques e-commerce performantes, blogs et portfolios optimisés SEO, fluides et parfaitement sécurisés.",
    icon: "🌐",
    category: "digital",
    features: ["Responsive Design", "Optimisé SEO", "Panier e-commerce sécurisé", "Performance de pointe"]
  },
  {
    id: "apps-mobiles",
    title: "Applications mobiles iOS & Android",
    description: "Développement d'applications mobiles natives et hybrides intuitives pour connecter vos clients directement sur leurs smartphones.",
    icon: "📱",
    category: "digital",
    features: ["Interface élégante", "Notifications Push", "Fonctionnement hors-ligne", "Publication Stores"]
  },
  {
    id: "bdd",
    title: "Gestion de bases de données",
    description: "Conception de modèles relationnels (SQL) et NoSQL robustes, développement d'APIs, migration et optimisation de performances.",
    icon: "🗄️",
    category: "digital",
    features: ["Architecture robuste", "APIs sécurisées", "Sauvegardes automatiques", "Indexation optimisée"]
  },
  {
    id: "design-graphique",
    title: "Design graphique & Identité",
    description: "Création de logos originaux, chartes graphiques complètes, flyers et supports digitaux pour affirmer la personnalité de votre marque.",
    icon: "🎨",
    category: "audiovisual",
    features: ["Créations originales", "Haute définition", "Format vectoriel", "Palette de couleurs unique"]
  },
  {
    id: "spots-pubs",
    title: "Spots publicitaires",
    description: "Écriture, tournage, montage et réalisation complète de spots audiovisuels captivants pour dynamiser votre communication d'entreprise.",
    icon: "📢",
    category: "audiovisual",
    features: ["Scénarios impactants", "Montage dynamique", "Mixage de qualité", "Optimisé réseaux sociaux"]
  },
  {
    id: "voix-off",
    title: "Voix off professionnelle",
    description: "Enregistrement en cabine de voix off chaleureuses, dynamiques ou narratives pour vos vidéos promotionnelles, d'e-learning ou de formation.",
    icon: "🎤",
    category: "audiovisual",
    features: ["Qualité studio", "Tons personnalisables", "Français, Anglais & Langues locales", "Nettoyage audio pro"]
  },
  {
    id: "jingles",
    title: "Jingles & Signatures sonores",
    description: "Création de l'empreinte sonore de votre entreprise : jingles radiophoniques, intros de vidéos, signatures de marque et bruitages.",
    icon: "🎵",
    category: "audiovisual",
    features: ["Composition sur-mesure", "Identité mémorable", "Mixage stéréo pro", "Fichiers masterisés"]
  },
  {
    id: "support",
    title: "Maintenance & Support 24/7",
    description: "Accompagnement après-vente, résolution de bugs, mises à jour régulières, sauvegardes quotidiennes et hébergement haute fiabilité.",
    icon: "🛠️",
    category: "support",
    features: ["Suivi technique pro", "Sécurité renforcée", "Intervention express", "Hébergement Cloud"]
  }
];

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "real-1",
    title: "E-Boutique Glamour",
    subtitle: "Magasin de cosmétiques premium en ligne",
    category: "sites",
    badge: "E-Commerce",
    description: "Un site de vente en ligne épuré avec gestion des stocks, passerelles de paiement sécurisées et espace utilisateur optimisé.",
    client: "Institut Glamour Douala",
    year: "2025",
    techs: ["React", "Vite", "Tailwind CSS", "Node.js", "PostgreSQL"],
    svgKey: "ecommerce"
  },
  {
    id: "real-2",
    title: "Plateforme Africa-Consult",
    subtitle: "Site vitrine de cabinet d'audit",
    category: "sites",
    badge: "Vitrine Pro",
    description: "Portail institutionnel haut de gamme avec prise de rendez-vous en ligne, intégration de blog et système d'adhésion.",
    client: "Africa Consult Group LLC",
    year: "2026",
    techs: ["TypeScript", "NextJS", "Tailwind CSS", "Firebase"],
    svgKey: "vitrine"
  },
  {
    id: "real-3",
    title: "Dashboard Giga-Data",
    subtitle: "Panneau de contrôle logistique",
    category: "sites",
    badge: "Web App / Base de données",
    description: "Application web d'administration de flotte et d'entrepôt, connectée à une base PostgresSQL avec filtres en temps réel.",
    client: "Gigafret SA",
    year: "2025",
    techs: ["React", "D3.js", "Express", "SQLite", "Docker"],
    svgKey: "dashboard"
  },
  {
    id: "real-4",
    title: "App Mobile 'Yéma Deliveries'",
    subtitle: "Application de livraison de repas",
    category: "apps",
    badge: "iOS & Android",
    description: "Application de commande et géo-suivi de coursiers avec notifications push instantanées et chat livreur-client.",
    client: "Yéma Foods",
    year: "2026",
    techs: ["React Native", "Google Maps API", "Expo", "Firebase Auth"],
    svgKey: "gestions"
  },
  {
    id: "real-5",
    title: "App 'Kamer Care'",
    subtitle: "Réservation de consultations médicales",
    category: "apps",
    badge: "iOS & Android",
    description: "Rendez-vous et ordonnances sécurisés. Permet de trouver des spécialistes à Douala et Yaoundé et de réserver des créneaux de téléconsultation.",
    client: "Clinique du Centre",
    year: "2025",
    techs: ["Flutter", "Dart", "Node.js", "PostgreSQL"],
    svgKey: "reservation"
  },
  {
    id: "real-6",
    title: "Identité 'Mboa Hub'",
    subtitle: "Charte graphique et logo d'espace de co-working",
    category: "design",
    badge: "Identité Visuelle",
    description: "Design complet de l'identité visuelle de la marque, logo moderne à géométrie variable, supports imprimés et templates de posts réseaux sociaux.",
    client: "Mboa Tech Hub",
    year: "2026",
    techs: ["Figma", "Adobe Illustrator", "Branding Strategy"],
    svgKey: "shopping"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    stars: 5,
    content: "Une écoute et un professionnalisme incroyable ! L'application Yéma Deliveries fonctionne à la perfection et nos ventes ont doublé depuis sa publication sur le Play Store ! Je recommande vivement Luciole Services.",
    author: "Mireille Tchakounté",
    role: "Fondatrice de Yéma Foods",
    location: "Douala, Cameroun",
    avatarSvg: "👩🏾‍💼"
  },
  {
    id: "t-2",
    stars: 5,
    content: "Travailler avec Luciole-services a été une révélation. Pas de frais d'agence inutiles, une réactivité hors pair par WhatsApp, et une base de données optimisée qui répond enfin instantanément à notre dashboard logistique.",
    author: "Christian Ntsama",
    role: "Directeur Technique chez Gigafret",
    location: "Yaoundé, Cameroun",
    avatarSvg: "👨🏾‍💻"
  },
  {
    id: "t-3",
    stars: 5,
    content: "Nous avons commandé un pack site web vitrine + spot de jingle radio. Le résultat est tout simplement spectaculaire. La voix off chaleureuse colle exactement à l'image de marque que nous souhaitions véhiculer.",
    author: "Marc-Antoine Dupuy",
    role: "Co-fondateur Africa-Consult",
    location: "Paris / Paris-Douala",
    avatarSvg: "👨🏻‍💼"
  }
];

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "voice-1",
    name: "Arthur - Le Narrateur",
    description: "Une voix masculine grave, posée et texturée. Présentation parfaite pour les documentaires historiques, les formations e-learning rigoureuses ou la narration de marque haut de gamme.",
    gender: "homme",
    tone: "Grave, chaleureux, pédagogue",
    sampleText: "Bienvenue chez Luciole Services. Nous concevons votre écosystème digital sur-mesure pour donner à votre entreprise l'élégance et la puissance qu'elle mérite."
  },
  {
    id: "voice-2",
    name: "Chloé - L'Énergique",
    description: "Une voix de femme fraîche, souriante et très dynamique. Idéale pour les lancements d'applications mobiles, les spots publicitaires radio percutants et les intros de podcasts.",
    gender: "femme",
    tone: "Dynamique, enthousiaste, souriante",
    sampleText: "Hop ! Besoin d’une application sur-mesure qui booste vos ventes ? Avec Luciole-services, donnez un coup de accélérateur géant à votre business dès aujourd'hui !"
  },
  {
    id: "voice-3",
    name: "Thomas - Le Visionnaire Professional",
    description: "Une voix jeune d'homme d'affaires, calme, moderne et teintée d'assurance. Idéal pour les vidéos de présentation de startups technologiques, de démos d'APIs et de bases de données.",
    gender: "homme",
    tone: "Corporate, sérieux, technologique",
    sampleText: "Explorez une nouvelle dimension de performance avec notre gestionnaire de bases de données. Structuré pour durer, conçu pour scaler sans limite."
  },
  {
    id: "voice-4",
    name: "Léa - La Chaleureuse",
    description: "Une voix féminine douce, rassurante et professionnelle. Convient idéalement aux vidéos médicales, aux tutoriels guidés ou à la voix d'accueil interactive de votre standard téléphonique.",
    gender: "femme",
    tone: "Douce, rassurante, accueillante",
    sampleText: "Chez Luciole-services, nous prenons soin de votre image de marque. Discutez dès aujourd'hui avec l'un de nos conseillers disponibles sur WhatsApp."
  }
];

export const MOCK_SOUND_EFFECTS: SoundEffect[] = [
  { id: "sfx-1", name: "Jingle Tech", emoji: "⚡", frequency: 523.25, type: "sine", duration: 0.6 },
  { id: "sfx-2", name: "Notification Soft", emoji: "🔔", frequency: 880.00, type: "triangle", duration: 0.3 },
  { id: "sfx-3", name: "Voix Synthétique", emoji: "🔊", frequency: 329.63, type: "sawtooth", duration: 0.5 },
  { id: "sfx-4", name: "Basse Profonde", emoji: "🎵", frequency: 130.81, type: "square", duration: 0.7 }
];
