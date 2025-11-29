// Telegram WebApp
var tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Конфигурация кейсов
var CASES = {
    farm: { name: '🌾 Фарм кейс', cost: 1, prizes: [0.5, 1, 6, 9] },
    lucky: { name: '🍀 Счастливчик', cost: 5, prizes: [3, 5, 10, 15] },
    confident: { name: '💪 Уверенный', cost: 10, prizes: [7, 10, 15, 30] },
    risky: { name: '🔥 Рисковый', cost: 20, prizes: [15, 20, 30, 80] },
    daily: { name: '🎁 Ежедневный', cost: 0, prizes: [0, 5, 10] }
};

// Состояние
var userBalance = 0;
var currentCase = null;
var isOpening = false;

// Запуск
window.onload = function() {
    console.log('App loaded!');
    
    // Получаем баланс из URL параметров (от бота)
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var startParam = urlParams.get('start_param');
        if (startParam) {
            var params = JSON.parse(atob(startParam));
            userBalance = params.balance || 0;
            console.log('Balance from bot:', userBalance);
        }
    } catch (e) {
        console.log('Error parsing params:', e);
    }
    
    // Убеждаемся что показывается меню кейсов
    var menu = document.getElementById('cases-menu');
    var openScreen = document.getElementById('case-open');
    if (menu) {
        menu.style.display = 'block';
        menu.classList.add('active');
    }
    if (openScreen) {
        openScreen.style.display = 'none';
        openScreen.classList.remove('active');
    }
    
    // Привязываем клики к карточкам
    var cards = document.querySelectorAll('.case-card');
    for (var i = 0; i < cards.length; i++) {
        (function(card) {
            card.onclick = function() {
                var caseType = card.getAttribute('data-case');
                console.log('Card clicked:', caseType);
                selectCase(caseType);
            };
        })(cards[i]);
    }
    
    // Кнопка открыть
    var openBtn = document.getElementById('open-case-btn');
    if (openBtn) {
        openBtn.onclick = function() {
            console.log('Open button clicked!');
            startOpening();
        };
    }
    
    // Кнопка назад
    var backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            console.log('Back clicked');
            goBack();
        };
    }
    
    // Кнопка продолжить
    var continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.onclick = function() {
            goBack();
        };
    }
    
    // Кнопка ещё
    var againBtn = document.getElementById('again-btn');
    if (againBtn) {
        againBtn.onclick = function() {
            resetAnimation();
            startOpening();
        };
    }
    
    updateBalance();
};

function updateBalance() {
    var el = document.getElementById('user-balance');
    if (el) {
        el.textContent = userBalance.toFixed(2) + ' ⭐';
    }
}

function selectCase(caseType) {
    console.log('selectCase:', caseType);
    
    if (!CASES[caseType]) {
        alert('Кейс не найден: ' + caseType);
        return;
    }
    
    var caseData = CASES[caseType];
    
    // Проверяем баланс
    if (caseType !== 'daily' && userBalance < caseData.cost) {
        tg.showAlert('Недостаточно средств! Нужно ' + caseData.cost + ' ⭐');
        return;
    }
    
    currentCase = caseType;
    
    // Обновляем цену на кнопке
    var btnPrice = document.querySelector('.btn-price');
    if (btnPrice) {
        btnPrice.textContent = caseType === 'daily' ? 'Бесплатно' : caseData.cost + ' ⭐';
    }
    
    // Показываем экран открытия
    showOpenScreen();
}

function showOpenScreen() {
    console.log('showOpenScreen');
    
    var menu = document.getElementById('cases-menu');
    var openScreen = document.getElementById('case-open');
    
    if (menu) {
        menu.style.display = 'none';
        menu.classList.remove('active');
    }
    
    if (openScreen) {
        openScreen.style.display = 'flex';
        openScreen.classList.add('active');
    }
    
    resetAnimation();
}

function goBack() {
    console.log('goBack');
    
    var menu = document.getElementById('cases-menu');
    var openScreen = document.getElementById('case-open');
    
    if (openScreen) {
        openScreen.style.display = 'none';
        openScreen.classList.remove('active');
    }
    
    if (menu) {
        menu.style.display = 'block';
        menu.classList.add('active');
    }
    
    currentCase = null;
    isOpening = false;
    resetAnimation();
}

function resetAnimation() {
    var caseBox = document.querySelector('.case-box');
    var prizeDisplay = document.getElementById('prize-display');
    var resultContainer = document.getElementById('result-container');
    var openBtnContainer = document.getElementById('open-btn-container');
    var openBtn = document.getElementById('open-case-btn');
    var particles = document.getElementById('particles');
    
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
    if (openBtn) {
        openBtn.disabled = false;
    }
    if (particles) {
        particles.innerHTML = '';
    }
    
    isOpening = false;
}

function startOpening() {
    console.log('startOpening, currentCase:', currentCase, 'isOpening:', isOpening);
    
    if (isOpening) {
        console.log('Already opening!');
        return;
    }
    
    if (!currentCase) {
        console.log('No case selected!');
        return;
    }
    
    var caseData = CASES[currentCase];
    
    // Проверяем баланс
    if (currentCase !== 'daily' && userBalance < caseData.cost) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    isOpening = true;
    
    var openBtn = document.getElementById('open-case-btn');
    if (openBtn) openBtn.disabled = true;
    
    // Списываем стоимость
    if (currentCase !== 'daily') {
        userBalance -= caseData.cost;
        updateBalance();
    }
    
    // Выбираем случайный приз
    var prizes = caseData.prizes;
    var prize = prizes[Math.floor(Math.random() * prizes.length)];
    
    console.log('Prize will be:', prize);
    
    // Запускаем анимацию
    var caseBox = document.querySelector('.case-box');
    if (caseBox) {
        caseBox.classList.add('shaking');
    }
    
    // Через 1.5 сек открываем
    setTimeout(function() {
        if (caseBox) {
            caseBox.classList.remove('shaking');
            caseBox.classList.add('opening');
        }
        
        // Скрываем кнопку
        var openBtnContainer = document.getElementById('open-btn-container');
        if (openBtnContainer) {
            openBtnContainer.style.display = 'none';
        }
        
        // Через 0.8 сек показываем приз
        setTimeout(function() {
            showPrize(prize);
        }, 800);
        
    }, 1500);
}

function showPrize(prize) {
    console.log('showPrize:', prize);
    
    // Создаём частицы
    createParticles(prize > 0);
    
    // Показываем приз
    var prizeDisplay = document.getElementById('prize-display');
    var prizeAmount = document.querySelector('.prize-amount');
    
    if (prizeAmount) {
        prizeAmount.textContent = prize > 0 ? '+' + prize : '0';
    }
    
    if (prizeDisplay) {
        prizeDisplay.classList.add('show');
    }
    
    // Начисляем приз
    if (prize > 0) {
        userBalance += prize;
        updateBalance();
    }
    
    // Через 1.5 сек показываем результат
    setTimeout(function() {
        showResult(prize);
    }, 1500);
}

function showResult(prize) {
    console.log('showResult:', prize);
    
    var resultContainer = document.getElementById('result-container');
    var resultText = document.querySelector('.result-text');
    var againBtn = document.getElementById('again-btn');
    
    if (resultText) {
        if (prize > 0) {
            resultText.innerHTML = '🎉 Поздравляем! Вы выиграли <b>' + prize + ' ⭐</b>';
        } else {
            resultText.innerHTML = '😔 В этот раз не повезло...';
        }
    }
    
    if (resultContainer) {
        resultContainer.classList.remove('hidden');
    }
    
    // Проверяем можно ли открыть ещё
    if (againBtn && currentCase) {
        var caseData = CASES[currentCase];
        var canOpenAgain = currentCase !== 'daily' && userBalance >= caseData.cost;
        againBtn.style.display = canOpenAgain ? 'block' : 'none';
    }
    
    isOpening = false;
    
    // Отправляем результат боту
    sendToBot(currentCase, prize);
}

function createParticles(isWin) {
    var particles = document.getElementById('particles');
    if (!particles) return;
    
    var colors = isWin 
        ? ['#ffd700', '#ffec8b', '#ff6b6b', '#e94560', '#00ff88'] 
        : ['#555', '#666', '#777'];
    
    for (var i = 0; i < 30; i++) {
        var particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = '50%';
        particle.style.top = '40%';
        
        var angle = (Math.random() * 360) * (Math.PI / 180);
        var distance = 100 + Math.random() * 150;
        var tx = Math.cos(angle) * distance;
        var ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        particles.appendChild(particle);
    }
    
    // Удаляем частицы через 2 сек
    setTimeout(function() {
        if (particles) {
            particles.innerHTML = '';
        }
    }, 2000);
}

function sendToBot(caseType, prize) {
    var data = {
        action: 'case_opened',
        case_type: caseType,
        prize: prize,
        new_balance: userBalance
    };
    
    try {
        tg.sendData(JSON.stringify(data));
        console.log('Sent to bot:', data);
    } catch (e) {
        console.log('Error sending:', e);
    }
}
