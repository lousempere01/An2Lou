// ============================================================
// Projet An2Lou - Gestionnaire de tâches & Chat
// Auteurs : Lou Sempere
// Modèle Mongoose : Message (Chat)
// ============================================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  text: {
    type: String,
    required: [true, 'Le message ne peut pas être vide'],
    trim: true,
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
