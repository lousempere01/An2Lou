PROJET AN2LOU
=============
Auteur : Lou Sempere

Description
-----------
Application web pour gerer des musiques et des playlists,
avec un chat en temps reel entre utilisateurs.

On peut ajouter des musiques (titre, artiste, album, genre,
pochette, duree, annee), les mettre en favoris, les
organiser dans des playlists, et discuter via le chat.

Technologies
------------
- Node.js / Express
- MongoDB / Mongoose
- Socket.io (chat)
- HTML / CSS / JS (frontend)

Structure du projet
-------------------
server.js          -> serveur principal
models/Song.js     -> modele musique
models/Playlist.js -> modele playlist
models/Message.js  -> modele message
routes/songs.js    -> routes CRUD musiques
routes/playlists.js -> routes CRUD playlists
routes/messages.js -> route messages
public/            -> fichiers frontend (html, css, js)
.env               -> config (port, url mongodb)

Installation
------------
1. npm install
2. Creer un fichier .env avec :
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/an2lou
   (ou une URI MongoDB Atlas)
3. npm start
4. Ouvrir http://localhost:3000

Routes API
----------
GET    /api/songs            -> liste des musiques
POST   /api/songs            -> ajouter une musique
PUT    /api/songs/:id        -> modifier
PATCH  /api/songs/:id/favorite -> toggle favori
DELETE /api/songs/:id        -> supprimer

GET    /api/playlists        -> liste des playlists
POST   /api/playlists        -> creer
PUT    /api/playlists/:id    -> modifier
POST   /api/playlists/:id/songs -> ajouter un titre
DELETE /api/playlists/:id/songs/:songId -> retirer
DELETE /api/playlists/:id    -> supprimer

GET    /api/messages         -> historique du chat

Difficultes rencontrees
-----------------------
- Pour les pochettes on utilise des URLs d'images
  car on n'a pas implemente l'upload de fichiers.
- Les relations entre playlists et musiques avec
  populate() de Mongoose.
- La gestion du chat en temps reel avec Socket.io
  (connexions, deconnexions, indicateur de frappe).