// ======================================
// AVAILABLE CARD SYMBOLS
// ======================================

const symbols = [
    "🍉", "🚀", "🐼", "🎸",
    "🌈", "⚽", "🦋", "🍕",
    "🌻", "🎧", "🐙", "🧩"
];


// ======================================
// DIFFICULTY SETTINGS
// ======================================

const levels = {
    easy: 4,
    medium: 8,
    hard: 12
};


// ======================================
// HTML ELEMENTS
// ======================================

const board = document.getElementById("board");
const difficulty = document.getElementById("difficulty");

const movesDisplay = document.getElementById("moves");
const matchedDisplay = document.getElementById("matched");
const timerDisplay = document.getElementById("timer");
const bestDisplay = document.getElementById("best");
const scoreDisplay = document.getElementById("score");

const message = document.getElementById("message");
const overlay = document.getElementById("winOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");

const startBtn = document.getElementById("startBtn");
const startStatus = document.getElementById("startStatus");

const restartBtn = document.getElementById("restartBtn");
const hintBtn = document.getElementById("hintBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const soundBtn = document.getElementById("soundBtn");
const playAgainBtn = document.getElementById("playAgainBtn");


// ======================================
// GAME VARIABLES
// ======================================

let firstCard = null;
let secondCard = null;

let lockBoard = false;
let isPaused = false;

let moves = 0;
let matchedPairs = 0;
let score = 0;

let totalPairs = levels[difficulty.value];

let seconds = 0;
let timerId = null;
let timerWasStarted = false;

let mismatchTimeout = null;
let hintTimeout = null;
let finishTimeout = null;

let pendingMismatch = false;
let pendingHint = false;

let hintedCards = [];

let gameStarted = false;
let soundEnabled = true;


// ======================================
// SOUND SYSTEM
// ======================================

let audioContext = null;

function initializeAudio() {

    if (!audioContext) {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return false;
        }

        audioContext = new AudioContextClass();

    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return true;

}


function playSound(frequency = 400, duration = 0.15) {

    if (!soundEnabled) return;

    try {

        if (!initializeAudio()) return;

        const oscillator = audioContext.createOscillator();

        const gain = audioContext.createGain();

        oscillator.connect(gain);

        gain.connect(audioContext.destination);

        oscillator.frequency.value = frequency;

        oscillator.type = "sine";

        const now = audioContext.currentTime;

        gain.gain.setValueAtTime(0.18, now);

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration
        );

        oscillator.start(now);

        oscillator.stop(now + duration);

    } catch (error) {

        console.log("Audio could not be played:", error);

    }

}


// Different sounds for different actions

function playMatchSound() {

    playSound(600, 0.15);

    setTimeout(() => playSound(800, 0.15), 120);

}

function playWinSound() {

    playSound(500, 0.2);

    setTimeout(() => playSound(650, 0.2), 180);

    setTimeout(() => playSound(850, 0.3), 360);

}


// ======================================
// SHUFFLE CARDS
// ======================================

function shuffle(array) {

    let shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];

    }

    return shuffled;

}


// ======================================
// FORMAT TIME
// ======================================

function formatTime(time) {

    let minutes = Math.floor(time / 60);

    let remainingSeconds = time % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


// ======================================
// TIMER
// ======================================

function startTimer() {

    if (
        timerId !== null ||
        isPaused ||
        !gameStarted
    ) {
        return;
    }

    timerWasStarted = true;

    timerId = setInterval(function() {

        seconds++;

        timerDisplay.textContent = formatTime(seconds);

    }, 1000);

}


function stopTimer() {

    if (timerId !== null) {

        clearInterval(timerId);

        timerId = null;

    }

}


// ======================================
// CLEAR GAME TIMERS
// ======================================

function clearGameTimers() {

    stopTimer();

    clearTimeout(mismatchTimeout);

    clearTimeout(hintTimeout);

    clearTimeout(finishTimeout);

    mismatchTimeout = null;

    hintTimeout = null;

    finishTimeout = null;

    pendingMismatch = false;

    pendingHint = false;

    hintedCards.forEach(card => {
        card.classList.remove("hint");
    });

    hintedCards = [];

}


// ======================================
// BEST TIME
// ======================================

function showBestTime() {

    try {

        let best = Number(
            localStorage.getItem("best_" + difficulty.value)
        );

        bestDisplay.textContent =
            best ? formatTime(best) : "--:--";

    } catch (error) {

        bestDisplay.textContent = "--:--";

    }

}


function saveBestTime() {

    try {

        let key = "best_" + difficulty.value;

        let previousBest = Number(localStorage.getItem(key));

        if (!previousBest || seconds < previousBest) {

            localStorage.setItem(key, seconds);

        }

        showBestTime();

    } catch (error) {

        console.log("Could not save best time.");

    }

}


// ======================================
// BEST SCORE
// ======================================

function getBestScore() {

    try {

        return Number(
            localStorage.getItem("bestScore_" + difficulty.value)
        ) || 0;

    } catch {

        return 0;

    }

}


function saveBestScore() {

    try {

        let key = "bestScore_" + difficulty.value;

        let previousBest = getBestScore();

        if (score > previousBest) {

            localStorage.setItem(key, score);

        }

    } catch (error) {

        console.log("Could not save best score.");

    }

}


// ======================================
// UPDATE STATISTICS
// ======================================

function updateStats() {

    movesDisplay.textContent = moves;

    scoreDisplay.textContent = score;

    matchedDisplay.textContent =
        matchedPairs + " / " + totalPairs;

}


// ======================================
// CREATE CARD
// ======================================

function createCard(symbol) {

    const card = document.createElement("div");

    card.className = "card";

    card.dataset.symbol = symbol;

    card.textContent = "?";

    card.addEventListener("click", function() {

        flipCard(card);

    });

    return card;

}


// ======================================
// BUILD BOARD
// ======================================

function buildBoard() {

    totalPairs = levels[difficulty.value];

    let selectedSymbols = symbols.slice(0, totalPairs);

    let cards = shuffle([
        ...selectedSymbols,
        ...selectedSymbols
    ]);

    board.innerHTML = "";

    board.className = "board";

    if (difficulty.value === "hard") {

        board.classList.add("hard");

    }

    cards.forEach(function(symbol) {

        board.appendChild(createCard(symbol));

    });

    matchedDisplay.textContent = "0 / " + totalPairs;

    showBestTime();

    updateStats();

}


// ======================================
// RESET GAME
// ======================================

function resetGame(startImmediately = false) {

    clearGameTimers();

    firstCard = null;

    secondCard = null;

    lockBoard = false;

    isPaused = false;

    moves = 0;

    matchedPairs = 0;

    score = 0;

    seconds = 0;

    timerWasStarted = false;

    gameStarted = startImmediately;

    movesDisplay.textContent = "0";

    scoreDisplay.textContent = "0";

    timerDisplay.textContent = "00:00";

    matchedDisplay.textContent =
        "0 / " + levels[difficulty.value];

    overlay.classList.remove("show");

    pauseOverlay.classList.remove("show");

    if (startImmediately) {

        startBtn.textContent = "✓ GAME STARTED";

        startStatus.textContent =
            "You're ready! Flip your first card to begin.";

    } else {

        startBtn.textContent = "▶ START GAME";

        startStatus.textContent =
            "Select your difficulty and get ready!";

    }

    startBtn.disabled = startImmediately;

    pauseBtn.disabled = !startImmediately;

    hintBtn.disabled = !startImmediately;

    pauseBtn.textContent = "⏸ Pause";

    buildBoard();

}


// ======================================
// START GAME
// ======================================

function startGame() {

    initializeAudio();

    resetGame(true);

    playSound(500);

}


// ======================================
// FLIP CARD
// ======================================

function flipCard(card) {

    if (
        !gameStarted ||
        isPaused ||
        lockBoard ||
        card === firstCard ||
        card.classList.contains("matched") ||
        card.classList.contains("flipped")
    ) {

        return;

    }

    if (timerId === null) {

        startTimer();

    }

    card.classList.add("flipped");

    card.textContent = card.dataset.symbol;

    playSound(350);

    if (firstCard === null) {

        firstCard = card;

        message.textContent = "Choose one more card.";

        return;

    }

    secondCard = card;

    moves++;

    updateStats();

    checkForMatch();

}


// ======================================
// CHECK MATCH
// ======================================

function checkForMatch() {

    let isMatch =
        firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {

        handleMatch();

    } else {

        handleMismatch();

    }

}


// ======================================
// HANDLE MATCH
// ======================================

function handleMatch() {

    firstCard.classList.add("matched");

    secondCard.classList.add("matched");

    matchedPairs++;

    score += 100;

    message.innerHTML =
        "<strong>It's a match!</strong> +100 points. Excellent!";

    playMatchSound();

    clearTurn();

    updateStats();

    if (matchedPairs === totalPairs) {

        finishTimeout = setTimeout(function() {

            finishTimeout = null;

            finishGame();

        }, 500);

    }

}


// ======================================
// HANDLE MISMATCH
// ======================================

function handleMismatch() {

    lockBoard = true;

    score = Math.max(0, score - 10);

    message.textContent =
        "Not a match! -10 points. Try again.";

    playSound(180);

    updateStats();

    scheduleMismatch();

}


function scheduleMismatch() {

    mismatchTimeout = setTimeout(function() {

        if (firstCard) {

            firstCard.classList.remove("flipped");

            firstCard.textContent = "?";

        }

        if (secondCard) {

            secondCard.classList.remove("flipped");

            secondCard.textContent = "?";

        }

        mismatchTimeout = null;

        pendingMismatch = false;

        clearTurn();

        message.textContent =
            "Keep trying! Find the matching pairs.";

    }, 850);

}


// ======================================
// CLEAR SELECTED CARDS
// ======================================

function clearTurn() {

    firstCard = null;

    secondCard = null;

    lockBoard = false;

}


// ======================================
// HINT SYSTEM
// ======================================

function showHint() {

    if (
        !gameStarted ||
        isPaused ||
        lockBoard ||
        hintTimeout !== null
    ) {

        message.textContent =
            "Finish your current move before using a hint.";

        return;

    }

    if (score < 25) {

        message.textContent =
            "You need 25 points to use a hint.";

        return;

    }

    let hiddenCards = Array.from(
        board.querySelectorAll(".card:not(.matched)")
    );

    let firstHint;
    let secondHint;

    // If one card has already been selected,
    // reveal its matching partner.

    if (firstCard) {

        firstHint = firstCard;

        secondHint = hiddenCards.find(card =>
            card !== firstHint &&
            card.dataset.symbol === firstHint.dataset.symbol
        );

    } else {

        firstHint = hiddenCards[0];

        secondHint = hiddenCards.find(card =>
            card !== firstHint &&
            card.dataset.symbol === firstHint.dataset.symbol
        );

    }

    if (!firstHint || !secondHint) return;

    score -= 25;

    updateStats();

    hintedCards = [firstHint, secondHint];

    hintedCards.forEach(card => {
        card.classList.add("hint");
    });

    message.textContent =
        "Look carefully! These two cards match.";

    playSound(750);

    scheduleHint();

}


function scheduleHint() {

    hintTimeout = setTimeout(function() {

        hintedCards.forEach(card => {
            card.classList.remove("hint");
        });

        hintedCards = [];

        hintTimeout = null;

        pendingHint = false;

        message.textContent =
            "Now find the matching pairs!";

    }, 1500);

}


// ======================================
// PAUSE GAME
// ======================================

function pauseGame() {

    if (!gameStarted || isPaused) return;

    isPaused = true;

    stopTimer();

    // Preserve a pending mismatch while paused.
    if (mismatchTimeout !== null) {

        clearTimeout(mismatchTimeout);

        mismatchTimeout = null;

        pendingMismatch = true;

    }

    // Preserve a pending hint while paused.
    if (hintTimeout !== null) {

        clearTimeout(hintTimeout);

        hintTimeout = null;

        pendingHint = true;

    }

    pauseOverlay.classList.add("show");

    pauseBtn.textContent = "▶ Resume";

    message.textContent = "Game paused.";

    playSound(250);

}


// ======================================
// RESUME GAME
// ======================================

function resumeGame() {

    if (!isPaused) return;

    isPaused = false;

    pauseOverlay.classList.remove("show");

    if (timerWasStarted) {

        startTimer();

    }

    pauseBtn.textContent = "⏸ Pause";

    message.textContent = "Welcome back! Keep playing.";

    // Continue a pending mismatch.
    if (pendingMismatch) {

        pendingMismatch = false;

        scheduleMismatch();

    }

    // Continue a pending hint.
    if (pendingHint) {

        pendingHint = false;

        scheduleHint();

    }

    playSound(500);

}


// ======================================
// FINISH GAME
// ======================================

function finishGame() {

    if (matchedPairs !== totalPairs) return;

    clearGameTimers();

    gameStarted = false;

    isPaused = false;

    let timeBonus = Math.max(0, 300 - seconds);

    score += timeBonus;

    saveBestTime();

    saveBestScore();

    document.getElementById("finalMoves").textContent = moves;

    document.getElementById("finalTime").textContent =
        formatTime(seconds);

    document.getElementById("finalScore").textContent =
        score + " (including " + timeBonus + " bonus points)";

    let performanceTitle =
        document.getElementById("performanceTitle");

    let performanceMessage =
        document.getElementById("performanceMessage");

    if (moves <= totalPairs + 2) {

        performanceTitle.textContent = "Memory Master!";

        performanceMessage.textContent =
            "Outstanding! You completed the challenge with excellent accuracy.";

    } else if (moves <= totalPairs * 2) {

        performanceTitle.textContent = "Great Job!";

        performanceMessage.textContent =
            "You did really well! Your memory skills are improving.";

    } else {

        performanceTitle.textContent = "Well Played!";

        performanceMessage.textContent =
            "You completed the challenge. Keep practising!";

    }

    message.innerHTML =
        "<strong>Excellent!</strong> You matched every card!";

    startBtn.textContent = "▶ PLAY AGAIN";

    startBtn.disabled = false;

    startStatus.textContent =
        "Congratulations! You completed the challenge.";

    pauseBtn.disabled = true;

    hintBtn.disabled = true;

    playWinSound();

    finishTimeout = setTimeout(function() {

        finishTimeout = null;

        overlay.classList.add("show");

    }, 350);

}


// ======================================
// SOUND TOGGLE
// ======================================

function toggleSound() {

    soundEnabled = !soundEnabled;

    soundBtn.textContent = soundEnabled
        ? "🔊 Sound ON"
        : "🔇 Sound OFF";

    if (soundEnabled) {

        initializeAudio();

        playSound(700);

    }

}


// ======================================
// BUTTON EVENTS
// ======================================

startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", function() {

    startGame();

});

playAgainBtn.addEventListener("click", function() {

    startGame();

});

hintBtn.addEventListener("click", showHint);

pauseBtn.addEventListener("click", function() {

    if (isPaused) {

        resumeGame();

    } else {

        pauseGame();

    }

});

resumeBtn.addEventListener("click", resumeGame);

soundBtn.addEventListener("click", toggleSound);


// ======================================
// DIFFICULTY SELECTION
// ======================================

difficulty.addEventListener("change", function() {

    resetGame(false);

});


// ======================================
// INITIALIZE GAME
// ======================================

resetGame(false);
