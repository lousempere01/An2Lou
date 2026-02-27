const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Derniers messages
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
