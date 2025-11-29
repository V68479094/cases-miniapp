// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Конфигурация кейсов
const CASES = {
    farm: {
        name: '🌾 Фарм кейс',
        cost: 1,
        prizes: [
            { amount: 0.5, chance: 50 },
            { amount: 1, chance: 30 },
            { amount: 6, chance: 20 },
            { amount: 9, chance: 10 }
        ]
    },
    lucky: {
        name: '🍀 Счастливчик',
        cost: 5,
        prizes: [
            { amount: 3, chance: 50 },
            { amount: 5, chance: 40 },
            { amount: 10, chance: 30 },
            { amount: 15, chance: 20 }
        ]
    },
    confident: {
        name: '💪 Уверенный',
        cost: 10,
        prizes: [
            { amount: 7, chance: 50 },
            { amount: 10, chance: 30 },
            { amount: 15, chance: 20 },
            { amount: 30, chance: 10 }
        ]
    },
    risky: {
        name: '🔥 Рисковый',
        cost: 20,
        prizes: [
            { amount: 15, chance: 50 },
            { amount: 20, chance: 30 },
            { amount: 30, chance: 20 },
            { amount: 80, chance: 10 }
        ]
    },
    daily: {
        name: '🎁 Ежедневный',
        cost: 0,
        prizes: [
            { amount: 0, chance: 50 },
            { amount: 5, chance: 40 },
            { amount: 10, chance: 30 }
        ]
    }
};

// Состояние
let userBalance = 0;
let currentCase = null;
let isOpening = false;
let dailyCooldown = null;

// DOM элементы
const casesMenu = document.getElementById('cases-menu');
const caseOpenScreen = document.getElementById('case-open');
const balanceDisplay = document.getElementById('user-balance');
const caseCards = document.querySelectorAll('.case-card');
const openCaseBtn = document.getElementById('open-case-btn');
const backBtn = document.getElementById('back-btn');
const continueBtn = document.getElementById('continue-btn');
const againBtn = document.getElementById('again-btn');
const caseBox = document.querySelector('.case-box');
const prizeDisplay = document.getElementById('prize-display');
const resultContainer = document.getElementById('result-container');
const openBtnContainer = document.getElementById('open-btn-container');
const particles = document.getElementById('particles');

// Инициализация
function init() {
    // Получаем данные от бота
    const initData = tg.initDataUnsafe;
    
    // Пробуем получить баланс из start_param
    if (tg.initDataUnsafe.start_param) {
        try {
            const params = JSON.parse(atob(tg.initDataUnsafe.start_param));
            userBalance = params.balance || 0;
            dailyCooldown = params.daily_cooldown || null;
        } catch (e) {
            console.log('Error parsing start_param:', e);
        }
    }
    
    // Для тестирования - можно задать баланс вручную
    if (userBalance === 0) {
        userBalance = 100; // Тестовый баланс
    }
    
    updateBalanceDisplay();
    updateDailyTimer();
    
    // Обработчики кликов по кейсам
    caseCards.forEach(card => {
        card.addEventListener('click', () => selectCase(card.dataset.case));
    });
    
    // Кнопки
    openCaseBtn.addEventListener('click', openCase);
    backBtn.addEventListener('click', goBack);
    continueBtn.addEventListener('click', goBack);
    againBtn.addEventListener('click', () => openCase());
    
    // Применяем тему Telegram
    applyTelegramTheme();
}

function applyTelegramTheme() {
    if (tg.colorScheme === 'dark') {
        document.body.style.background = tg.themeParams.bg_color || '#0f0f1a';
    }
}

function updateBalanceDisplay() {
    balanceDisplay.textContent = `${userBalance.toFixed(2)} ⭐`;
}

function updateDailyTimer() {
    const timerEl = document.getElementById('daily-timer');
    const dailyCard = document.querySelector('.case-card.daily');
    
    if (dailyCooldown) {
        const now = Date.now();
        const remaining = dailyCooldown - now;
        
        if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timerEl.textContent = `⏰ Через ${hours}ч ${minutes}м`;
            dailyCard.style.opacity = '0.6';
            return;
        }
    }
    
    timerEl.textContent = '✅ Доступен';
    dailyCard.style.opacity = '1';
}

function selectCase(caseType) {
    if (!CASES[caseType]) return;
    
    currentCase = caseType;
    const caseData = CASES[caseType];
    
    // Проверяем доступность
    if (caseType === 'daily' && dailyCooldown && dailyCooldown > Date.now()) {
        tg.showAlert('Ежедневный кейс будет доступен позже!');
        return;
    }
    
    if (caseType !== 'daily' && userBalance < caseData.cost) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    // Обновляем кнопку
    const btnPrice = openCaseBtn.querySelector('.btn-price');
    btnPrice.textContent = caseType === 'daily' ? 'Бесплатно' : `${caseData.cost} ⭐`;
    
    // Показываем экран открытия
    showScreen('case-open');
    resetCaseAnimation();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goBack() {
    showScreen('cases-menu');
    resetCaseAnimation();
}

function resetCaseAnimation() {
    caseBox.classList.remove('opening', 'shaking');
    prizeDisplay.classList.remove('show');
    resultContainer.classList.add('hidden');
    openBtnContainer.style.display = 'block';
    particles.innerHTML = '';
    isOpening = false;
}

function getRandomPrize(caseType) {
    const prizes = CASES[caseType].prizes;
    const sortedPrizes = [...prizes].sort((a, b) => a.chance - b.chance);
    const roll = Math.random() * 100;
    
    for (const prize of sortedPrizes) {
        if (roll <= prize.chance) {
            return prize.amount;
        }
    }
    
    return prizes[0].amount;
}

async function openCase() {
    if (isOpening || !currentCase) return;
    
    const caseData = CASES[currentCase];
    
    // Проверяем баланс
    if (currentCase !== 'daily' && userBalance < caseData.cost) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    // Проверяем cooldown для ежедневного
    if (currentCase === 'daily' && dailyCooldown && dailyCooldown > Date.now()) {
        tg.showAlert('Ежедневный кейс будет доступен позже!');
        return;
    }
    
    isOpening = true;
    openCaseBtn.disabled = true;
    
    // Списываем стоимость
    if (currentCase !== 'daily') {
        userBalance -= caseData.cost;
        updateBalanceDisplay();
    } else {
        // Устанавливаем cooldown на 24 часа
        dailyCooldown = Date.now() + (24 * 60 * 60 * 1000);
    }
    
    // Анимация тряски
    caseBox.classList.add('shaking');
    
    // Определяем приз
    const prize = getRandomPrize(currentCase);
    
    // Ждём и открываем
    await sleep(1500);
    
    caseBox.classList.remove('shaking');
    caseBox.classList.add('opening');
    
    // Скрываем кнопку открытия
    openBtnContainer.style.display = 'none';
    
    // Ждём открытия крышки
    await sleep(800);
    
    // Создаём частицы
    createParticles(prize > 0);
    
    // Показываем приз
    const prizeAmount = prizeDisplay.querySelector('.prize-amount');
    prizeAmount.textContent = prize > 0 ? `+${prize}` : '0';
    prizeDisplay.classList.add('show');
    
    // Начисляем приз
    if (prize > 0) {
        userBalance += prize;
        updateBalanceDisplay();
    }
    
    // Показываем результат
    await sleep(1500);
    
    const resultText = resultContainer.querySelector('.result-text');
    if (prize > 0) {
        resultText.innerHTML = `🎉 Поздравляем! Вы выиграли <b>${prize} ⭐</b>`;
    } else {
        resultText.innerHTML = '😔 В этот раз не повезло...';
    }
    
    resultContainer.classList.remove('hidden');
    
    // Проверяем можно ли открыть ещё
    const canOpenAgain = currentCase === 'daily' ? false : userBalance >= caseData.cost;
    againBtn.style.display = canOpenAgain ? 'block' : 'none';
    
    isOpening = false;
    openCaseBtn.disabled = false;
    
    // Отправляем результат боту
    sendResultToBot(currentCase, prize);
}

function createParticles(isWin) {
    const colors = isWin 
        ? ['#ffd700', '#ffec8b', '#ff6b6b', '#e94560', '#00ff88'] 
        : ['#555', '#666', '#777'];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = '50%';
        particle.style.top = '40%';
        
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const distance = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        particles.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

function sendResultToBot(caseType, prize) {
    // Отправляем данные боту
    const data = {
        action: 'case_opened',
        case_type: caseType,
        prize: prize,
        new_balance: userBalance
    };
    
    tg.sendData(JSON.stringify(data));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Запуск
init();

