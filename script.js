
const timerSettings = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

// Current timer
let currentMode = "pomodoro";
let timeLeft = timerSettings[currentMode];
let timer = null;


// Get HTML elements
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");

const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");

const modeButtons = document.querySelectorAll(".mode-btn");


// =========================
// DISPLAY TIMER
// =========================

function updateDisplay() {

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    minutesDisplay.textContent = String(minutes).padStart(2, "0");
    secondsDisplay.textContent = String(seconds).padStart(2, "0");
}


// =========================
// START TIMER
// =========================

function startTimer() {

    // Prevent multiple timers from running
    if (timer !== null) {
        return;
    }

    timer = setInterval(() => {

        if (timeLeft > 0) {

            timeLeft--;
            updateDisplay();

        } else {

            clearInterval(timer);
            timer = null;

            alert("Time's up! 🎉");
        }

    }, 1000);
}


// =========================
// PAUSE TIMER
// =========================

function pauseTimer() {

    clearInterval(timer);
    timer = null;
}


// =========================
// RESET TIMER
// =========================

function resetTimer() {

    clearInterval(timer);
    timer = null;

    timeLeft = timerSettings[currentMode];

    updateDisplay();
}


// =========================
// CHANGE TIMER MODE
// =========================

function changeMode(mode) {

    // Stop current timer
    clearInterval(timer);
    timer = null;

    // Change mode
    currentMode = mode;

    // Reset time
    timeLeft = timerSettings[currentMode];

    // Update display
    updateDisplay();

    // Update active button
    modeButtons.forEach(button => {
        button.classList.remove("active");
    });

    document
        .querySelector(`[data-mode="${mode}"]`)
        ?.classList.add("active");
}


// =========================
// BUTTON EVENTS
// =========================

startButton.addEventListener("click", startTimer);

pauseButton.addEventListener("click", pauseTimer);

resetButton.addEventListener("click", resetTimer);


// =========================
// MODE BUTTON EVENTS
// =========================

modeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const mode = button.dataset.mode;

        changeMode(mode);

    });

});


// =========================
// INITIAL DISPLAY
// =========================

updateDisplay();
