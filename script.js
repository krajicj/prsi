/**
 * Prší - Game for a 3-year old girl
 * 
 * Game Rules Summary:
 * - 32 cards (4 suits: hearts, leaves, bells, acorns)
 * - Values: 7, 8, 9, 10, Jack (Svršek), Queen (Filek), King, Ace
 * - Player vs AI
 * - Goal: Be the first to have no cards.
 */

// --- Constants & Configuration ---
const SUITS = [
    { id: 'hearts', symbol: '♥️', label: 'Srdce' },
    { id: 'leaves', symbol: '🍃', label: 'Listy' },
    { id: 'bells', symbol: '🔔', label: 'Kule' },
    { id: 'acorns', symbol: '🌰', label: 'Žaludy' }
];

const VALUES = [
    { id: '7', label: '7' },
    { id: '8', label: '8' },
    { id: '9', label: '9' },
    { id: '10', label: '10' },
    { id: 'jack', label: 'S' }, // Svršek
    { id: 'queen', label: 'F' }, // Filek
    { id: 'king', label: 'K' },
    { id: 'ace', label: 'A' }
];

// --- Game State ---
let state = {
    deck: [],
    drawPile: [],
    discardPile: [],
    playerHand: [],
    opponentHand: [],
    currentTurn: 'player', // 'player' or 'opponent'
    activeSuit: null, // For Jack change
    isGameOver: false,
    rules: {
        childMode: true,
        aceSkips: false,
        sevenDraws: false,
        stacking: false,
        jackChanges: false
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

// --- Initialization ---
function init() {
    // Event Listeners for Toggles
    document.getElementById('child-mode-toggle').addEventListener('change', (e) => {
        state.rules.childMode = e.target.checked;
        if (state.rules.childMode) {
            elements.advancedSettings.classList.add('hidden');
        } else {
            elements.advancedSettings.classList.remove('hidden');
        }
    });

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('draw-btn').addEventListener('click', () => handleDraw('player'));
    document.getElementById('draw-pile').addEventListener('click', () => handleDraw('player'));
    document.getElementById('menu-btn').addEventListener('click', () => {
        elements.gameBoard.classList.add('hidden');
        elements.settingsPanel.classList.remove('hidden');
    });

    // Suit picker buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSuit(btn.dataset.suit));
    });
}

function startGame() {
    // Update rules from UI
    state.rules.childMode = document.getElementById('child-mode-toggle').checked;
    if (!state.rules.childMode) {
        state.rules.aceSkips = document.getElementById('ace-skips-toggle').checked;
        state.rules.sevenDraws = document.getElementById('seven-draws-toggle').checked;
        state.rules.stacking = document.getElementById('stacking-toggle').checked;
        state.rules.jackChanges = document.getElementById('jack-changes-toggle').checked;
    } else {
        // Reset rules for child mode
        state.rules.aceSkips = false;
        state.rules.sevenDraws = false;
        state.rules.stacking = false;
        state.rules.jackChanges = false;
    }

    // Reset State
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

    // Deal cards (4 each)
    for (let i = 0; i < 4; i++) {
        state.playerHand.push(state.drawPile.pop());
        state.opponentHand.push(state.drawPile.pop());
    }

    // First card on discard pile
    let firstCard = state.drawPile.pop();
    // In Prší, the first card cannot be special if it would affect the first player immediately
    // For simplicity, we just put it there.
    state.discardPile.push(firstCard);
    state.activeSuit = firstCard.suit;

    // UI Updates
    elements.settingsPanel.classList.add('hidden');
    elements.overlay.classList.add('hidden');
    elements.gameBoard.classList.remove('hidden');
    elements.suitPicker.classList.add('hidden');
    
    updateUI();
}

// --- Card Logic ---
function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            deck.push({
                suit: suit.id,
                value: value.id,
                symbol: suit.symbol,
                label: value.label
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

// --- Gameplay ---
function handlePlayCard(cardIndex) {
    if (state.currentTurn !== 'player' || state.isGameOver || state.waitingForSuitSelection) return;

    const card = state.playerHand[cardIndex];
    if (isValidMove(card)) {
        // Remove from hand
        state.playerHand.splice(cardIndex, 1);
        playCard(card);
    }
}

function playCard(card) {
    state.discardPile.push(card);
    state.activeSuit = card.suit;
    
    // Apply special rules
    let effectTriggered = false;

    if (!state.rules.childMode) {
        if (state.rules.sevenDraws && card.value === '7') {
            state.effectStack.drawCount += 2;
            effectTriggered = true;
        } else if (state.rules.aceSkips && card.value === 'ace') {
            state.effectStack.skips += 1;
            effectTriggered = true;
        } else if (state.rules.jackChanges && card.value === 'jack') {
            if (state.currentTurn === 'player') {
                state.waitingForSuitSelection = true;
                elements.suitPicker.classList.remove('hidden');
                updateUI();
                return; // Wait for user to pick suit
            } else {
                // AI chooses suit
                const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)].id;
                state.activeSuit = randomSuit;
            }
        }
    }

    checkWin();
    if (state.isGameOver) return;

    // Next turn
    endTurn();
}

function handleDraw(who) {
    if (state.currentTurn !== who || state.isGameOver || state.waitingForSuitSelection) return;

    // If there's an active penalty (draw 2 from sevens)
    if (state.effectStack.drawCount > 0) {
        for (let i = 0; i < state.effectStack.drawCount; i++) {
            drawOne(who);
        }
        state.effectStack.drawCount = 0;
        endTurn();
    } else {
        // Normal draw
        drawOne(who);
        // After normal draw, turn always ends
        endTurn();
    }
}

function drawOne(who) {
    if (state.drawPile.length === 0) {
        // Reshuffle discard pile back to draw pile
        const topCard = state.discardPile.pop();
        state.drawPile = [...state.discardPile];
        shuffle(state.drawPile);
        state.discardPile = [topCard];
    }

    if (state.drawPile.length > 0) {
        const card = state.drawPile.pop();
        if (who === 'player') {
            state.playerHand.push(card);
        } else {
            state.opponentHand.push(card);
        }
    }
    updateUI();
}

function endTurn() {
    if (state.isGameOver) return;

    // Check for skips
    if (state.effectStack.skips > 0) {
        state.effectStack.skips--;
        // Turn stays the same but effect consumed
        // (Visual feedback would be good here)
        updateUI();
        if (state.currentTurn === 'opponent') {
            setTimeout(opponentTurn, 1000);
        }
        return;
    }

    state.currentTurn = state.currentTurn === 'player' ? 'opponent' : 'player';
    updateUI();

    if (state.currentTurn === 'opponent') {
        setTimeout(opponentTurn, 1000);
    }
}

function selectSuit(suitId) {
    state.activeSuit = suitId;
    state.waitingForSuitSelection = false;
    elements.suitPicker.classList.add('hidden');
    checkWin();
    if (!state.isGameOver) {
        endTurn();
    }
}

function isValidMove(card) {
    const topCard = state.discardPile[state.discardPile.length - 1];
    
    // If there's a penalty pending
    if (state.effectStack.drawCount > 0) {
        if (state.rules.stacking) {
            return card.value === '7';
        } else {
            return false; // Must draw if stacking is off
        }
    }

    if (state.effectStack.skips > 0) {
        if (state.rules.stacking) {
            return card.value === 'ace';
        } else {
            return false; // Must skip if stacking is off
        }
    }

    // Jack can usually be played on anything unless rules say otherwise
    if (!state.rules.childMode && state.rules.jackChanges && card.value === 'jack') {
        return true;
    }

    // Normal move
    return card.suit === state.activeSuit || card.value === topCard.value;
}

// --- AI Logic ---
function opponentTurn() {
    if (state.currentTurn !== 'opponent' || state.isGameOver) return;

    const playableIndices = [];
    state.opponentHand.forEach((card, index) => {
        if (isValidMove(card)) {
            playableIndices.push(index);
        }
    });

    if (playableIndices.length > 0) {
        // AI plays a card
        // Simple strategy: play first valid card
        const index = playableIndices[0];
        const card = state.opponentHand.splice(index, 1)[0];
        playCard(card);
    } else {
        // AI draws
        handleDraw('opponent');
    }
}

// --- UI Logic ---
function updateUI() {
    // Render Player Hand
    elements.playerHand.innerHTML = '';
    state.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card);
        const playable = (state.currentTurn === 'player' && isValidMove(card) && !state.waitingForSuitSelection);
        
        if (playable) {
            cardEl.classList.add('playable');
        } else if (state.currentTurn === 'player') {
            cardEl.classList.add('dimmed');
        }
        
        cardEl.addEventListener('click', () => handlePlayCard(index));
        elements.playerHand.appendChild(cardEl);
    });

    // Render Opponent Hand (facedown)
    elements.opponentHand.innerHTML = '';
    state.opponentHand.forEach(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = '<div class="card-back"></div>';
        elements.opponentHand.appendChild(cardEl);
    });

    // Render Discard Pile (top card)
    elements.discardPile.innerHTML = '';
    if (state.discardPile.length > 0) {
        const topCard = state.discardPile[state.discardPile.length - 1];
        const cardEl = createCardElement(topCard);
        elements.discardPile.appendChild(cardEl);
    }

    // Draw Pile
    elements.drawCount.innerText = state.drawPile.length;

    // Draw Button Highlight
    const canDraw = (state.currentTurn === 'player' && !state.waitingForSuitSelection);
    const mustDraw = canDraw && !state.playerHand.some(c => isValidMove(c));
    
    if (state.rules.childMode && canDraw) {
        elements.drawBtn.classList.add('playable');
    } else if (mustDraw) {
        elements.drawBtn.classList.add('playable');
    } else {
        elements.drawBtn.classList.remove('playable');
    }

    // Turn Message
    if (state.waitingForSuitSelection) {
        elements.turnMessage.innerText = 'Vyber si novou barvu!';
    } else if (state.currentTurn === 'player') {
        elements.turnMessage.innerText = 'Na řadě jsi ty!';
        elements.turnMessage.style.color = '#2e7d32';
    } else {
        elements.turnMessage.innerText = 'Počítač přemýšlí...';
        elements.turnMessage.style.color = '#c62828';
    }

    // Active Suit Indicator (if it's different from top card suit due to Jack)
    const topCard = state.discardPile[state.discardPile.length - 1];
    if (topCard && state.activeSuit !== topCard.suit) {
        elements.activeSuitIndicator.classList.remove('hidden');
        const suitData = SUITS.find(s => s.id === state.activeSuit);
        elements.activeSuitIcon.innerText = suitData.symbol + ' ' + suitData.label;
        elements.activeSuitIcon.className = suitIdToClassName(state.activeSuit);
    } else {
        elements.activeSuitIndicator.classList.add('hidden');
    }
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${suitIdToClassName(card.suit)}`;
    
    const suitSymbol = SUITS.find(s => s.id === card.suit).symbol;
    
    cardEl.innerHTML = `
        <div class="card-value">${card.label}</div>
        <div class="card-suit">${suitSymbol}</div>
        <div class="card-value" style="transform: rotate(180deg)">${card.label}</div>
    `;
    
    return cardEl;
}

function suitIdToClassName(id) {
    return id; // matches SUITS[].id and CSS classes
}

function checkWin() {
    if (state.playerHand.length === 0) {
        showResult('Vyhrála jsi! 🎉');
    } else if (state.opponentHand.length === 0) {
        showResult('Počítač vyhrál. Zkus to znovu!');
    }
}

function showResult(message) {
    state.isGameOver = true;
    elements.resultMessage.innerText = message;
    elements.overlay.classList.remove('hidden');
}

// Start the app
init();
