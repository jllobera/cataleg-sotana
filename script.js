const DATA_URL = "programes.json";

const themeToggle = document.querySelector("#theme-toggle");
const themeToggleLabel = document.querySelector("#theme-toggle-label");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const seasonFilter = document.querySelector("#season-filter");
const guestSearch = document.querySelector("#guest-search");
const sortButton = document.querySelector("#sort-button");
const sortLabel = document.querySelector("#sort-label");
const guestFilter = document.querySelector("#guest-filter");
const programGrid = document.querySelector("#program-grid");
const resultsCount = document.querySelector("#results-count");
const errorMessage = document.querySelector("#error-message");

let programs = [];
let ascending = false;

function applyTheme(theme) {
  const isLight = theme === "light";

  // Apply the theme to the entire document
  document.documentElement.dataset.theme = isLight ? "light" : "dark";

  // Update La Sotana logos according to the selected theme
  const logoPath = isLight
    ? "assets/LaSotana.png"
    : "assets/LaSotana_fosc.png";

  document.querySelector("#brand-logo").src = logoPath;
  document.querySelector("#favicon").href = logoPath;
  document.querySelector("#apple-touch-icon").href = logoPath;

  // Update the switch state
  themeToggle.setAttribute("aria-checked", String(isLight));

  // Update the visible label
  themeToggleLabel.textContent = isLight ? "Mode clar" : "Mode fosc";

  // Update the browser's UI colour
  themeColorMeta?.setAttribute(
    "content",
    isLight ? "#f5f3ef" : "#101010"
  );
}

// Restore the previously selected theme
let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem("la-sotana-theme") || "dark";
} catch (error) {
  // If localStorage is unavailable, use dark mode
}

applyTheme(savedTheme === "light" ? "light" : "dark");

// Toggle between dark and light mode
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(newTheme);

  try {
    localStorage.setItem("la-sotana-theme", newTheme);
  } catch (error) {
    // The theme still works for the current session
  }
});

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const youtubeIcon = `
  <svg class="youtube-icon" viewBox="0 0 24 18" aria-hidden="true">
    <path fill="currentColor" d="M23.5 2.8A3 3 0 0 0 21.4.7C19.5.2 12 .2 12 .2S4.5.2 2.6.7A3 3 0 0 0 .5 2.8 31 31 0 0 0 0 9s0 3.2.5 6.2a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 9s0-3.2-.5-6.2ZM9.6 12.8V5.2L16 9l-6.4 3.8Z"/>
  </svg>`;

const spotifyIcon = `
  <svg class="spotify-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.1-10.55-1.15a.75.75 0 1 1-.33-1.46c4.58-1.05 8.5-.6 11.66 1.34.35.22.46.68.25 1.02Zm1.47-3.26a.94.94 0 0 1-1.29.31c-3.23-1.99-8.15-2.57-11.97-1.4a.94.94 0 1 1-.55-1.8c4.36-1.32 9.77-.68 13.5 1.6.44.27.58.85.31 1.29Zm.13-3.4C15.23 8.3 8.8 8.08 5.07 9.22a1.13 1.13 0 1 1-.66-2.16c4.28-1.3 11.4-1.05 15.9 1.62a1.13 1.13 0 0 1-1.16 1.95Z"/>
  </svg>`;

const ivooxIcon = `
  <svg class="platform-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM7 6.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM5.75 10.5a1.25 1.25 0 0 1 1.25 1.25v6a1.25 1.25 0 1 1-2.5 0v-6c0-.69.56-1.25 1.25-1.25zm5.78.38a1.25 1.25 0 0 1 1.77 0l3.75 3.75a1.25 1.25 0 1 1-1.77 1.77L12 13.4l-2.88 2.88a1.25 1.25 0 1 1-1.77-1.77l3.75-3.75zM17 10.5a1.25 1.25 0 0 1 1.25 1.25v6a1.25 1.25 0 1 1-2.5 0v-6c0-.69.56-1.25 1.25-1.25z"/>
  </svg>`;

const applePodcastsIcon = `
  <svg class="platform-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 3.6a8.4 8.4 0 0 1 8.4 8.4c0 3.48-2.12 6.47-5.14 7.71l-.64-1.85a6.47 6.47 0 0 0 3.88-5.86 6.5 6.5 0 0 0-13 0c0 2.53 1.45 4.73 3.57 5.8l-.65 1.86A8.39 8.39 0 0 1 3.6 12 8.4 8.4 0 0 1 12 3.6zm0 3.36a5.04 5.04 0 0 1 5.04 5.04c0 1.95-1.11 3.65-2.73 4.49l-.75-1.8a3.12 3.12 0 0 0 1.56-2.69 3.12 3.12 0 1 0-6.24 0c0 1.14.61 2.14 1.53 2.68l-.75 1.82A5.03 5.03 0 0 1 6.96 12 5.04 5.04 0 0 1 12 6.96zm0 2.64a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z"/>
  </svg>`;

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatDate(dateString) {
  if (typeof dateString !== "string") return "";
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function createProgramCard(program) {
  const card = document.createElement("article");
  card.className = "program-card";

  const heading = document.createElement("div");
  heading.className = "program-heading";

  const title = document.createElement("h2");
  title.className = "program-title";
  const guest = typeof program.convidat === "string" && program.convidat.trim()
    ? ` - ${program.convidat.trim()}`
    : "";
  title.textContent = `${program.id}${guest}`;

  const date = document.createElement("span");
  date.className = "program-date";
  date.textContent = formatDate(program.data);
  heading.append(title, date);

  const youtubeUrl = safeHttpUrl(program.youtube);
  let youtube;
  if (youtubeUrl) {
    youtube = document.createElement("a");
    youtube.className = "youtube-link";
    youtube.href = youtubeUrl;
    youtube.target = "_blank";
    youtube.rel = "noopener noreferrer";
    youtube.setAttribute("aria-label", `Obre el programa ${program.id} a YouTube`);
    youtube.innerHTML = `${youtubeIcon}<span>VEURE PROGRAMA</span>`;
  } else {
    youtube = document.createElement("div");
    youtube.className = "youtube-link";
    youtube.innerHTML = `<span>VÍDEO NO DISPONIBLE</span>`;
    youtube.setAttribute("aria-label", "Vídeo no disponible");
  }

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const platforms = [
    {
      field: "spotify",
      label: "SPOTIFY",
      icon: spotifyIcon,
      className: "spotify-link"
    },
    {
      field: "ivoox",
      label: "IVO​​OX",
      icon: ivooxIcon,
      className: "ivoox-link"
    },
    {
      field: "apple",
      label: "APPLE PODCASTS",
      icon: applePodcastsIcon,
      className: "apple-podcasts-link"
    }
  ];

  for (const platform of platforms) {
    const url = safeHttpUrl(program[platform.field]);

    if (!url) continue;

    const link = document.createElement("a");
    link.className = `platform-link ${platform.className}`;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.setAttribute(
      "aria-label",
      `Escolta el programa ${program.id} a ${platform.label}`
    );

    link.innerHTML = `${platform.icon}<span>${platform.label}</span>`;

    bottom.append(link);
  }

  card.append(heading, youtube, bottom);
  return card;
}

function populateSeasons() {
  const seasons = [...new Set(
    programs.map(program => program.temporada).filter(value => typeof value === "string" && value.trim())
  )].sort((a, b) => b.localeCompare(a, "ca", { numeric: true }));

  for (const season of seasons) {
    const option = document.createElement("option");
    option.value = season;
    option.textContent = season;
    seasonFilter.append(option);
  }
}

function renderPrograms() {
  const selectedSeason = seasonFilter.value;
  const onlyGuests = guestFilter.checked;
  const searchTerm = normalizeText(guestSearch.value);

  const visiblePrograms = programs
    .filter(program => selectedSeason === "all" || program.temporada === selectedSeason)
    .filter(program => !onlyGuests || (typeof program.convidat === "string" && program.convidat.trim()))
    .filter(program => {
      if (!searchTerm) return true;

      const guestName = normalizeText(program.convidat);
      return guestName.includes(searchTerm);
    })
    .sort((a, b) => ascending ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id));

  programGrid.replaceChildren();
  resultsCount.textContent = `${visiblePrograms.length} ${visiblePrograms.length === 1 ? "programa" : "programes"}`;

  if (visiblePrograms.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No hi ha cap programa que coincideixi amb aquests filtres.";
    programGrid.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  visiblePrograms.forEach(program => fragment.append(createProgramCard(program)));
  programGrid.append(fragment);
}

async function loadPrograms() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`No s'ha pogut carregar ${DATA_URL} (${response.status}).`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("El fitxer JSON ha de contenir una llista de programes.");

    programs = data.filter(program => program && Number.isFinite(Number(program.id)));
    populateSeasons();
    renderPrograms();
    errorMessage.hidden = true;
  } catch (error) {
    programGrid.innerHTML = '<p class="status-message">No s’ha pogut carregar el catàleg.</p>';
    resultsCount.textContent = "Error";
    errorMessage.textContent = `${error.message} Comprova que el fitxer existeix i que el JSON és vàlid.`;
    errorMessage.hidden = false;
  }
}

seasonFilter.addEventListener("change", renderPrograms);
guestFilter.addEventListener("change", renderPrograms);
guestSearch.addEventListener("input", renderPrograms);

sortButton.addEventListener("click", () => {
  ascending = !ascending;
  sortButton.setAttribute("aria-pressed", String(ascending));
  sortButton.querySelector(".sort-icon").textContent = ascending ? "↑" : "↓";
  sortLabel.textContent = ascending ? "Més antics primer" : "Més nous primer";
  renderPrograms();
});

loadPrograms();
