// ============================================================
// Projet An2Lou - Gestionnaire de Musiques & Chat
// Auteurs : Lou Sempere
// Modèle Mongoose : Playlist
// ============================================================

const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la playlist est obligatoire'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  coverUrl: {
    type: String,
    trim: true,
    default: ''
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Playlist', playlistSchema);
