let currentUser = '';
let socket = null;
let typingTimeout = null;
let debounceTimeout = null;
let currentPlaylistId = null;
let allSongs = [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initUsernameModal();
  initAddSongForm();
  initAddPlaylistForm();
  initSearch();
  initEditSongModal();
  initCollapsibles();
  initPlaylistDetail();
  initAddToPlaylistModal();
  loadSongs();
  loadPlaylists();
});

function initNavigation() {
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.page-section').forEach(s => s.classList.remove('active'));
      $(`#${page}Page`).classList.add('active');
      if (page === 'playlists') loadPlaylists();
      if (page === 'songs') loadSongs();
    });
  });
}

function initCollapsibles() {
  ['toggleAddSong', 'toggleAddPlaylist'].forEach(id => {
    const header = $(`#${id}`);
    if (header) {
      header.addEventListener('click', () => {
        header.closest('.add-section').classList.toggle('open');
      });
    }
  });
}

function initUsernameModal() {
  const saved = localStorage.getItem('an2lou_username');
  if (saved) {
    currentUser = saved;
    $('#usernameModal').classList.add('hidden');
    initChat();
    return;
  }
  $('#usernameBtn').addEventListener('click', submitUsername);
  $('#usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitUsername();
  });
}

function submitUsername() {
  const name = $('#usernameInput').value.trim();
  if (!name) {
    showToast('Veuillez entrer un nom', 'error');
    return;
  }
  currentUser = name;
  localStorage.setItem('an2lou_username', name);
  $('#usernameModal').classList.add('hidden');
  initChat();
  showToast('Bienvenue ' + name, 'success');
}

// ---- Musiques ----

async function loadSongs() {
  const params = new URLSearchParams();
  const search = $('#searchInput')?.value?.trim();
  if (search) params.set('search', search);

  try {
    const res = await fetch(`/api/songs?${params.toString()}`);
    const songs = await res.json();
    allSongs = songs;
    updateCounters(songs);
    renderSongs(songs);
  } catch (err) {
    console.error('Erreur chargement musiques:', err);
    $('#songsList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de connexion</h3>
        <p>Impossible de charger les musiques.</p>
      </div>
    `;
  }
}

function updateCounters(songs) {
  const total = songs.length;
  const favs = songs.filter(s => s.favorite).length;
  const elTotal = $('#totalSongs');
  const elFavs = $('#totalFavorites');
  if (elTotal) elTotal.textContent = total;
  if (elFavs) elFavs.textContent = favs;
}

function renderSongs(songs) {
  const grid = $('#songsList');

  if (songs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-compact-disc"></i>
        <h3>Aucune musique</h3>
        <p>Ajoutez votre premier morceau !</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = songs.map(song => `
    <div class="song-card" data-id="${song._id}">
      <div class="song-cover">
        ${song.coverUrl
          ? `<img src="${escapeHtml(song.coverUrl)}" alt="${escapeHtml(song.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="cover-placeholder" ${song.coverUrl ? 'style="display:none"' : ''}>
          <i class="fas fa-music"></i>
        </div>
      </div>
      <div class="song-info">
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist)}</div>
        <div class="song-details">
          <span class="song-genre">${escapeHtml(song.genre)}</span>
          <div class="song-actions">
            <button class="btn btn-sm btn-ghost" onclick="openEditSongModal('${song._id}')" title="Modifier">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteSong('${song._id}')" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function initAddSongForm() {
  $('#addSongForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('#newSongTitle').value.trim();
    const artist = $('#newSongArtist').value.trim();
    if (!title || !artist) return;

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist,
          album: $('#newSongAlbum').value.trim() || 'Single',
          genre: $('#newSongGenre').value,
          coverUrl: $('#newSongCover').value.trim()
        })
      });

      if (res.ok) {
        $('#addSongForm').reset();
        loadSongs();
        showToast('Morceau ajouté !', 'success');
      } else {
        const data = await res.json();
        showToast(data.message || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    }
  });
}

async function deleteSong(id) {
  try {
    const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSongs();
      showToast('Morceau supprimé', 'info');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

function initSearch() {
  $('#searchInput').addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(loadSongs, 300);
  });
}

// ---- Édition musique ----

function initEditSongModal() {
  $('#cancelEditSongBtn').addEventListener('click', closeEditSongModal);
  $('#editSongModal').addEventListener('click', (e) => {
    if (e.target === $('#editSongModal')) closeEditSongModal();
  });

  $('#editSongForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#editSongId').value;

    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: $('#editSongTitle').value.trim(),
          artist: $('#editSongArtist').value.trim(),
          album: $('#editSongAlbum').value.trim(),
          genre: $('#editSongGenre').value,
          coverUrl: $('#editSongCover').value.trim()
        })
      });

      if (res.ok) {
        closeEditSongModal();
        loadSongs();
        showToast('Morceau modifié !', 'success');
      } else {
        const data = await res.json();
        showToast(data.message || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    }
  });
}

async function openEditSongModal(id) {
  try {
    const res = await fetch(`/api/songs/${id}`);
    const song = await res.json();
    $('#editSongId').value = song._id;
    $('#editSongTitle').value = song.title;
    $('#editSongArtist').value = song.artist;
    $('#editSongAlbum').value = song.album || '';
    $('#editSongGenre').value = song.genre;
    $('#editSongCover').value = song.coverUrl || '';
    $('#editSongModal').classList.add('active');
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

function closeEditSongModal() {
  $('#editSongModal').classList.remove('active');
}

// ---- Playlists ----

async function loadPlaylists() {
  try {
    const res = await fetch('/api/playlists');
    const playlists = await res.json();
    renderPlaylists(playlists);
  } catch (err) {
    console.error('Erreur chargement playlists:', err);
  }
}

function renderPlaylists(playlists) {
  const grid = $('#playlistsList');
  if (!grid) return;

  if (playlists.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-headphones-alt"></i>
        <h3>Aucune playlist</h3>
        <p>Créez votre première playlist !</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = playlists.map(pl => `
    <div class="playlist-card" onclick="openPlaylistDetail('${pl._id}')">
      <div class="playlist-cover">
        <div class="cover-placeholder">
          <i class="fas fa-music"></i>
        </div>
      </div>
      <div class="playlist-info">
        <div class="playlist-name">${escapeHtml(pl.name)}</div>
        <div class="playlist-desc">${escapeHtml(pl.description || '')}</div>
        <div class="playlist-meta">
          <span class="playlist-count">${pl.songs.length} titre${pl.songs.length !== 1 ? 's' : ''}</span>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deletePlaylist('${pl._id}')" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function initAddPlaylistForm() {
  $('#addPlaylistForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#newPlaylistName').value.trim();
    if (!name) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: $('#newPlaylistDesc').value.trim()
        })
      });

      if (res.ok) {
        $('#addPlaylistForm').reset();
        loadPlaylists();
        showToast('Playlist créée !', 'success');
      } else {
        const data = await res.json();
        showToast(data.message || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    }
  });
}

async function deletePlaylist(id) {
  try {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadPlaylists();
      showToast('Playlist supprimée', 'info');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

// ---- Détail playlist ----

function initPlaylistDetail() {
  $('#backToPlaylists').addEventListener('click', closePlaylistDetail);
}

async function openPlaylistDetail(id) {
  currentPlaylistId = id;
  try {
    const res = await fetch(`/api/playlists/${id}`);
    const playlist = await res.json();

    $('#playlistsList').classList.add('hidden');
    $$('#playlistsPage .add-section').forEach(s => s.classList.add('hidden'));
    $('#playlistDetail').classList.remove('hidden');

    $('#detailName').textContent = playlist.name;
    $('#detailDesc').textContent = playlist.description || '';
    $('#detailCount').textContent = `${playlist.songs.length} titre${playlist.songs.length !== 1 ? 's' : ''}`;
    $('#detailCover').innerHTML = '<i class="fas fa-music"></i>';

    renderPlaylistSongs(playlist.songs);
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

function closePlaylistDetail() {
  currentPlaylistId = null;
  $('#playlistDetail').classList.add('hidden');
  $('#playlistsList').classList.remove('hidden');
  $$('#playlistsPage .add-section').forEach(s => s.classList.remove('hidden'));
  loadPlaylists();
}

function renderPlaylistSongs(songs) {
  const list = $('#playlistSongsList');

  if (songs.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-plus-circle"></i>
        <h3>Playlist vide</h3>
        <p>Ajoutez des titres avec le bouton ci-dessus</p>
      </div>
    `;
    return;
  }

  list.innerHTML = songs.map((song, index) => `
    <div class="playlist-song-item">
      <span class="text-muted" style="width:20px;text-align:center;font-size:0.8rem">${index + 1}</span>
      <div class="playlist-song-info">
        <div class="playlist-song-title">${escapeHtml(song.title)}</div>
        <div class="playlist-song-artist">${escapeHtml(song.artist)}</div>
      </div>
      <button class="btn btn-sm btn-danger" onclick="removeSongFromPlaylist('${song._id}')" title="Retirer">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

async function removeSongFromPlaylist(songId) {
  if (!currentPlaylistId) return;
  try {
    const res = await fetch(`/api/playlists/${currentPlaylistId}/songs/${songId}`, { method: 'DELETE' });
    if (res.ok) {
      const playlist = await res.json();
      renderPlaylistSongs(playlist.songs);
      $('#detailCount').textContent = `${playlist.songs.length} titre${playlist.songs.length !== 1 ? 's' : ''}`;
      showToast('Titre retiré', 'info');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

// ---- Modal ajout à playlist ----

function initAddToPlaylistModal() {
  $('#addSongToPlaylistBtn').addEventListener('click', openAddToPlaylistModal);
  $('#closeAddToPlaylistBtn').addEventListener('click', closeAddToPlaylistModal);
  $('#addToPlaylistModal').addEventListener('click', (e) => {
    if (e.target === $('#addToPlaylistModal')) closeAddToPlaylistModal();
  });
  $('#playlistSearchInput').addEventListener('input', () => {
    const query = $('#playlistSearchInput').value.trim().toLowerCase();
    renderModalSongList(query);
  });
}

async function openAddToPlaylistModal() {
  if (!currentPlaylistId) return;
  try {
    const [songsRes, plRes] = await Promise.all([
      fetch('/api/songs'),
      fetch(`/api/playlists/${currentPlaylistId}`)
    ]);
    allSongs = await songsRes.json();
    const playlist = await plRes.json();
    const playlistSongIds = playlist.songs.map(s => s._id);

    $('#addToPlaylistModal').classList.add('active');
    $('#playlistSearchInput').value = '';
    renderModalSongList('', playlistSongIds);
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

function closeAddToPlaylistModal() {
  $('#addToPlaylistModal').classList.remove('active');
}

function renderModalSongList(query = '', existingIds = null) {
  const list = $('#modalSongList');
  let filtered = allSongs;

  if (query) {
    filtered = allSongs.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.artist.toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:1.5rem"><p>Aucun résultat</p></div>';
    return;
  }

  let addedIds = existingIds || [];

  list.innerHTML = filtered.map(song => {
    const isAdded = addedIds.includes(song._id);
    return `
      <div class="modal-song-item ${isAdded ? 'added' : ''}" data-id="${song._id}">
        <div class="modal-song-item-info">
          <div class="modal-song-item-title">${escapeHtml(song.title)}</div>
          <div class="modal-song-item-artist">${escapeHtml(song.artist)}</div>
        </div>
        ${isAdded
          ? '<span class="text-muted" style="font-size:0.75rem">Ajouté</span>'
          : `<button class="btn btn-sm btn-primary" onclick="addSongToPlaylist('${song._id}', this)"><i class="fas fa-plus"></i></button>`
        }
      </div>
    `;
  }).join('');
}

async function addSongToPlaylist(songId, btnEl) {
  if (!currentPlaylistId) return;
  try {
    const res = await fetch(`/api/playlists/${currentPlaylistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId })
    });

    if (res.ok) {
      const playlist = await res.json();
      renderPlaylistSongs(playlist.songs);
      $('#detailCount').textContent = `${playlist.songs.length} titre${playlist.songs.length !== 1 ? 's' : ''}`;
      const item = btnEl.closest('.modal-song-item');
      if (item) {
        item.classList.add('added');
        btnEl.outerHTML = '<span class="text-muted" style="font-size:0.75rem">Ajouté</span>';
      }
      showToast('Titre ajouté !', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || 'Erreur', 'error');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

// ---- Chat ----

function initChat() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('user:join', currentUser);
  });

  loadChatHistory();

  socket.on('chat:message', (msg) => {
    appendMessage(msg);
    scrollChatToBottom();
  });

  socket.on('chat:notification', (data) => {
    appendNotification(data.text);
  });

  socket.on('chat:typing', (username) => {
    if (username !== currentUser) {
      $('#typingIndicator').textContent = `${username} écrit...`;
    }
  });

  socket.on('chat:stop-typing', () => {
    $('#typingIndicator').textContent = '';
  });

  $('#sendMessageBtn').addEventListener('click', sendMessage);
  $('#chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  $('#chatInput').addEventListener('input', () => {
    socket.emit('chat:typing', currentUser);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('chat:stop-typing', currentUser);
    }, 1500);
  });
}

async function loadChatHistory() {
  try {
    const res = await fetch('/api/messages?limit=50');
    const messages = await res.json();
    messages.forEach(msg => appendMessage(msg));
    scrollChatToBottom();
  } catch (err) {
    console.error('Erreur historique chat:', err);
  }
}

function sendMessage() {
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text || !socket) return;
  socket.emit('chat:message', { username: currentUser, text });
  input.value = '';
  socket.emit('chat:stop-typing', currentUser);
}

function appendMessage(msg) {
  const container = $('#chatMessages');
  const isOwn = msg.username === currentUser;
  const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });

  const msgEl = document.createElement('div');
  msgEl.className = `message ${isOwn ? 'own' : ''}`;
  msgEl.innerHTML = `
    <div class="message-header">
      <span class="message-username">${escapeHtml(msg.username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-bubble">${escapeHtml(msg.text)}</div>
  `;
  container.appendChild(msgEl);
}

function appendNotification(text) {
  const container = $('#chatMessages');
  const notif = document.createElement('div');
  notif.className = 'chat-notification';
  notif.textContent = text;
  container.appendChild(notif);
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const container = $('#chatMessages');
  container.scrollTop = container.scrollHeight;
}

// ---- Utilitaires ----

function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-text">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
