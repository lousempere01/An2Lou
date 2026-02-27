============================================================
  PROJET AN2LOU - Gestionnaire de Musiques, Playlists & Chat
  Auteurs : Lou Sempere
============================================================

1. VUE D'ENSEMBLE
-----------------
An2Lou est une application web full-stack de gestion de
musiques et de playlists avec un chat en temps réel.
L'application permet de constituer sa bibliothèque musicale
(titre, artiste, album, pochette, genre, durée, année),
de créer et gérer des playlists, et de discuter avec les
autres utilisateurs en direct.

Technologies utilisées :
- Backend : Node.js + Express
- Base de données : MongoDB + Mongoose
- Chat temps réel : Socket.io
- Frontend : HTML5, CSS3, JavaScript vanilla

2. POINTS FORTS & ASPECTS INNOVANTS
------------------------------------
- Design moderne sombre inspiré de Spotify avec un thème
  vert néon et des animations fluides.
- Affichage en grille des musiques avec pochettes d'album
  et overlay d'actions au survol.
- Système de favoris avec animation cœur.
- Playlists complètes : création, ajout/retrait de titres,
  vue détaillée avec liste ordonnée.
- Recherche instantanée multi-champs (titre, artiste, album)
  avec debounce.
- Tri multi-critères (date, titre, artiste, année).
- Filtrage par genre musical et par favoris.
- Statistiques en temps réel (titres, artistes, favoris)
  avec animation des compteurs.
- Formulaires d'ajout collapsibles (accordéon).
- Aperçu en direct de la pochette album à l'ajout.
- Chat en temps réel avec Socket.io (indicateur de frappe,
  utilisateurs en ligne, notifications).
- Interface responsive (desktop, tablette, mobile).
- Notifications toast pour chaque action.
- Icône disque compact animée dans le logo.

3. ARCHITECTURE
---------------
an2lou/
├── server.js             # Serveur Express + Socket.io
├── .env                  # Variables d'environnement
├── package.json          # Dépendances npm
├── models/
│   ├── Song.js           # Modèle Mongoose - Musique
│   ├── Playlist.js       # Modèle Mongoose - Playlist
│   └── Message.js        # Modèle Mongoose - Message chat
├── routes/
│   ├── songs.js          # API REST CRUD musiques
│   ├── playlists.js      # API REST CRUD playlists
│   └── messages.js       # API REST messages chat
├── public/
│   ├── index.html        # Page principale (SPA)
│   ├── css/styles.css    # Styles (dark theme musique)
│   └── js/app.js         # Logique côté client
└── README.txt            # Ce fichier

Routes API principales :
  Songs :
    GET    /api/songs           Liste (recherche/tri/filtres)
    POST   /api/songs           Créer une musique
    GET    /api/songs/:id       Détail
    PUT    /api/songs/:id       Modifier
    PATCH  /api/songs/:id/favorite  Basculer favori
    DELETE /api/songs/:id       Supprimer

  Playlists :
    GET    /api/playlists       Liste des playlists
    POST   /api/playlists       Créer une playlist
    GET    /api/playlists/:id   Détail (avec songs populées)
    PUT    /api/playlists/:id   Modifier
    POST   /api/playlists/:id/songs         Ajouter un titre
    DELETE /api/playlists/:id/songs/:songId Retirer un titre
    DELETE /api/playlists/:id   Supprimer

  Chat : Socket.io (user:join, chat:message, chat:typing)
  Messages : GET /api/messages (historique)

4. CONSIGNES D'INSTALLATION
----------------------------
Prérequis :
  - Node.js (v18+)
  - MongoDB (v6+) installé et démarré
  - npm (inclus avec Node.js)

Étapes :
  1. Décompresser le fichier .zip
  2. Ouvrir un terminal dans le dossier du projet
  3. Installer les dépendances :
     $ npm install
  4. S'assurer que MongoDB est démarré :
     $ mongod
  5. (Optionnel) Modifier .env pour ajuster le port
     ou l'URI MongoDB
  6. Démarrer le serveur :
     $ npm start
  7. Ouvrir le navigateur :
     http://localhost:3000

5. DIFFICULTÉS RENCONTRÉES & SOLUTIONS
----------------------------------------
- Gestion des pochettes : Sans upload de fichiers, on
  utilise des URLs d'images. Un aperçu en direct dans le
  formulaire permet de vérifier l'URL avant l'ajout.
  Gestion gracieuse des erreurs de chargement d'image
  (fallback vers icône).

- Playlists avec références : L'utilisation de populate()
  de Mongoose pour résoudre les références Song dans les
  playlists a nécessité une compréhension approfondie des
  relations entre documents MongoDB.

- Chat temps réel : Synchronisation des messages via
  Socket.io avec persistance MongoDB. Gestion de la
  frappe en cours et des connexions/déconnexions.

- Sections collapsibles : Animation fluide de la hauteur
  du formulaire avec max-height et transitions CSS.

- Responsive design : Adaptation de la grille de musiques
  et du layout chat sur mobile avec CSS Grid et Flexbox.

============================================================