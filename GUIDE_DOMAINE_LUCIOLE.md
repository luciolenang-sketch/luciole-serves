# Guide de liaison du domaine — luciole-serves.com

Ce guide vous explique comment lier directement votre nom de domaine **luciole-serves.com** à votre hébergement de production, en toute simplicité et sécurité.

---

## 🌎 Étape 1 : Configurer vos serveurs DNS (chez votre registraire de domaine)

Le registraire est l'entité chez qui vous possédez votre nom de domaine **luciole-serves.com** (comme **OVH**, **Hostinger**, **Gandi**, ou **GoDaddy**). Vous devez ajouter des enregistrements dans sa zone DNS pour diriger le trafic vers votre site final.

### Option A : Si vous hébergez via Firebase Hosting (Recommandé & Gratuit)
Si vous conservez la base de données Firebase et souhaitez l'activer sur ce domaine sans frais mensuels d'hébergement :
1. Allez sur votre console **Firebase** > connectez votre projet > section **Hosting** (Hébergement).
2. Cliquez sur **Ajouter un domaine personnalisé** (Add custom domain).
3. Saisissez `luciole-serves.com`.
4. Firebase va vous fournir des enregistrements **TXT** et **A** (adresse IP) à configurer chez votre registraire.
5. Ajoutez ces lignes dans votre compte de domaine (zone DNS) :
   - **Enregistrement TXT** :
     - Hôte (Host) : `@`
     - Valeur (Value) : *(Fournie par Firebase pour authentifier la propriété du domaine)*
   - **Enregistrements A** :
     - Hôte (Host) : `@` (et un autre avec `www`)
     - Type : `A`
     - Valeur (Value) : *(Les adresses IP fournies par Firebase)*

### Option B : Si vous hébergez sur Hostinger, Vercel ou Netlify
Si vous importez les fichiers HTML/JS statiques compilés de ce projet :
1. Allez dans les réglages de votre hébergeur (ex: Hostinger ou Vercel), section **Domaines**.
2. Liez le domaine `luciole-serves.com`.
3. Configurez les serveurs de noms (DNS) ou l'enregistrement IP recommandé par l'hébergeur.

---

## 🔒 Étape 2 : Activation de la sécurité SSL (HTTPS)
Dès que vos serveurs DNS pointent vers le bon endroit (comptez de 1 heure à 24 heures de propagation mondiale) :
- Le certificat SSL universel sécurisé (qui donne le cadenas vert `https://`) est **généré automatiquement et gratuitement** par Firebase ou votre hébergeur.
- Votre adresse sera accessible en toute sécurité sur **https://luciole-serves.com** !

---

*Ce document a été mis à jour spécifiquement pour vous aider à lancer luciole-serves.com par l'assistant d'ingénierie Google AI Studio.*
