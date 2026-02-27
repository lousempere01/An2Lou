const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// Recuperer toutes les musiques
router.get('/', async (req, res) => {
  try {
    const { search, sort, order, genre, favorite } = req.query;
    let filter = {};

    // Recherche
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
        { album: { $regex: search, $options: 'i' } }
      ];
    }

    // Genre
    if (genre) {
      filter.genre = genre;
    }

    // Favoris
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

// Recuperer une musique par ID
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

// Creer une musique
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

// Modifier une musique
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

// Toggle favori
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

// Supprimer une musique
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
