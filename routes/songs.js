// ============================================================
// Projet An2Lou - Gestionnaire de Musiques & Chat
// Auteurs : Lou Sempere
// Routes API : Songs (CRUD)
// ============================================================

const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// GET /api/songs - Récupérer toutes les musiques (avec tri et recherche)
router.get('/', async (req, res) => {
  try {
    const { search, sort, order, genre, favorite } = req.query;
    let filter = {};

    // Recherche par titre ou artiste
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
        { album: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtre par genre
    if (genre) {
      filter.genre = genre;
    }

    // Filtre par favoris
    if (favorite !== undefined && favorite !== '') {
      filter.favorite = favorite === 'true';
    }

    // Tri
    let sortObj = { createdAt: -1 };
    if (sort) {
      const sortOrder = order === 'asc' ? 1 : -1;
      sortObj = { [sort]: sortOrder };
    }

    const songs = await Song.find(filter).sort(sortObj);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET /api/songs/:id - Récupérer une musique par son ID
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Musique non trouvée' });
    }
    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST /api/songs - Créer une nouvelle musique
router.post('/', async (req, res) => {
  try {
    const { title, artist, album, genre, coverUrl, duration, year } = req.body;
    const song = new Song({ title, artist, album, genre, coverUrl, duration, year });
    const savedSong = await song.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de validation', error: err.message });
  }
});

// PUT /api/songs/:id - Mettre à jour une musique
router.put('/:id', async (req, res) => {
  try {
    const { title, artist, album, genre, coverUrl, duration, year, favorite } = req.body;
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { title, artist, album, genre, coverUrl, duration, year, favorite },
      { new: true, runValidators: true }
    );
    if (!song) {
      return res.status(404).json({ message: 'Musique non trouvée' });
    }
    res.json(song);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de mise à jour', error: err.message });
  }
});

// PATCH /api/songs/:id/favorite - Basculer le statut favori
router.patch('/:id/favorite', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Musique non trouvée' });
    }
    song.favorite = !song.favorite;
    const savedSong = await song.save();
    res.json(savedSong);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// DELETE /api/songs/:id - Supprimer une musique
router.delete('/:id', async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Musique non trouvée' });
    }
    res.json({ message: 'Musique supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
