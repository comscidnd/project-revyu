/* =====================================================
   SETTINGS
===================================================== */

const defaultSettings = {
    focus: 25,
    short: 5,
    long: 15,
    autoStartBreaks: false,
    autoStartSessions: false,
    soundEnabled: true
};

let settings = { ...defaultSettings };

function loadSettings() {
    const saved = localStorage.getItem("revyu-settings");

    if (saved) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
            settings = { ...defaultSettings };
        }
    }
}

function saveSettingsToStorage() {
    localStorage.setItem("revyu-settings", JSON.stringify(settings));
}


/* =====================================================
   TIMER STATE
===================================================== */

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

function applySettingsToTimer() {
    timerSettings.pomodoro = settings.focus * 60;
    timerSettings.short = settings.short * 60;
    timerSettings.long = settings.long * 60;
}


/* =====================================================
   ELEMENT REFERENCES
===================================================== */

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
const taskCountDisplay = document.getElementById("task-count");

const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsClose = document.getElementById("settings-close");
const settingsSave = document.getElementById("settings-save");
const focusDurationInput = document.getElementById("focus-duration");
const shortDurationInput = document.getElementById("short-duration");
const longDurationInput = document.getElementById("long-duration");
const autoStartBreaksInput = document.getElementById("auto-start-breaks");
const autoStartSessionsInput = document.getElementById("auto-start-sessions");
const soundToggleInput = document.getElementById("sound-toggle");


/* =====================================================
   TOAST NOTIFICATIONS (non-blocking, replaces alert())
===================================================== */

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}


/* =====================================================
   SOUND NOTIFICATION (Web Audio API, no external file)
===================================================== */

function playBeep() {
    if (!settings.soundEnabled) {
        return;
    }

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        // Audio not supported/blocked — fail silently
    }
}


/* =====================================================
   TIMER LOGIC (only runs on pages with the timer UI)
===================================================== */

if (minutesDisplay && startButton) {

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        minutesDisplay.textContent = String(minutes).padStart(2, "0");
        secondsDisplay.textContent = String(seconds).padStart(2, "0");
    }

    function updateModeDisplay() {
        const modeNames = {
            pomodoro: "POMODORO",
            short: "SHORT BREAK",
            long: "LONG BREAK"
        };

        currentModeDisplay.textContent = modeNames[currentMode];
    }

    function startTimer() {
        if (timer !== null) {
            return;
        }

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

        playBeep();

        if (currentMode === "pomodoro") {
            completedSessions++;
            focusMinutes += settings.focus;

            completedSessionsDisplay.textContent = completedSessions;
            focusMinutesDisplay.textContent = focusMinutes;

            currentSession = currentSession < 4 ? currentSession + 1 : 1;
            currentSessionDisplay.textContent = currentSession;

            updateSessionDots();
            changeMode("short");
            showToast("Pomodoro complete! Time for a break ☕");

            if (settings.autoStartBreaks) {
                startTimer();
            }

        } else {
            changeMode("pomodoro");
            showToast("Break finished! Ready to focus? 🍅");

            if (settings.autoStartSessions) {
                startTimer();
            }
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
        button.addEventListener("click", () => {
            changeMode(button.dataset.mode);
        });
    });

    startButton.addEventListener("click", startTimer);
    pauseButton.addEventListener("click", pauseTimer);
    resetButton.addEventListener("click", resetTimer);

    // Load saved settings, apply durations, then paint initial state
    loadSettings();
    applySettingsToTimer();
    timeLeft = timerSettings[currentMode];

    updateDisplay();
    updateModeDisplay();
    updateActiveMode();
    updateSessionDots();


    /* =================================================
       SETTINGS PANEL
    ================================================= */

    if (settingsBtn && settingsOverlay) {

        function openSettingsPanel() {
            focusDurationInput.value = settings.focus;
            shortDurationInput.value = settings.short;
            longDurationInput.value = settings.long;
            autoStartBreaksInput.checked = settings.autoStartBreaks;
            autoStartSessionsInput.checked = settings.autoStartSessions;
            soundToggleInput.checked = settings.soundEnabled;

            settingsOverlay.classList.add("show");
        }

        function closeSettingsPanel() {
            settingsOverlay.classList.remove("show");
        }

        function saveSettingsFromPanel() {
            settings.focus = Math.max(1, parseInt(focusDurationInput.value, 10) || defaultSettings.focus);
            settings.short = Math.max(1, parseInt(shortDurationInput.value, 10) || defaultSettings.short);
            settings.long = Math.max(1, parseInt(longDurationInput.value, 10) || defaultSettings.long);
            settings.autoStartBreaks = autoStartBreaksInput.checked;
            settings.autoStartSessions = autoStartSessionsInput.checked;
            settings.soundEnabled = soundToggleInput.checked;

            applySettingsToTimer();
            saveSettingsToStorage();

            // If the timer isn't currently running, refresh the displayed
            // time so a changed duration shows immediately.
            if (timer === null) {
                timeLeft = timerSettings[currentMode];
                updateDisplay();
            }

            // Keep the mode-button subtitles ("25 min" etc.) in sync
            const modeMinutes = {
                pomodoro: settings.focus,
                short: settings.short,
                long: settings.long
            };

            modeButtons.forEach(button => {
                const small = button.querySelector("small");
                if (small && modeMinutes[button.dataset.mode] !== undefined) {
                    small.textContent = `${modeMinutes[button.dataset.mode]} min`;
                }
            });

            closeSettingsPanel();
            showToast("Settings saved");
        }

        settingsBtn.addEventListener("click", openSettingsPanel);
        settingsClose.addEventListener("click", closeSettingsPanel);
        settingsSave.addEventListener("click", saveSettingsFromPanel);

        // Click on the dark overlay (outside the panel) closes it
        settingsOverlay.addEventListener("click", (event) => {
            if (event.target === settingsOverlay) {
                closeSettingsPanel();
            }
        });
    }
}


/* =====================================================
   TASK LIST (only runs on pages with the task UI)
===================================================== */

if (taskInput && addTaskButton && taskList) {

    const TASKS_KEY = "revyu-tasks";

    function getTasksFromDOM() {
        return Array.from(taskList.querySelectorAll(".task-item")).map(item => ({
            text: item.querySelector(".task-text").textContent.trim(),
            completed: item.classList.contains("completed")
        }));
    }

    function saveTasks() {
        localStorage.setItem(TASKS_KEY, JSON.stringify(getTasksFromDOM()));
    }

    function updateTaskCount() {
        const tasks = getTasksFromDOM();
        const completed = tasks.filter(task => task.completed).length;
        taskCountDisplay.textContent = `${completed} of ${tasks.length} completed`;
    }

    function createTaskElement(text, completed) {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-item");
        if (completed) {
            taskItem.classList.add("completed");
        }

        // Checkbox — mark task complete/incomplete
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.setAttribute("aria-label", "Mark task complete");
        checkbox.addEventListener("change", () => {
            taskItem.classList.toggle("completed", checkbox.checked);
            saveTasks();
            updateTaskCount();
        });

        // Task text — double-click to edit inline
        const taskText = document.createElement("span");
        taskText.classList.add("task-text");
        taskText.textContent = text;

        taskText.addEventListener("dblclick", () => {
            taskText.contentEditable = "true";
            taskText.focus();

            const range = document.createRange();
            range.selectNodeContents(taskText);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });

        function finishEditing() {
            taskText.contentEditable = "false";
            if (taskText.textContent.trim() === "") {
                taskText.textContent = text;
            } else {
                text = taskText.textContent.trim();
                taskText.textContent = text;
            }
            saveTasks();
        }

        taskText.addEventListener("blur", finishEditing);
        taskText.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                taskText.blur();
            }
        });

        // Delete button
        const actions = document.createElement("div");
        actions.classList.add("task-actions");

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete task");
        deleteButton.addEventListener("click", () => {
            taskItem.remove();
            saveTasks();
            updateTaskCount();
        });

        actions.appendChild(deleteButton);

        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(actions);

        return taskItem;
    }

    function addTask() {
        const taskTextValue = taskInput.value.trim();

        if (taskTextValue === "") {
            return;
        }

        const taskItem = createTaskElement(taskTextValue, false);
        taskList.appendChild(taskItem);

        taskInput.value = "";

        saveTasks();
        updateTaskCount();
    }

    function loadTasks() {
        const saved = localStorage.getItem(TASKS_KEY);

        if (!saved) {
            updateTaskCount();
            return;
        }

        try {
            const tasks = JSON.parse(saved);
            tasks.forEach(task => {
                const taskItem = createTaskElement(task.text, task.completed);
                taskList.appendChild(taskItem);
            });
        } catch (e) {
            // Ignore corrupted storage data
        }

        updateTaskCount();
    }

    addTaskButton.addEventListener("click", addTask);

    taskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addTask();
        }
    });

    loadTasks();
}


/* =====================================================
   MOBILE NAV TOGGLE (runs on every page)
===================================================== */

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("change", function () {
        navLinks.classList.toggle("show");
    });
}