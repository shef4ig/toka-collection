// Telegram Mini App SDK
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Base URL for images (GitHub Pages)
const IMG_BASE = 'https://shef4ig.github.io/toka-collection/images/';

// Get params from URL (bot passes collection data in URL)
function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        user_id: params.get('user_id') || 'demo',
        collected: params.get('collected') ? params.get('collected').split(',').filter(Boolean) : [],
        rewards: params.get('rewards') ? params.get('rewards').split(',').filter(Boolean).map(Number) : [],
    };
}

const PARAMS = getParams();

// Album data
const SERIES_DATA = {
    summer_2024: {
        name: "Лето 2024",
        albums: {
            heroes: {
                name: "Любимые герои",
                description: "Леди Баг, Супер-Кот и милые питомцы",
                character: "Леди Баг",
                emoji: "🐞",
                image: IMG_BASE + "heroes.png",
                wb_link: "https://www.wildberries.ru/catalog/258352794/detail.aspx",
            },
            houses: {
                name: "2 Домика",
                description: "Классический домик + стиль Kuromi",
                character: "Куроми",
                emoji: "🏠",
                image: IMG_BASE + "houses.png",
                wb_link: "https://www.wildberries.ru/catalog/574615366/detail.aspx",
            },
            korean: {
                name: "По-корейски",
                description: "Кафе, питомцы и городские локации",
                character: "Кореяночка",
                emoji: "🇰🇷",
                image: IMG_BASE + "korean.png",
                wb_link: "https://www.wildberries.ru/catalog/207063688/detail.aspx",
            },
            zoo: {
                name: "ZOOпарк",
                description: "Животные и друзья в зоопарке",
                character: "Зайчик",
                emoji: "🐰",
                image: IMG_BASE + "zoo.png",
                wb_link: "https://www.wildberries.ru/catalog/619104116/detail.aspx",
            },
        }
    }
};

const REWARDS_DATA = {
    1: { icon: "⭐", name: "Стикер-бонус", description: "Бонусный персонаж!" },
    2: { icon: "🐾", name: "Секретный питомец", description: "Открой секретного питомца!" },
    3: { icon: "🏡", name: "Тайная комната", description: "Эксклюзивная комната!" },
    4: { icon: "👑", name: "Суперколлекция", description: "Мега-бонус за полную коллекцию!" },
};

// State
let userCollection = {
    collected: PARAMS.collected,
    total: PARAMS.collected.length,
    claimed_rewards: PARAMS.rewards
};

// ===== RENDERING =====
function renderAll() {
    renderGrid();
    renderProgress();
    renderRewards();
    renderMissing();
}

function renderGrid() {
    const grid = document.getElementById('collectionGrid');
    const series = SERIES_DATA.summer_2024;
    let html = '';

    for (const [albumId, album] of Object.entries(series.albums)) {
        const isCollected = userCollection.collected.includes(albumId);
        const statusClass = isCollected ? 'collected' : 'locked';

        html += `
            <div class="album-card ${statusClass}" data-album="${albumId}" onclick="${isCollected ? `animateCard(this, '${albumId}')` : `wantAlbum('${albumId}')`}">
                <div class="album-status"></div>
                <div class="album-image-wrapper">
                    <img class="album-image" src="${album.image}" alt="${album.name}" 
                         style="${!isCollected ? 'filter: grayscale(1) brightness(0.4); opacity: 0.5;' : ''}">
                    ${!isCollected ? '<div class="lock-overlay">🔒</div>' : ''}
                </div>
                <div class="album-name">${album.name}</div>
                <div class="album-character">${isCollected ? '⭐ ' + album.character : '???'}</div>
                ${!isCollected ? `<button class="want-btn">Хочу! 💝</button>` : '<div class="tap-hint">Нажми! ✨</div>'}
            </div>
        `;
    }

    grid.innerHTML = html;
}

function renderProgress() {
    const total = userCollection.total;
    const percent = (total / 4) * 100;
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = `${total}/4`;
}

function renderRewards() {
    const list = document.getElementById('rewardsList');
    let html = '';

    for (const [threshold, reward] of Object.entries(REWARDS_DATA)) {
        const t = parseInt(threshold);
        let statusClass, badgeText, badgeClass;

        if (userCollection.claimed_rewards.includes(t)) {
            statusClass = 'unlocked';
            badgeText = 'Получено!';
            badgeClass = 'done';
        } else if (userCollection.total >= t) {
            statusClass = 'unlocked';
            badgeText = 'Забрать!';
            badgeClass = 'available';
        } else {
            statusClass = 'locked';
            badgeText = `${t} альб.`;
            badgeClass = 'locked';
        }

        html += `
            <div class="reward-item ${statusClass}">
                <span class="reward-icon">${reward.icon}</span>
                <div class="reward-info">
                    <div class="reward-name">${reward.name}</div>
                    <div class="reward-desc">${reward.description}</div>
                </div>
                <span class="reward-badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
    }

    list.innerHTML = html;
}

function renderMissing() {
    const series = SERIES_DATA.summer_2024;
    const missing = Object.entries(series.albums).filter(([id]) => !userCollection.collected.includes(id));

    const section = document.getElementById('wantSection');
    const list = document.getElementById('missingList');

    if (missing.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    let html = '';
    for (const [albumId, album] of missing) {
        html += `
            <div class="missing-item">
                <div class="missing-info">
                    <span class="missing-emoji">${album.emoji}</span>
                    <span class="missing-name">${album.name}</span>
                </div>
                <button class="missing-btn" onclick="wantAlbum('${albumId}')">Хочу! 💝</button>
            </div>
        `;
    }
    list.innerHTML = html;
}

// ===== ANIMATIONS =====
function animateCard(card, albumId) {
    // Don't animate if already animating
    if (card.classList.contains('animating')) return;
    
    card.classList.add('animating');
    
    // Vibrate if available
    if (navigator.vibrate) navigator.vibrate(50);
    
    // Spawn particles around the card
    spawnParticles(card);
    
    // Remove animation class after it completes
    setTimeout(() => {
        card.classList.remove('animating');
    }, 1000);
}

function spawnParticles(card) {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const emojis = ['⭐', '✨', '💫', '🌟', '💖', '🎉', '🦋', '🌈'];
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        
        // Random direction
        const angle = (i / 8) * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

// ===== ACTIONS =====
function wantAlbum(albumId) {
    const series = SERIES_DATA.summer_2024;
    const album = series.albums[albumId];

    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'want',
            album_id: albumId,
            album_name: album.name
        }));
        tg.showAlert(`Ссылка на покупку «${album.name}» отправлена в чат! 🛒`);
    } else {
        alert(`Хочу «${album.name}»!\n\nWB: ${album.wb_link}\nOzon: ${album.ozon_link}`);
    }
}

function submitCode() {
    const input = document.getElementById('codeInput');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showResult('Введи код!', 'error');
        return;
    }

    if (tg) {
        tg.showAlert('Введи код прямо в чат бота — он добавит альбом в коллекцию! Потом открой коллекцию снова.');
        tg.close();
        return;
    }

    // Demo mode
    const prefixMap = { 'HERO': 'heroes', 'HOME': 'houses', 'KORE': 'korean', 'ZOO': 'zoo' };
    const prefix = code.split('-')[0];
    const albumId = prefixMap[prefix];

    if (!albumId) { showResult('❌ Код не найден!', 'error'); return; }
    if (userCollection.collected.includes(albumId)) { showResult('✅ Уже в коллекции!', 'error'); return; }

    userCollection.collected.push(albumId);
    userCollection.total = userCollection.collected.length;
    if (REWARDS_DATA[userCollection.total]) userCollection.claimed_rewards.push(userCollection.total);

    renderAll();
    showResult(`🎉 «${SERIES_DATA.summer_2024.albums[albumId].name}» добавлен! (${userCollection.total}/4)`, 'success');
    showConfetti();
    input.value = '';
}

function showResult(text, type) {
    const result = document.getElementById('codeResult');
    result.textContent = text;
    result.className = `code-result ${type}`;
    result.style.display = 'block';
    setTimeout(() => { result.style.display = 'none'; }, 4000);
}

function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti';
    document.body.appendChild(container);
    const colors = ['#6c5ce7', '#e17e55', '#27ae60', '#f39c12', '#e74c3c', '#3498db', '#ff69b4'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
}

// Handle Enter key
document.getElementById('codeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') submitCode();
});

// Initialize
renderAll();
