const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');

// Toutes les playlists
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    const playlists = await Playlist.find(filter)
      .populate('songs')
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Playlist par ID
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('songs');
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Creer une playlist
router.post('/', async (req, res) => {
  try {
    const { name, description, coverUrl } = req.body;
    const playlist = new Playlist({ name, description, coverUrl });
    const saved = await playlist.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de validation', error: err.message });
  }
});

// Modifier une playlist
router.put('/:id', async (req, res) => {
  try {
    const { name, description, coverUrl } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { name, description, coverUrl },
      { new: true, runValidators: true }
    ).populate('songs');
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de mise à jour', error: err.message });
  }
});

// Ajouter une musique a la playlist
router.post('/:id/songs', async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    // Pas de doublons
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Cette musique est déjà dans la playlist' });
    }
    playlist.songs.push(songId);
    await playlist.save();
    const populated = await playlist.populate('songs');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Retirer une musique
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    playlist.songs = playlist.songs.filter(s => s.toString() !== req.params.songId);
    await playlist.save();
    const populated = await playlist.populate('songs');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Supprimer une playlist
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist non trouvée' });
    }
    res.json({ message: 'Playlist supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
