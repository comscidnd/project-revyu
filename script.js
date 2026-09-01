const timerSettings = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

let currentMode = "pomodoro";
let timeLeft = timerSettings[currentMode];
let timer = null;
let currentSession = 1;
let completedSessions = 0;
let focusMinutes = 0;

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");
const currentModeDisplay = document.getElementById("current-mode");
const currentSessionDisplay = document.getElementById("current-session");
const completedSessionsDisplay = document.getElementById("completed-sessions");
const focusMinutesDisplay = document.getElementById("focus-minutes");
const modeButtons = document.querySelectorAll(".mode-btn");
const sessionDots = document.querySelectorAll(".session-dot");
const taskInput = document.getElementById("task-input");
const addTaskButton = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");


if (minutesDisplay && startButton) {

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        minutesDisplay.textContent = String(minutes).padStart(2, "0");
        secondsDisplay.textContent = String(seconds).padStart(2, "0");
    }

    function updateModeDisplay() {
        const modeNames = { pomodoro: "POMODORO", short: "SHORT BREAK", long: "LONG BREAK" };
        currentModeDisplay.textContent = modeNames[currentMode];
    }

    function startTimer() {
        if (timer !== null) return;
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                finishTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timer);
        timer = null;
    }

    function resetTimer() {
        clearInterval(timer);
        timer = null;
        timeLeft = timerSettings[currentMode];
        updateDisplay();
    }

    function finishTimer() {
        clearInterval(timer);
        timer = null;

        if (currentMode === "pomodoro") {
            completedSessions++;
            focusMinutes += 25;
            completedSessionsDisplay.textContent = completedSessions;
            focusMinutesDisplay.textContent = focusMinutes;

            currentSession = currentSession < 4 ? currentSession + 1 : 1;
            currentSessionDisplay.textContent = currentSession;

            updateSessionDots();
            changeMode("short");
            alert("Pomodoro complete! Time for a break ☕");
        } else {
            changeMode("pomodoro");
            alert("Break finished! Ready to focus? 🍅");
        }
    }

    function changeMode(mode) {
        clearInterval(timer);
        timer = null;
        currentMode = mode;
        timeLeft = timerSettings[currentMode];
        updateDisplay();
        updateModeDisplay();
        updateActiveMode();
    }

    function updateActiveMode() {
        modeButtons.forEach(button => {
            button.classList.remove("active");
            if (button.dataset.mode === currentMode) {
                button.classList.add("active");
            }
        });
    }

    function updateSessionDots() {
        sessionDots.forEach((dot, index) => {
            dot.classList.remove("active");
            if (index < currentSession) {
                dot.classList.add("active");
            }
        });
    }

    modeButtons.forEach(button => {
        button.addEventListener("click", () => changeMode(button.dataset.mode));
    });

    startButton.addEventListener("click", startTimer);
    pauseButton.addEventListener("click", pauseTimer);
    resetButton.addEventListener("click", resetTimer);

    updateDisplay();
    updateModeDisplay();
    updateActiveMode();
    updateSessionDots();
}

// Task list only runs on pages that have it
if (taskInput && addTaskButton && taskList) {

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === "") return;

        const taskItem = document.createElement("div");
        taskItem.classList.add("task-item");

        const taskName = document.createElement("span");
        taskName.textContent = taskText;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", () => taskItem.remove());

        taskItem.appendChild(taskName);
        taskItem.appendChild(deleteButton);
        taskList.appendChild(taskItem);

        taskInput.value = "";
    }

    addTaskButton.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") addTask();
    });
}

// Mobile nav toggle — needs to run on every page, so it's unconditional
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("change", function () {
        navLinks.classList.toggle("show");
    });
}