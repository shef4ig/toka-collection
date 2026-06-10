// Telegram Mini App SDK
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Get user_id from URL params or Telegram
function getUserId() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('user_id')) return params.get('user_id');
    if (tg?.initDataUnsafe?.user?.id) return tg.initDataUnsafe.user.id;
    return 'demo_user';
}

const USER_ID = getUserId();

// Album data (mirrors bot config)
const SERIES_DATA = {
    summer_2024: {
        name: "Лето 2024",
        albums: {
            heroes: {
                name: "Любимые герои",
                description: "Леди Баг, Супер-Кот и милые питомцы",
                character: "Леди Баг",
                emoji: "🐞",
                wb_link: "https://www.wildberries.ru/catalog/YOUR_ID_1",
                ozon_link: "https://www.ozon.ru/product/YOUR_ID_1",
            },
            houses: {
                name: "2 Домика",
                description: "Классический домик + стиль Kuromi",
                character: "Куроми",
                emoji: "🏠",
                wb_link: "https://www.wildberries.ru/catalog/YOUR_ID_2",
                ozon_link: "https://www.ozon.ru/product/YOUR_ID_2",
            },
            korean: {
                name: "По-корейски",
                description: "Кафе, питомцы и городские локации",
                character: "Кореяночка",
                emoji: "🇰🇷",
                wb_link: "https://www.wildberries.ru/catalog/YOUR_ID_3",
                ozon_link: "https://www.ozon.ru/product/YOUR_ID_3",
            },
            zoo: {
                name: "ZOOпарк",
                description: "Животные и друзья в зоопарке",
                character: "Зайчик",
                emoji: "🐰",
                wb_link: "https://www.wildberries.ru/catalog/YOUR_ID_4",
                ozon_link: "https://www.ozon.ru/product/YOUR_ID_4",
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
    collected: [],
    total: 0,
    claimed_rewards: []
};

// ===== LOCAL STORAGE (for demo without backend) =====
function loadCollection() {
    const saved = localStorage.getItem(`collection_${USER_ID}`);
    if (saved) {
        userCollection = JSON.parse(saved);
    }
    renderAll();
}

function saveCollection() {
    localStorage.setItem(`collection_${USER_ID}`, JSON.stringify(userCollection));
}

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
            <div class="album-card ${statusClass}" data-album="${albumId}">
                <div class="album-status"></div>
                <span class="album-emoji">${album.emoji}</span>
                <div class="album-name">${album.name}</div>
                <div class="album-character">${isCollected ? album.character : '???'}</div>
                ${!isCollected ? `<button class="want-btn" onclick="wantAlbum('${albumId}')">Хочу!</button>` : ''}
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

    if (missing.length === 0 || missing.length === 4) {
        section.style.display = missing.length === 4 ? 'block' : 'none';
    } else {
        section.style.display = 'block';
    }

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

// ===== ACTIONS =====
function wantAlbum(albumId) {
    const series = SERIES_DATA.summer_2024;
    const album = series.albums[albumId];

    // Send data to Telegram bot
    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'want',
            album_id: albumId,
            album_name: album.name
        }));
    }

    // Show links
    const msg = `Хочешь «${album.name}»?\n\nКупить на:\n• Wildberries\n• Ozon`;
    if (confirm(msg + '\n\nОткрыть Wildberries?')) {
        window.open(album.wb_link, '_blank');
    }
}

function submitCode() {
    const input = document.getElementById('codeInput');
    const result = document.getElementById('codeResult');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showResult('Введи код!', 'error');
        return;
    }

    // For demo: parse code prefix to determine album
    const prefixMap = {
        'HERO': 'heroes',
        'HOME': 'houses',
        'KORE': 'korean',
        'ZOO': 'zoo',
    };

    const prefix = code.split('-')[0];
    const albumId = prefixMap[prefix];

    if (!albumId) {
        showResult('❌ Код не найден. Проверь правильность!', 'error');
        return;
    }

    if (userCollection.collected.includes(albumId)) {
        showResult('✅ Этот альбом уже в коллекции!', 'error');
        return;
    }

    // Activate!
    userCollection.collected.push(albumId);
    userCollection.total = userCollection.collected.length;

    // Check rewards
    if (REWARDS_DATA[userCollection.total] && !userCollection.claimed_rewards.includes(userCollection.total)) {
        userCollection.claimed_rewards.push(userCollection.total);
    }

    saveCollection();
    renderAll();

    const album = SERIES_DATA.summer_2024.albums[albumId];
    showResult(`🎉 «${album.name}» добавлен! Собрано: ${userCollection.total}/4`, 'success');

    // Confetti!
    showConfetti();

    // Clear input
    input.value = '';

    // Notify bot
    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'activate',
            code: code,
            album_id: albumId,
            total: userCollection.total
        }));
    }
}

function showResult(text, type) {
    const result = document.getElementById('codeResult');
    result.textContent = text;
    result.className = `code-result ${type}`;
    result.style.display = 'block';

    setTimeout(() => {
        result.style.display = 'none';
    }, 4000);
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
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 4000);
}

// Handle Enter key on code input
document.getElementById('codeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') submitCode();
});

// Initialize
loadCollection();
