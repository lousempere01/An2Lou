let currentUser = '';
let socket = null;
let typingTimeout = null;
let debounceTimeout = null;
let currentPlaylistId = null;
let allSongs = [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- Initialisation ----
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initUsernameModal();
  initAddSongForm();
  initAddPlaylistForm();
  initSongControls();
  initEditSongModal();
  initCollapsibles();
  initCoverPreview();
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

function initCoverPreview() {
  const coverInput = $('#newSongCover');
  const preview = $('#coverPreview');
  if (coverInput && preview) {
    coverInput.addEventListener('input', () => {
      const url = coverInput.value.trim();
      if (url) {
        preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i><span>URL invalide</span>';this.parentElement.classList.remove('has-image');">`;
        preview.classList.add('has-image');
      } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>Aperçu pochette</span>';
        preview.classList.remove('has-image');
      }
    });
  }
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

async function loadSongs() {
  const params = new URLSearchParams();

  const search = $('#searchInput')?.value?.trim();
  if (search) params.set('search', search);

  const genre = $('#filterGenre')?.value;
  if (genre) params.set('genre', genre);

  const favorite = $('#filterFavorite')?.value;
  if (favorite) params.set('favorite', favorite);

  const sortVal = $('#sortSelect')?.value;
  if (sortVal) {
    const [sort, order] = sortVal.split('-');
    params.set('sort', sort);
    params.set('order', order);
  }

  try {
    const res = await fetch(`/api/songs?${params.toString()}`);
    const songs = await res.json();
    allSongs = songs;
    renderSongs(songs);
    updateStats(songs);
  } catch (err) {
    console.error('Erreur chargement musiques:', err);
    $('#songsList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de connexion</h3>
        <p>Impossible de charger la bibliothèque. Vérifiez le serveur.</p>
      </div>
    `;
  }
}

function renderSongs(songs) {
  const grid = $('#songsList');

  if (songs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-compact-disc"></i>
        <h3>Aucune musique</h3>
        <p>Ajoutez votre premier morceau pour commencer votre collection !</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = songs.map(song => `
    <div class="song-card" data-id="${song._id}">
      <button class="song-favorite ${song.favorite ? 'active' : ''}" onclick="toggleFavorite('${song._id}')" title="Favori">
        <i class="fas fa-heart"></i>
      </button>
      <div class="song-cover">
        ${song.coverUrl
          ? `<img src="${escapeHtml(song.coverUrl)}" alt="${escapeHtml(song.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="cover-placeholder" ${song.coverUrl ? 'style="display:none"' : ''}>
          <i class="fas fa-music"></i>
        </div>
        <div class="song-cover-overlay">
          <div class="song-cover-actions">
            <button class="btn btn-primary" onclick="openEditSongModal('${song._id}')" title="Modifier">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-danger" onclick="deleteSong('${song._id}')" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="song-info">
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist)}</div>
        <div class="song-details">
          <span class="song-genre">${escapeHtml(song.genre)}</span>
          <span>${song.duration || ''} ${song.year ? '· ' + song.year : ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function updateStats(songs) {
  const total = songs.length;
  const artists = new Set(songs.map(s => s.artist)).size;
  const favorites = songs.filter(s => s.favorite).length;

  animateNumber($('#totalSongs'), total);
  animateNumber($('#totalArtists'), artists);
  animateNumber($('#totalFavorites'), favorites);
}

function animateNumber(el, target) {
  if (el) el.textContent = target;
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
          coverUrl: $('#newSongCover').value.trim(),
          duration: $('#newSongDuration').value.trim(),
          year: parseInt($('#newSongYear').value) || new Date().getFullYear()
        })
      });

      if (res.ok) {
        $('#addSongForm').reset();
        $('#coverPreview').innerHTML = '<i class="fas fa-image"></i><span>Aperçu pochette</span>';
        $('#coverPreview').classList.remove('has-image');
        loadSongs();
        showToast('Morceau ajouté !', 'success');
      } else {
        const data = await res.json();
        showToast(data.message || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    }
  });
}

async function toggleFavorite(id) {
  try {
    const res = await fetch(`/api/songs/${id}/favorite`, { method: 'PATCH' });
    if (res.ok) {
      const song = await res.json();
      loadSongs();
      showToast(song.favorite ? 'Ajouté aux favoris' : 'Retiré des favoris', song.favorite ? 'success' : 'info');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

async function deleteSong(id) {
  try {
    const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSongs();
      showToast('Morceau supprimé', 'info');
    }
  } catch (err) {
    showToast('Erreur lors de la suppression', 'error');
    loadSongs();
  }
}

function initSongControls() {
  $('#searchInput').addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(loadSongs, 300);
  });
  $('#filterGenre').addEventListener('change', loadSongs);
  $('#filterFavorite').addEventListener('change', loadSongs);
  $('#sortSelect').addEventListener('change', loadSongs);
}

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
          coverUrl: $('#editSongCover').value.trim(),
          duration: $('#editSongDuration').value.trim(),
          year: parseInt($('#editSongYear').value) || new Date().getFullYear()
        })
      });

      if (res.ok) {
        closeEditSongModal();
        loadSongs();
        showToast('Morceau modifié !', 'success');
      } else {
        const data = await res.json();
        showToast(data.message || 'Erreur lors de la modification', 'error');
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
    $('#editSongDuration').value = song.duration || '';
    $('#editSongYear').value = song.year || '';

    $('#editSongModal').classList.add('active');
  } catch (err) {
    showToast('Erreur lors du chargement', 'error');
  }
}

function closeEditSongModal() {
  $('#editSongModal').classList.remove('active');
}

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
        <p>Créez votre première playlist ci-dessus !</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = playlists.map(pl => {
    const coverSrc = pl.coverUrl || (pl.songs.length > 0 && pl.songs[0].coverUrl) || '';
    return `
      <div class="playlist-card" onclick="openPlaylistDetail('${pl._id}')">
        <div class="playlist-cover">
          ${coverSrc
            ? `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(pl.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : ''}
          <div class="cover-placeholder" ${coverSrc ? 'style="display:none"' : ''}>
            <i class="fas fa-music"></i>
          </div>
        </div>
        <div class="playlist-info">
          <div class="playlist-name">${escapeHtml(pl.name)}</div>
          <div class="playlist-desc">${escapeHtml(pl.description || '')}</div>
          <div class="playlist-meta">
            <span class="playlist-count">${pl.songs.length} titre${pl.songs.length !== 1 ? 's' : ''}</span>
            <div class="playlist-actions">
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deletePlaylist('${pl._id}')" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
          description: $('#newPlaylistDesc').value.trim(),
          coverUrl: $('#newPlaylistCover').value.trim()
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

function initPlaylistDetail() {
  $('#backToPlaylists').addEventListener('click', closePlaylistDetail);
}

async function openPlaylistDetail(id) {
  currentPlaylistId = id;
  try {
    const res = await fetch(`/api/playlists/${id}`);
    const playlist = await res.json();

    // Afficher la vue détail, masquer la grille et le formulaire
    $('#playlistsList').classList.add('hidden');
    $$('#playlistsPage .add-section').forEach(s => s.classList.add('hidden'));
    $('#playlistDetail').classList.remove('hidden');

    // Remplir les infos
    $('#detailName').textContent = playlist.name;
    $('#detailDesc').textContent = playlist.description || '';
    $('#detailCount').textContent = `${playlist.songs.length} titre${playlist.songs.length !== 1 ? 's' : ''}`;

    const detailCover = $('#detailCover');
    const coverSrc = playlist.coverUrl || (playlist.songs.length > 0 && playlist.songs[0].coverUrl) || '';
    if (coverSrc) {
      detailCover.innerHTML = `<img src="${escapeHtml(coverSrc)}" onerror="this.outerHTML='<i class=\\'fas fa-music\\'></i>'">`;
    } else {
      detailCover.innerHTML = '<i class="fas fa-music"></i>';
    }

    renderPlaylistSongs(playlist.songs);
  } catch (err) {
    showToast('Erreur lors du chargement', 'error');
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
      <div class="playlist-song-cover">
        ${song.coverUrl
          ? `<img src="${escapeHtml(song.coverUrl)}" onerror="this.outerHTML='<i class=\\'fas fa-music\\'></i>'">`
          : '<i class="fas fa-music"></i>'}
      </div>
      <div class="playlist-song-info">
        <div class="playlist-song-title">${escapeHtml(song.title)}</div>
        <div class="playlist-song-artist">${escapeHtml(song.artist)} ${song.album ? '· ' + escapeHtml(song.album) : ''}</div>
      </div>
      <span class="playlist-song-duration">${song.duration || ''}</span>
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
      showToast('Titre retiré de la playlist', 'info');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

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

  // Charger toutes les musiques et la playlist courante
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

  // Déterminer les IDs déjà dans la playlist
  let addedIds = existingIds;
  if (!addedIds) {
    addedIds = [];
    $$('.modal-song-item.added').forEach(el => {
      addedIds.push(el.dataset.id);
    });
  }

  list.innerHTML = filtered.map(song => {
    const isAdded = addedIds && addedIds.includes(song._id);
    return `
      <div class="modal-song-item ${isAdded ? 'added' : ''}" data-id="${song._id}">
        <div class="mini-cover">
          ${song.coverUrl
            ? `<img src="${escapeHtml(song.coverUrl)}" onerror="this.outerHTML='<i class=\\'fas fa-music\\'></i>'">`
            : '<i class="fas fa-music"></i>'}
        </div>
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

      // Marquer comme ajouté dans le modal
      const item = btnEl.closest('.modal-song-item');
      if (item) {
        item.classList.add('added');
        btnEl.outerHTML = '<span class="text-muted" style="font-size:0.75rem">Ajouté</span>';
      }
      showToast('Titre ajouté à la playlist !', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || 'Erreur', 'error');
    }
  } catch (err) {
    showToast('Erreur', 'error');
  }
}

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

  socket.on('users:online', (users) => {
    renderOnlineUsers(users);
    $('#onlineCount').textContent = `${users.length} en ligne`;
  });

  socket.on('chat:typing', (username) => {
    if (username !== currentUser) {
      $('#typingIndicator').textContent = `${username} est en train d'écrire...`;
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

function renderOnlineUsers(users) {
  const container = $('#onlineUsers');
  container.innerHTML = users.map(u => `
    <div class="online-user">
      <div class="status-dot"></div>
      <span>${escapeHtml(u)}</span>
    </div>
  `).join('');
}

function scrollChatToBottom() {
  const container = $('#chatMessages');
  container.scrollTop = container.scrollHeight;
}

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
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}