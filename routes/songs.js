const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// Recuperer toutes les musiques
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } }
      ];
    }

    const songs = await Song.find(filter).sort({ createdAt: -1 });
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
    const { title, artist, album, genre } = req.body;
    const song = new Song({ title, artist, album, genre });
    const savedSong = await song.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de validation', error: err.message });
  }
});

// Modifier une musique
router.put('/:id', async (req, res) => {
  try {
    const { title, artist, album, genre } = req.body;
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { title, artist, album, genre },
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
