/**
 * Prší - Game for a 3-year old girl
 */

// --- Constants & Configuration ---
const SUITS = [
    { id: 'bells', symbol: '🔔', label: 'Kule', file: 'kulova' },
    { id: 'hearts', symbol: '♥️', label: 'Srdce', file: 'cervena' },
    { id: 'leaves', symbol: '🍃', label: 'Listy', file: 'zelena' },
    { id: 'acorns', symbol: '🌰', label: 'Žaludy', file: 'zaludska' }
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
        showOpponentCards: true,
        showHints: true
    },
    effectStack: {
        drawCount: 0,
        skips: 0
    },
    waitingForSuitSelection: false
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
    drawBtn: document.getElementById('draw-btn'),
    turnMessage: document.getElementById('turn-message'),
    suitPicker: document.getElementById('suit-picker'),
    overlay: document.getElementById('overlay'),
    resultMessage: document.getElementById('result-message'),
    activeSuitIndicator: document.getElementById('current-suit-indicator'),
    activeSuitIcon: document.getElementById('active-suit-icon'),
    advancedSettings: document.getElementById('advanced-settings')
};

function saveSettings() {
    const settings = {
        childMode: document.getElementById('child-mode-toggle').checked,
        aceSkips: document.getElementById('ace-skips-toggle').checked,
        sevenDraws: document.getElementById('seven-draws-toggle').checked,
        stacking: document.getElementById('stacking-toggle').checked,
        jackChanges: document.getElementById('jack-changes-toggle').checked,
        hideOpponentCards: document.getElementById('hide-opponent-cards-toggle').checked,
        hideHints: document.getElementById('hide-hints-toggle').checked
    };
    localStorage.setItem('prsi-settings', JSON.stringify(settings));
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
            return;
        } catch (e) {
            console.error('Failed to parse settings');
        }
    }
    // Defaults if no settings
    document.getElementById('child-mode-toggle').checked = true;
    document.getElementById('ace-skips-toggle').checked = false;
    document.getElementById('seven-draws-toggle').checked = false;
    document.getElementById('stacking-toggle').checked = false;
    document.getElementById('jack-changes-toggle').checked = false;
    document.getElementById('hide-opponent-cards-toggle').checked = false;
    document.getElementById('hide-hints-toggle').checked = false;
}

// --- Initialization ---
function init() {
    loadSettings();

    const childModeToggle = document.getElementById('child-mode-toggle');
    const otherToggles = [
        document.getElementById('ace-skips-toggle'),
        document.getElementById('seven-draws-toggle'),
        document.getElementById('stacking-toggle'),
        document.getElementById('jack-changes-toggle'),
        document.getElementById('hide-opponent-cards-toggle'),
        document.getElementById('hide-hints-toggle')
    ];

    childModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            otherToggles.forEach(t => t.checked = false);
        }
        saveSettings();
    });

    otherToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                childModeToggle.checked = false;
            }
            saveSettings();
        });
    });

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('draw-btn').addEventListener('click', () => handleDraw('player'));
    document.getElementById('draw-pile').addEventListener('click', () => handleDraw('player'));
    document.getElementById('menu-btn').addEventListener('click', () => {
        elements.gameBoard.classList.add('hidden');
        elements.settingsPanel.classList.remove('hidden');
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSuit(btn.dataset.suit));
    });
}

function startGame() {
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
                image: `assets/cards/${value.file}-${suit.file}.png`
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
    flyer.innerHTML = ''; 
    
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

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        flyer.remove();
        if (onComplete) onComplete();
    };

    flyer.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 800); 
}

// --- Gameplay ---
function handlePlayCard(cardIndex) {
    if (state.currentTurn !== 'player' || state.isGameOver || state.waitingForSuitSelection) return;

    const card = state.playerHand[cardIndex];
    if (isValidMove(card)) {
        const cardEls = elements.playerHand.querySelectorAll('.card');
        const sourceEl = cardEls[cardIndex];

        if (sourceEl) {
            animateCardMovement(sourceEl, elements.discardPile, card, () => {
                state.playerHand.splice(cardIndex, 1);
                playCard(card);
            });
        } else {
            state.playerHand.splice(cardIndex, 1);
            playCard(card);
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

        if (sourceEl) {
            animateCardMovement(sourceEl, elements.discardPile, card, () => {
                state.opponentHand.splice(index, 1);
                playCard(card);
            });
        } else {
            state.opponentHand.splice(index, 1);
            playCard(card);
        }
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
        if (who === 'player') state.playerHand.push(card);
        else state.opponentHand.push(card);
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

function updateUI() {
    elements.playerHand.innerHTML = '';
    state.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card);
        const playable = (state.currentTurn === 'player' && isValidMove(card) && !state.waitingForSuitSelection);
        
        if (!state.rules.hideHints) {
            if (playable) cardEl.classList.add('playable');
            else if (state.currentTurn === 'player') cardEl.classList.add('dimmed');
        }
        
        cardEl.addEventListener('click', () => handlePlayCard(index));
        elements.playerHand.appendChild(cardEl);
    });

    elements.opponentHand.innerHTML = '';
    state.opponentHand.forEach((card) => {
        const cardEl = document.createElement('div');
        if (!state.rules.hideOpponentCards) {
            cardEl.className = `card suit-${card.suit} val-${card.value}`;
            cardEl.style.backgroundImage = `url('${card.image}')`;
        } else {
            cardEl.className = 'card';
            cardEl.innerHTML = '<div class="card-back"></div>';
        }
        elements.opponentHand.appendChild(cardEl);
    });

    elements.discardPile.innerHTML = '';
    if (state.discardPile.length > 0) {
        elements.discardPile.appendChild(createCardElement(state.discardPile[state.discardPile.length - 1]));
    }

    elements.drawCount.innerText = state.drawPile.length;
    const canDraw = (state.currentTurn === 'player' && !state.waitingForSuitSelection);
    
    if (!state.rules.hideHints) {
        if (state.rules.childMode && canDraw) elements.drawBtn.classList.add('playable');
        else if (canDraw && !state.playerHand.some(c => isValidMove(c))) elements.drawBtn.classList.add('playable');
        else elements.drawBtn.classList.remove('playable');
    } else {
        elements.drawBtn.classList.remove('playable');
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
        elements.activeSuitIcon.innerText = suitData.symbol + ' ' + suitData.label;
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
    if (state.playerHand.length === 0) showResult('<span style="color: #4caf50">Vyhrála jsi! 🟢😊🎉</span>');
    else if (state.opponentHand.length === 0) showResult('<span style="color: #f44336">Počítač vyhrál. 🔴☹️</span>');
}

function showResult(message) {
    state.isGameOver = true;
    elements.resultMessage.innerHTML = message;
    elements.overlay.classList.remove('hidden');
}

init();
