
const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  artist: {
    type: String,
    required: [true, 'L\'artiste est obligatoire'],
    trim: true,
    maxlength: [100, 'L\'artiste ne peut pas dépasser 100 caractères']
  },
  album: {
    type: String,
    trim: true,
    default: 'Single'
  },
  genre: {
    type: String,
    enum: ['Pop', 'Rock', 'Hip-Hop', 'Rap', 'Électro', 'Autre'],
    default: 'Pop'
  },
  coverUrl: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: String,
    trim: true,
    default: '0:00'
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  favorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Song', songSchema);
