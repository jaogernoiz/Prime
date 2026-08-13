/* ==========================================================================
   Prime Factorization Calculator
   ==========================================================================
   Two clearly separated layers:
     1. Calculation logic — pure functions (no DOM access, no libraries)
     2. UI layer          — reads input, validates, renders results
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Calculation logic
   -------------------------------------------------------------------------- */

// Maximum accepted value: 1,000,000,000
const MAX_INPUT = 1000000000;

/**
 * Validate the raw input string.
 * @returns {{ ok: true, value: number } | { ok: false, message: string }}
 */
function parseInput(raw) {
  const input = raw.trim();

  if (input === "") {
    return { ok: false, message: "Please enter a number." };
  }

  // Digits only — rejects letters, decimals, negatives, spaces, symbols…
  if (!/^\d+$/.test(input)) {
    return { ok: false, message: "Please enter a valid number." };
  }

  const value = Number(input);

  if (value < 1) {
    return { ok: false, message: "Please enter a positive integer." };
  }

  if (value > MAX_INPUT) {
    return {
      ok: false,
      message: `Number is too large — please use a value up to ${MAX_INPUT.toLocaleString("en-US")}.`,
    };
  }

  return { ok: true, value };
}

/**
 * Trial division — returns the prime factors of n (n >= 2).
 * Example: 60 -> [2, 2, 3, 5]
 */
function primeFactorization(n) {
  const factors = [];
  let remaining = n;

  // Try every divisor from 2 upward; divide out all its copies.
  for (let divisor = 2; divisor * divisor <= remaining; divisor++) {
    while (remaining % divisor === 0) {
      factors.push(divisor);
      remaining /= divisor;
    }
  }

  // Whatever is left (> 1) is itself a prime factor.
  if (remaining > 1) {
    factors.push(remaining);
  }

  return factors;
}

/**
 * Group repeated factors.
 * Example: [2, 2, 3] -> [{ prime: 2, count: 2 }, { prime: 3, count: 1 }]
 */
function groupFactors(factors) {
  const groups = [];

  for (const factor of factors) {
    const last = groups[groups.length - 1];
    if (last && last.prime === factor) {
      last.count += 1;
    } else {
      groups.push({ prime: factor, count: 1 });
    }
  }

  return groups;
}

/* --------------------------------------------------------------------------
   2. UI layer
   -------------------------------------------------------------------------- */

const form = document.getElementById("factorForm");
const numberInput = document.getElementById("numberInput");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const resultBox = document.getElementById("resultBox");
const equation = document.getElementById("equation");
const exponentLine = document.getElementById("exponentLine");
const resultNote = document.getElementById("resultNote");

/** Show an inline error with a smooth animation (no alert()). */
function showError(message) {
  errorText.textContent = message;
  numberInput.classList.add("invalid");
  errorMessage.classList.remove("show");
  void errorMessage.offsetWidth; // restart the transition for repeated errors
  errorMessage.classList.add("show");
}

function clearError() {
  errorMessage.classList.remove("show");
  numberInput.classList.remove("invalid");
}

/** Render "60 = [2] × [2] × [3] × [5]" with factor pills. */
function renderResult(value, factors) {
  equation.textContent = "";

  // Leading value, e.g. "60"
  const valueSpan = document.createElement("span");
  valueSpan.className = "number";
  valueSpan.textContent = value.toLocaleString("en-US");
  equation.append(valueSpan);

  const equalsSpan = document.createElement("span");
  equalsSpan.className = "equals";
  equalsSpan.textContent = "=";
  equation.append(equalsSpan);

  // "1" is rendered as itself so the line reads "1 = 1"
  const pills = value === 1 ? [1] : factors;
  pills.forEach((factor, index) => {
    if (index > 0) {
      const timesSpan = document.createElement("span");
      timesSpan.className = "times";
      timesSpan.textContent = "×";
      equation.append(timesSpan);
    }

    const pill = document.createElement("span");
    pill.className = "factor";
    pill.style.setProperty("--i", index); // stagger the entrance animation
    pill.textContent = factor.toLocaleString("en-US");
    equation.append(pill);
  });

  renderExponents(value, factors);
  renderNote(value, factors);
}

/** Show a compact exponent form (e.g. "2² × 3 × 5") only when a factor repeats. */
function renderExponents(value, factors) {
  exponentLine.textContent = "";

  if (value === 1) {
    exponentLine.hidden = true;
    return;
  }

  const groups = groupFactors(factors);
  const hasRepeats = groups.some((group) => group.count > 1);

  if (!hasRepeats) {
    exponentLine.hidden = true;
    return;
  }

  exponentLine.hidden = false;

  const label = document.createElement("span");
  label.textContent = "Compact: ";
  exponentLine.append(label);

  groups.forEach((group, index) => {
    if (index > 0) {
      const timesSpan = document.createElement("span");
      timesSpan.textContent = " × ";
      exponentLine.append(timesSpan);
    }

    const base = document.createElement("span");
    base.textContent = group.prime.toLocaleString("en-US");
    exponentLine.append(base);

    if (group.count > 1) {
      const sup = document.createElement("sup");
      sup.textContent = group.count;
      exponentLine.append(sup);
    }
  });
}

/** Explain special results: 1 has no factors, primes get highlighted. */
function renderNote(value, factors) {
  if (value === 1) {
    resultNote.textContent = "1 has no prime factors.";
    resultNote.className = "result-note";
  } else if (factors.length === 1) {
    resultNote.textContent = value.toLocaleString("en-US") + " is a prime number.";
    resultNote.className = "result-note is-prime";
  } else {
    resultNote.textContent = "";
    resultNote.className = "result-note";
  }
}

/* --------------------------------------------------------------------------
   3. Theme (dark mode)
   -------------------------------------------------------------------------- */

const THEME_STORAGE_KEY = "prime-factorization-theme";
const themeToggle = document.getElementById("themeToggle");
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

/** Saved choice: "light", "dark", or null (null = follow the system). */
function getSavedTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null; // storage unavailable — the theme simply won't persist
  }
}

function setSavedTheme(theme) {
  try {
    if (theme) localStorage.setItem(THEME_STORAGE_KEY, theme);
    else localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** The theme actually in effect right now. */
function effectiveTheme() {
  return getSavedTheme() || (darkQuery.matches ? "dark" : "light");
}

/**
 * Sync the page + toggle button with the theme.
 * With no saved choice the attribute is left unset, so the CSS
 * @media (prefers-color-scheme: dark) rule follows the system.
 */
function applyTheme() {
  const saved = getSavedTheme();
  if (saved) document.documentElement.dataset.theme = saved;
  else document.documentElement.removeAttribute("data-theme");

  const isDark = effectiveTheme() === "dark";
  themeToggle.classList.toggle("dark", isDark);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}

/* --------------------------------------------------------------------------
   4. Events
   -------------------------------------------------------------------------- */

// <form> submit handles both the button click and pressing Enter in the input.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const parsed = parseInput(numberInput.value);

  if (!parsed.ok) {
    showError(parsed.message);
    resultBox.classList.remove("visible"); // hide the previous result
    numberInput.focus();
    return;
  }

  clearError();

  const factors = parsed.value === 1 ? [] : primeFactorization(parsed.value);
  renderResult(parsed.value, factors);

  // Re-trigger the fade + slide animation on every calculation (no flicker)
  resultBox.classList.remove("visible");
  void resultBox.offsetWidth;
  resultBox.classList.add("visible");
});

// Clear the error as soon as the user starts typing again
numberInput.addEventListener("input", clearError);

// Theme toggle button
themeToggle.addEventListener("click", () => {
  setSavedTheme(effectiveTheme() === "dark" ? "light" : "dark");
  applyTheme();
});

// Keep the icon in sync if the system theme changes while the page is open
if (typeof darkQuery.addEventListener === "function") {
  darkQuery.addEventListener("change", applyTheme);
} else if (typeof darkQuery.addListener === "function") {
  darkQuery.addListener(applyTheme); // older Safari
}

// Initial theme state
applyTheme();
