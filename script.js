/**
 * Prší - Game for a 3-year old girl
 */

// --- Constants & Configuration ---
const SUITS = [
    { id: 'bells', symbol: '🔔', label: 'Kule', file: 'kulova', icon: 'assets/kule.webp' },
    { id: 'hearts', symbol: '♥️', label: 'Srdce', file: 'cervena', icon: 'assets/srdce.webp' },
    { id: 'leaves', symbol: '🍃', label: 'Listy', file: 'zelena', icon: 'assets/zelene.webp' },
    { id: 'acorns', symbol: '🌰', label: 'Žaludy', file: 'zaludska', icon: 'assets/zaludy.webp' }
];

const VALUES = [
    { id: '7', label: '7', file: 'sedmicka' },
    { id: '8', label: '8', file: 'osmicka' },
    { id: '9', label: '9', file: 'devitka' },
    { id: '10', label: '10', file: 'desitka' },
    { id: 'spodek', label: 'Spodek', file: 'spodek' },
    { id: 'svrsek', label: 'Svršek', file: 'svrsek' },
    { id: 'king', label: 'Král', file: 'kral' },
    { id: 'ace', label: 'Eso', file: 'eso' }
];

// --- Game State ---
let state = {
    deck: [],
    drawPile: [],
    discardPile: [],
    playerHand: [],
    opponentHand: [],
    currentTurn: 'player', 
    activeSuit: null,
    isGameOver: false,
    rules: {
        childMode: true,
        aceSkips: false,
        sevenDraws: false,
        stacking: false,
        jackChanges: false,
        hideOpponentCards: false,
        hideHints: false
    },
    effectStack: {
        drawCount: 0,
        skips: 0
    },
    waitingForSuitSelection: false,
    selectedCardIndex: null,
    gameInProgress: false
};

// --- DOM Elements ---
const elements = {
    settingsPanel: document.getElementById('settings-panel'),
    gameBoard: document.getElementById('game-board'),
    playerHand: document.getElementById('player-hand'),
    opponentHand: document.getElementById('opponent-hand'),
    discardPile: document.getElementById('discard-pile'),
    drawPile: document.getElementById('draw-pile'),
    drawCount: document.getElementById('draw-count'),
    turnMessage: document.getElementById('turn-message'),
    suitPicker: document.getElementById('suit-picker'),
    overlay: document.getElementById('overlay'),
    resultMessage: document.getElementById('result-message'),
    activeSuitIndicator: document.getElementById('current-suit-indicator'),
    activeSuitIcon: document.getElementById('active-suit-icon'),
    advancedSettings: document.getElementById('advanced-settings'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    ruleHint: document.getElementById('rule-hint'),
    startGameBtn: document.getElementById('start-game-btn')
};

function applyDarkMode() {
    const isDark = document.getElementById('dark-mode-toggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
}

function checkRuleChanges() {
    if (!state.gameInProgress) {
        elements.ruleHint.classList.add('hidden');
        return;
    }

    const current = {
        childMode: document.getElementById('child-mode-toggle').checked,
        aceSkips: document.getElementById('ace-skips-toggle').checked,
        sevenDraws: document.getElementById('seven-draws-toggle').checked,
        stacking: document.getElementById('stacking-toggle').checked,
        jackChanges: document.getElementById('jack-changes-toggle').checked,
        hideOpponentCards: document.getElementById('hide-opponent-cards-toggle').checked,
        hideHints: document.getElementById('hide-hints-toggle').checked
    };

    let changed = false;
    for (const key in current) {
        if (current[key] !== state.rules[key]) {
            changed = true;
            break;
        }
    }

    if (changed) {
        elements.ruleHint.classList.remove('hidden');
    } else {
        elements.ruleHint.classList.add('hidden');
    }
}

function saveSettings() {
    const settings = {
        childMode: document.getElementById('child-mode-toggle').checked,
        aceSkips: document.getElementById('ace-skips-toggle').checked,
        sevenDraws: document.getElementById('seven-draws-toggle').checked,
        stacking: document.getElementById('stacking-toggle').checked,
        jackChanges: document.getElementById('jack-changes-toggle').checked,
        hideOpponentCards: document.getElementById('hide-opponent-cards-toggle').checked,
        hideHints: document.getElementById('hide-hints-toggle').checked,
        darkMode: document.getElementById('dark-mode-toggle').checked
    };
    localStorage.setItem('prsi-settings', JSON.stringify(settings));
    applyDarkMode();
    checkRuleChanges();
}

function loadSettings() {
    const saved = localStorage.getItem('prsi-settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            document.getElementById('child-mode-toggle').checked = settings.childMode;
            document.getElementById('ace-skips-toggle').checked = settings.aceSkips;
            document.getElementById('seven-draws-toggle').checked = settings.sevenDraws;
            document.getElementById('stacking-toggle').checked = settings.stacking;
            document.getElementById('jack-changes-toggle').checked = settings.jackChanges;
            document.getElementById('hide-opponent-cards-toggle').checked = settings.hideOpponentCards;
            document.getElementById('hide-hints-toggle').checked = settings.hideHints;
            document.getElementById('dark-mode-toggle').checked = settings.darkMode || false;
            applyDarkMode();
            return;
        } catch (e) {
            console.error('Failed to parse settings');
        }
    }
    document.getElementById('child-mode-toggle').checked = true;
}

// --- Initialization ---
async function preloadAssets() {
    const assetsToLoad = [
        'assets/back.webp',
        'assets/kule.webp',
        'assets/srdce.webp',
        'assets/zelene.webp',
        'assets/zaludy.webp'
    ];

    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            assetsToLoad.push(`assets/cards/${value.file}-${suit.file}.webp`);
        });
    });

    const btn = elements.startGameBtn;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Načítám...';
    btn.style.opacity = '0.7';

    // Keep references to preloaded images so they are not garbage collected
    window.__prsiImageCache = [];

    // Load all assets before enabling the start button
    const promises = assetsToLoad.map(src => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve;
            window.__prsiImageCache.push(img);
        });
    });

    await Promise.all(promises);

    btn.disabled = false;
    btn.textContent = originalText;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
}

function init() {
    loadSettings();
    preloadAssets();

    const childModeToggle = document.getElementById('child-mode-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const otherToggles = [
        document.getElementById('ace-skips-toggle'),
        document.getElementById('seven-draws-toggle'),
        document.getElementById('stacking-toggle'),
        document.getElementById('jack-changes-toggle'),
        document.getElementById('hide-opponent-cards-toggle'),
        document.getElementById('hide-hints-toggle')
    ];

    childModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) otherToggles.forEach(t => t.checked = false);
        saveSettings();
    });

    otherToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            if (toggle.checked) childModeToggle.checked = false;
            saveSettings();
        });
    });

    darkModeToggle.addEventListener('change', saveSettings);

    document.getElementById('rules-toggle-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const grid = document.getElementById('advanced-settings');
        
        btn.classList.toggle('open');
        grid.classList.toggle('collapsed');
        
        if (grid.classList.contains('collapsed')) {
            grid.style.maxHeight = '0px';
        } else {
            // Set max-height large enough to contain the grid for the transition
            grid.style.maxHeight = grid.scrollHeight + 'px';
        }
    });

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('draw-pile').addEventListener('click', () => handleDraw('player'));
    
    document.getElementById('menu-btn').addEventListener('click', () => {
        elements.gameBoard.classList.add('hidden');
        elements.settingsPanel.classList.remove('hidden');
        
        if (state.gameInProgress) {
            elements.closeSettingsBtn.classList.remove('hidden');
            elements.startGameBtn.textContent = 'Nová hra';
            checkRuleChanges();
        } else {
            elements.closeSettingsBtn.classList.add('hidden');
            elements.ruleHint.classList.add('hidden');
            elements.startGameBtn.textContent = 'Hrát hru!';
        }
    });

    elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.add('hidden');
        elements.gameBoard.classList.remove('hidden');
        updateUI();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSuit(btn.dataset.suit));
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card') && !e.target.closest('#draw-pile')) {
            state.selectedCardIndex = null;
            updateUI();
        }
    });

    window.addEventListener('resize', updateUI);
}

function startGame() {
    state.gameInProgress = true;
    state.rules.childMode = document.getElementById('child-mode-toggle').checked;
    state.rules.aceSkips = document.getElementById('ace-skips-toggle').checked;
    state.rules.sevenDraws = document.getElementById('seven-draws-toggle').checked;
    state.rules.stacking = document.getElementById('stacking-toggle').checked;
    state.rules.jackChanges = document.getElementById('jack-changes-toggle').checked;
    state.rules.hideOpponentCards = document.getElementById('hide-opponent-cards-toggle').checked;
    state.rules.hideHints = document.getElementById('hide-hints-toggle').checked;

    state.deck = createDeck();
    shuffle(state.deck);
    state.playerHand = [];
    state.opponentHand = [];
    state.discardPile = [];
    state.drawPile = [...state.deck];
    state.currentTurn = 'player';
    state.activeSuit = null;
    state.isGameOver = false;
    state.selectedCardIndex = null;
    state.effectStack = { drawCount: 0, skips: 0 };
    state.waitingForSuitSelection = false;

    for (let i = 0; i < 4; i++) {
        state.playerHand.push(state.drawPile.pop());
        state.opponentHand.push(state.drawPile.pop());
    }

    let firstCard = state.drawPile.pop();
    state.discardPile.push(firstCard);
    state.activeSuit = firstCard.suit;

    elements.settingsPanel.classList.add('hidden');
    elements.overlay.classList.add('hidden');
    elements.gameBoard.classList.remove('hidden');
    elements.suitPicker.classList.add('hidden');
    
    updateUI();
}

function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            deck.push({ 
                suit: suit.id, 
                value: value.id, 
                symbol: suit.symbol, 
                label: value.label,
                image: `assets/cards/${value.file}-${suit.file}.webp`
            });
        });
    });
    return deck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function animateCardMovement(sourceEl, targetEl, card, onComplete) {
    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const flyer = document.createElement('div');
    flyer.className = `flying-card suit-${card.suit} val-${card.value}`;
    flyer.style.backgroundImage = `url('${card.image}')`;
    
    flyer.style.width = sourceRect.width + 'px';
    flyer.style.height = sourceRect.height + 'px';
    flyer.style.left = sourceRect.left + 'px';
    flyer.style.top = sourceRect.top + 'px';
    flyer.style.margin = '0';
    flyer.style.transition = 'none';
    flyer.style.zIndex = '9999';
    
    document.body.appendChild(flyer);
    sourceEl.style.visibility = 'hidden';

    setTimeout(() => {
        flyer.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
        flyer.style.left = targetRect.left + 'px';
        flyer.style.top = targetRect.top + 'px';
        flyer.style.transform = `rotate(${Math.random() * 20 - 10}deg) scale(1.1)`;
    }, 20);

    setTimeout(() => {
        flyer.remove();
        if (onComplete) onComplete();
    }, 650);
}

// --- Gameplay ---
function handlePlayCard(cardIndex) {
    if (state.currentTurn !== 'player' || state.isGameOver || state.waitingForSuitSelection) return;

    const card = state.playerHand[cardIndex];
    const isPlayable = isValidMove(card);
    
    const container = elements.playerHand;
    const cardCount = state.playerHand.length;
    const containerWidth = container.offsetWidth || window.innerWidth;
    const availableWidth = containerWidth - 40;
    
    let cardWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-width'));
    if (isNaN(cardWidth)) cardWidth = window.innerWidth < 900 ? 78 : 108;
    
    const naturalTotalWidth = cardCount * (cardWidth + 10);
    const isOverlapping = naturalTotalWidth > availableWidth;
    
    let overlapPercent = 0;
    if (isOverlapping && cardCount > 1) {
        const overlapSpacePerCard = (naturalTotalWidth - availableWidth) / (cardCount - 1);
        overlapPercent = overlapSpacePerCard / cardWidth;
    }

    const isCrowded = overlapPercent > 0.4;

    if (state.selectedCardIndex === cardIndex) {
        if (isPlayable) {
            const cardEls = elements.playerHand.querySelectorAll('.card');
            const sourceEl = cardEls[cardIndex];
            animateCardMovement(sourceEl, elements.discardPile, card, () => {
                state.playerHand.splice(cardIndex, 1);
                state.selectedCardIndex = null;
                playCard(card);
            });
        } else {
            state.selectedCardIndex = null;
            updateUI();
        }
    } else {
        if (isCrowded) {
            state.selectedCardIndex = cardIndex;
            updateUI();
        } else {
            if (isPlayable) {
                const cardEls = elements.playerHand.querySelectorAll('.card');
                const sourceEl = cardEls[cardIndex];
                animateCardMovement(sourceEl, elements.discardPile, card, () => {
                    state.playerHand.splice(cardIndex, 1);
                    state.selectedCardIndex = null;
                    playCard(card);
                });
            } else {
                state.selectedCardIndex = null;
                updateUI();
            }
        }
    }
}

function playCard(card) {
    state.discardPile.push(card);
    state.activeSuit = card.suit;

    if (!state.rules.childMode) {
        if (state.rules.sevenDraws && card.value === '7') {
            state.effectStack.drawCount += 2;
        } else if (state.rules.aceSkips && card.value === 'ace') {
            state.effectStack.skips += 1;
        } else if (state.rules.jackChanges && card.value === 'svrsek') {
            if (state.currentTurn === 'player') {
                state.waitingForSuitSelection = true;
                elements.suitPicker.classList.remove('hidden');
                updateUI();
                return;
            } else {
                state.activeSuit = SUITS[Math.floor(Math.random() * SUITS.length)].id;
            }
        }
    }
    checkWin();
    if (!state.isGameOver) endTurn();
}

function opponentTurn() {
    if (state.currentTurn !== 'opponent' || state.isGameOver) return;

    const playableIndices = [];
    state.opponentHand.forEach((card, index) => {
        if (isValidMove(card)) playableIndices.push(index);
    });

    if (playableIndices.length > 0) {
        const index = playableIndices[Math.floor(Math.random() * playableIndices.length)];
        const card = state.opponentHand[index];
        const cardEls = elements.opponentHand.querySelectorAll('.card');
        const sourceEl = cardEls[index];
        animateCardMovement(sourceEl, elements.discardPile, card, () => {
            state.opponentHand.splice(index, 1);
            playCard(card);
        });
    } else {
        handleDraw('opponent');
    }
}

function handleDraw(who) {
    if (state.currentTurn !== who || state.isGameOver || state.waitingForSuitSelection) return;
    if (state.effectStack.drawCount > 0) {
        for (let i = 0; i < state.effectStack.drawCount; i++) drawOne(who);
        state.effectStack.drawCount = 0;
        endTurn();
    } else {
        drawOne(who);
        endTurn();
    }
}

function drawOne(who) {
    if (state.drawPile.length === 0) {
        const topCard = state.discardPile.pop();
        state.drawPile = [...state.discardPile];
        shuffle(state.drawPile);
        state.discardPile = [topCard];
    }
    if (state.drawPile.length > 0) {
        const card = state.drawPile.pop();
        if (who === 'player') {
            state.playerHand.push(card);
            state.selectedCardIndex = null;
        } else state.opponentHand.push(card);
    }
    updateUI();
}

function endTurn() {
    if (state.isGameOver) return;
    if (state.effectStack.skips > 0) {
        state.effectStack.skips--;
        updateUI();
        if (state.currentTurn === 'opponent') setTimeout(opponentTurn, 1500);
        return;
    }
    state.currentTurn = state.currentTurn === 'player' ? 'opponent' : 'player';
    state.selectedCardIndex = null;
    updateUI();
    if (state.currentTurn === 'opponent') setTimeout(opponentTurn, 1500);
}

function selectSuit(suitId) {
    state.activeSuit = suitId;
    state.waitingForSuitSelection = false;
    elements.suitPicker.classList.add('hidden');
    checkWin();
    if (!state.isGameOver) endTurn();
}

function isValidMove(card) {
    const topCard = state.discardPile[state.discardPile.length - 1];
    if (state.effectStack.drawCount > 0) return state.rules.stacking && card.value === '7';
    if (state.effectStack.skips > 0) return state.rules.stacking && card.value === 'ace';
    if (!state.rules.childMode && state.rules.jackChanges && card.value === 'svrsek') return true;
    return card.suit === state.activeSuit || card.value === topCard.value;
}

function getSmartMargin(container, cardCount) {
    if (cardCount <= 1) return 5;
    const containerWidth = container.offsetWidth || window.innerWidth;
    const availableWidth = containerWidth - 40;
    let cardWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-width'));
    if (isNaN(cardWidth)) cardWidth = window.innerWidth < 900 ? 78 : 108;
    
    const naturalTotalWidth = cardCount * (cardWidth + 10);
    
    if (naturalTotalWidth <= availableWidth) return 5;
    
    // Calculate overlapping margin to fit exactly
    const overlapSpace = availableWidth - (cardCount * cardWidth);
    const margin = (overlapSpace / (cardCount - 1)) / 2;
    
    // Safety limit
    return Math.max(margin, -(cardWidth / 2) + 10);
}

function updateUI() {
    // 1. Player Hand
    elements.playerHand.innerHTML = '';
    const playerMargin = getSmartMargin(elements.playerHand, state.playerHand.length);
    elements.playerHand.classList.toggle('has-selection', state.selectedCardIndex !== null);

    state.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card);
        const isSelected = state.selectedCardIndex === index;
        const playable = (state.currentTurn === 'player' && isValidMove(card) && !state.waitingForSuitSelection);
        cardEl.style.margin = `0 ${playerMargin}px`;
        cardEl.style.zIndex = index;
        if (isSelected) cardEl.classList.add('selected');
        if (!state.rules.hideHints) {
            if (playable) cardEl.classList.add('playable');
            else if (state.currentTurn === 'player') cardEl.classList.add('dimmed');
        }
        cardEl.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePlayCard(index);
        });
        elements.playerHand.appendChild(cardEl);
    });

    // 2. Opponent Hand
    elements.opponentHand.innerHTML = '';
    const opponentMargin = getSmartMargin(elements.opponentHand, state.opponentHand.length);
    state.opponentHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.margin = `0 ${opponentMargin}px`;
        cardEl.style.zIndex = index;
        if (!state.rules.hideOpponentCards) {
            cardEl.classList.add(`suit-${card.suit}`, `val-${card.value}`);
            cardEl.style.backgroundImage = `url('${card.image}')`;
        } else {
            cardEl.innerHTML = '<div class="card-back"></div>';
        }
        elements.opponentHand.appendChild(cardEl);
    });

    // 3. Piles & Status
    elements.discardPile.innerHTML = '';
    if (state.discardPile.length > 0) elements.discardPile.appendChild(createCardElement(state.discardPile[state.discardPile.length - 1]));
    elements.drawCount.innerText = state.drawPile.length;
    const canDraw = (state.currentTurn === 'player' && !state.waitingForSuitSelection);
    if (!state.rules.hideHints) {
        if (canDraw && !state.playerHand.some(c => isValidMove(c))) {
            elements.drawPile.classList.add('playable');
        } else {
            elements.drawPile.classList.remove('playable');
        }
    } else {
        elements.drawPile.classList.remove('playable');
    }

    if (state.waitingForSuitSelection) elements.turnMessage.innerText = 'Vyber si novou barvu!';
    else if (state.currentTurn === 'player') {
        elements.turnMessage.innerText = 'Na řadě jsi ty!';
        elements.turnMessage.style.color = '#2e7d32';
    } else {
        elements.turnMessage.innerText = 'Počítač přemýšlí...';
        elements.turnMessage.style.color = '#c62828';
    }

    const topCard = state.discardPile[state.discardPile.length - 1];
    if (topCard && state.activeSuit !== topCard.suit) {
        elements.activeSuitIndicator.classList.remove('hidden');
        const suitData = SUITS.find(s => s.id === state.activeSuit);
        elements.activeSuitIcon.innerHTML = `<img src="${suitData.icon}" class="status-icon"> ${suitData.label}`;
        elements.activeSuitIcon.className = `suit-${state.activeSuit}`;
    } else elements.activeSuitIndicator.classList.add('hidden');
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card suit-${card.suit} val-${card.value}`;
    cardEl.style.backgroundImage = `url('${card.image}')`;
    return cardEl;
}

function checkWin() {
    if (state.playerHand.length === 0) {
        showResult('<span class="result-emoji">🎉</span>Vyhrála jsi!<br><span style="font-size: 2.5rem; font-weight: normal; color: #4caf50;">👍</span>');
    } else if (state.opponentHand.length === 0) {
        showResult('<span class="result-emoji">😢</span>PC vyhrál<br><span style="font-size: 2.5rem; font-weight: normal; color: #f44336;">👎</span>');
    }
}

function showResult(message) {
    state.isGameOver = true;
    state.gameInProgress = false;
    elements.resultMessage.innerHTML = message;
    elements.overlay.classList.remove('hidden');
}

init();
