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

// DOM элементы (инициализируются после загрузки)
let casesMenu, caseOpenScreen, balanceDisplay, caseCards;
let openCaseBtn, backBtn, continueBtn, againBtn;
let caseBox, prizeDisplay, resultContainer, openBtnContainer, particles;

// Ждём загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Инициализация
function init() {
    // Получаем DOM элементы
    casesMenu = document.getElementById('cases-menu');
    caseOpenScreen = document.getElementById('case-open');
    balanceDisplay = document.getElementById('user-balance');
    caseCards = document.querySelectorAll('.case-card');
    openCaseBtn = document.getElementById('open-case-btn');
    backBtn = document.getElementById('back-btn');
    continueBtn = document.getElementById('continue-btn');
    againBtn = document.getElementById('again-btn');
    caseBox = document.querySelector('.case-box');
    prizeDisplay = document.getElementById('prize-display');
    resultContainer = document.getElementById('result-container');
    openBtnContainer = document.getElementById('open-btn-container');
    particles = document.getElementById('particles');
    
    // Получаем данные от бота
    try {
        // Пробуем получить баланс из URL параметров
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('start_param');
        
        if (startParam) {
            const params = JSON.parse(atob(startParam));
            userBalance = params.balance || 0;
            dailyCooldown = params.daily_cooldown || null;
        }
        
        // Или из Telegram initData
        if (tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
            const params = JSON.parse(atob(tg.initDataUnsafe.start_param));
            userBalance = params.balance || 0;
            dailyCooldown = params.daily_cooldown || null;
        }
    } catch (e) {
        console.log('Error parsing params:', e);
    }
    
    // Для тестирования - если баланс 0, ставим тестовый
    if (userBalance === 0) {
        userBalance = 100;
    }
    
    updateBalanceDisplay();
    updateDailyTimer();
    
    // Обработчики кликов по кейсам (click + touchend для мобильных)
    caseCards.forEach(card => {
        const handler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectCase(card.dataset.case);
        };
        card.addEventListener('click', handler);
        card.addEventListener('touchend', handler);
    });
    
    // Кнопки
    if (openCaseBtn) {
        openCaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCase();
        });
        openCaseBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            openCase();
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
        backBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            goBack();
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
        continueBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            goBack();
        });
    }
    
    if (againBtn) {
        againBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetCaseAnimation();
            openCase();
        });
        againBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            resetCaseAnimation();
            openCase();
        });
    }
    
    // Применяем тему Telegram
    applyTelegramTheme();
    
    console.log('Cases Mini App initialized!');
}

function applyTelegramTheme() {
    if (tg.colorScheme === 'dark') {
        document.body.style.background = tg.themeParams.bg_color || '#0f0f1a';
    }
}

function updateBalanceDisplay() {
    if (balanceDisplay) {
        balanceDisplay.textContent = userBalance.toFixed(2) + ' ⭐';
    }
}

function updateDailyTimer() {
    const timerEl = document.getElementById('daily-timer');
    const dailyCard = document.querySelector('.case-card.daily');
    
    if (!timerEl || !dailyCard) return;
    
    if (dailyCooldown) {
        const now = Date.now();
        const remaining = dailyCooldown - now;
        
        if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timerEl.textContent = '⏰ Через ' + hours + 'ч ' + minutes + 'м';
            dailyCard.style.opacity = '0.6';
            return;
        }
    }
    
    timerEl.textContent = '✅ Доступен';
    dailyCard.style.opacity = '1';
}

function selectCase(caseType) {
    console.log('Selecting case:', caseType);
    
    if (!CASES[caseType]) {
        console.log('Case not found:', caseType);
        return;
    }
    
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
    if (btnPrice) {
        btnPrice.textContent = caseType === 'daily' ? 'Бесплатно' : caseData.cost + ' ⭐';
    }
    
    // Показываем экран открытия
    showScreen('case-open');
    resetCaseAnimation();
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        screen.style.display = screenId === 'case-open' ? 'flex' : 'block';
    }
}

function goBack() {
    console.log('Going back');
    showScreen('cases-menu');
    resetCaseAnimation();
    currentCase = null;
}

function resetCaseAnimation() {
    if (caseBox) {
        caseBox.classList.remove('opening', 'shaking');
    }
    if (prizeDisplay) {
        prizeDisplay.classList.remove('show');
    }
    if (resultContainer) {
        resultContainer.classList.add('hidden');
    }
    if (openBtnContainer) {
        openBtnContainer.style.display = 'block';
    }
    if (particles) {
        particles.innerHTML = '';
    }
    if (openCaseBtn) {
        openCaseBtn.disabled = false;
    }
    isOpening = false;
}

function getRandomPrize(caseType) {
    const prizes = CASES[caseType].prizes;
    const sortedPrizes = prizes.slice().sort(function(a, b) {
        return a.chance - b.chance;
    });
    const roll = Math.random() * 100;
    
    for (var i = 0; i < sortedPrizes.length; i++) {
        if (roll <= sortedPrizes[i].chance) {
            return sortedPrizes[i].amount;
        }
    }
    
    return prizes[0].amount;
}

async function openCase() {
    console.log('Opening case:', currentCase, 'isOpening:', isOpening);
    
    if (isOpening || !currentCase) {
        console.log('Cannot open - already opening or no case selected');
        return;
    }
    
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
    if (openCaseBtn) openCaseBtn.disabled = true;
    
    // Списываем стоимость
    if (currentCase !== 'daily') {
        userBalance -= caseData.cost;
        updateBalanceDisplay();
    } else {
        // Устанавливаем cooldown на 24 часа
        dailyCooldown = Date.now() + (24 * 60 * 60 * 1000);
    }
    
    // Анимация тряски
    if (caseBox) caseBox.classList.add('shaking');
    
    // Определяем приз
    const prize = getRandomPrize(currentCase);
    console.log('Prize:', prize);
    
    // Ждём и открываем
    await sleep(1500);
    
    if (caseBox) {
        caseBox.classList.remove('shaking');
        caseBox.classList.add('opening');
    }
    
    // Скрываем кнопку открытия
    if (openBtnContainer) openBtnContainer.style.display = 'none';
    
    // Ждём открытия крышки
    await sleep(800);
    
    // Создаём частицы
    createParticles(prize > 0);
    
    // Показываем приз
    if (prizeDisplay) {
        const prizeAmount = prizeDisplay.querySelector('.prize-amount');
        if (prizeAmount) {
            prizeAmount.textContent = prize > 0 ? '+' + prize : '0';
        }
        prizeDisplay.classList.add('show');
    }
    
    // Начисляем приз
    if (prize > 0) {
        userBalance += prize;
        updateBalanceDisplay();
    }
    
    // Показываем результат
    await sleep(1500);
    
    if (resultContainer) {
        const resultText = resultContainer.querySelector('.result-text');
        if (resultText) {
            if (prize > 0) {
                resultText.innerHTML = '🎉 Поздравляем! Вы выиграли <b>' + prize + ' ⭐</b>';
            } else {
                resultText.innerHTML = '😔 В этот раз не повезло...';
            }
        }
        resultContainer.classList.remove('hidden');
    }
    
    // Проверяем можно ли открыть ещё
    if (againBtn) {
        const canOpenAgain = currentCase === 'daily' ? false : userBalance >= caseData.cost;
        againBtn.style.display = canOpenAgain ? 'block' : 'none';
    }
    
    isOpening = false;
    if (openCaseBtn) openCaseBtn.disabled = false;
    
    // Отправляем результат боту
    sendResultToBot(currentCase, prize);
}

function createParticles(isWin) {
    if (!particles) return;
    
    const colors = isWin 
        ? ['#ffd700', '#ffec8b', '#ff6b6b', '#e94560', '#00ff88'] 
        : ['#555', '#666', '#777'];
    
    for (var i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = '50%';
        particle.style.top = '40%';
        
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const distance = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        particles.appendChild(particle);
        
        setTimeout(function() {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1500);
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
    
    try {
        tg.sendData(JSON.stringify(data));
        console.log('Data sent to bot:', data);
    } catch (e) {
        console.log('Error sending data:', e);
    }
}

function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}
