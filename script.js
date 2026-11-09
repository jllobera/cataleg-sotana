const DATA_URL = "data/programes.json";

const seasonFilter = document.querySelector("#season-filter");
const sortButton = document.querySelector("#sort-button");
const sortLabel = document.querySelector("#sort-label");
const guestFilter = document.querySelector("#guest-filter");
const programGrid = document.querySelector("#program-grid");
const resultsCount = document.querySelector("#results-count");
const errorMessage = document.querySelector("#error-message");

let programs = [];
let ascending = false;

const youtubeIcon = `
  <svg class="youtube-icon" viewBox="0 0 24 18" aria-hidden="true">
    <path fill="currentColor" d="M23.5 2.8A3 3 0 0 0 21.4.7C19.5.2 12 .2 12 .2S4.5.2 2.6.7A3 3 0 0 0 .5 2.8 31 31 0 0 0 0 9s0 3.2.5 6.2a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 9s0-3.2-.5-6.2ZM9.6 12.8V5.2L16 9l-6.4 3.8Z"/>
  </svg>`;

const spotifyIcon = `
  <svg class="spotify-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.1-10.55-1.15a.75.75 0 1 1-.33-1.46c4.58-1.05 8.5-.6 11.66 1.34.35.22.46.68.25 1.02Zm1.47-3.26a.94.94 0 0 1-1.29.31c-3.23-1.99-8.15-2.57-11.97-1.4a.94.94 0 1 1-.55-1.8c4.36-1.32 9.77-.68 13.5 1.6.44.27.58.85.31 1.29Zm.13-3.4C15.23 8.3 8.8 8.08 5.07 9.22a1.13 1.13 0 1 1-.66-2.16c4.28-1.3 11.4-1.05 15.9 1.62a1.13 1.13 0 0 1-1.16 1.95Z"/>
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

  const season = document.createElement("span");
  season.className = "program-season";
  season.textContent = program.temporada || "";
  heading.append(title, season);

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
  const spotifyUrl = safeHttpUrl(program.spotify);
  if (spotifyUrl) {
    const spotify = document.createElement("a");
    spotify.className = "spotify-link";
    spotify.href = spotifyUrl;
    spotify.target = "_blank";
    spotify.rel = "noopener noreferrer";
    spotify.setAttribute("aria-label", `Escolta el programa ${program.id} a Spotify`);
    spotify.innerHTML = `${spotifyIcon}<span>ESCOLTA A SPOTIFY</span>`;
    bottom.append(spotify);
  } else {
    const unavailable = document.createElement("span");
    unavailable.className = "no-spotify";
    unavailable.textContent = "Spotify no disponible";
    bottom.append(unavailable);
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

  const visiblePrograms = programs
    .filter(program => selectedSeason === "all" || program.temporada === selectedSeason)
    .filter(program => !onlyGuests || (typeof program.convidat === "string" && program.convidat.trim()))
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

sortButton.addEventListener("click", () => {
  ascending = !ascending;
  sortButton.setAttribute("aria-pressed", String(ascending));
  sortButton.querySelector(".sort-icon").textContent = ascending ? "↑" : "↓";
  sortLabel.textContent = ascending ? "Més antics primer" : "Més nous primer";
  renderPrograms();
});

loadPrograms();
