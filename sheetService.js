const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cachePath = path.join(__dirname, "cache", "sheetsDataCache.json");

const sheetApis = {
  2017: "https://v1.nocodeapi.com/sameerbelal/google_sheets/UYludJqTCVfNjwOD",
  2018: "https://v1.nocodeapi.com/sameerbelal/google_sheets/kmhWqJPpxLsTWGtA",
  2019: "https://v1.nocodeapi.com/sameerbelal/google_sheets/OTzlZBjjtvqASpNs",
  2020: "https://v1.nocodeapi.com/sameerbelal/google_sheets/bpIBIDHLygUhyjRN",
  2021: "https://v1.nocodeapi.com/sameerbelal/google_sheets/hFBMtGUcOPTitZPx",
  2022: "https://v1.nocodeapi.com/sameerbelal/google_sheets/suLhljvNjJfDUPXS",
  2023: "https://v1.nocodeapi.com/sameerbelal/google_sheets/kekMAHSTnjuKKuhc",
  2024: "https://v1.nocodeapi.com/sameerbelal/google_sheets/PXhQsullybhwxuTD",
};

const memoryCache = {};
const failedSeasons = new Set();
let cacheDirty = false;

function loadCacheFromFile() {
  if (fs.existsSync(cachePath)) {
    try {
      const raw = fs.readFileSync(cachePath, "utf-8");
      const parsed = JSON.parse(raw);
      Object.assign(memoryCache, parsed);
      console.log("📂 Cache loaded from file");
    } catch (err) {
      console.warn("⚠️ Failed to parse cache file, starting fresh.");
    }
  }
}

function saveCacheToFile() {
  try {
    if (!cacheDirty) return;
    fs.writeFileSync(cachePath, JSON.stringify(memoryCache, null, 2), "utf-8");
    console.log("💾 Saved cache to file");
    cacheDirty = false;
  } catch (err) {
    console.error("❌ Failed to save cache file:", err.message);
  }
}

async function getSpecificTab(season, tabName) {
  if (!memoryCache[season]) memoryCache[season] = {};

  if (Object.prototype.hasOwnProperty.call(memoryCache[season], tabName)) {
    return memoryCache[season][tabName];
  }

  const base = sheetApis[season];
  if (!base) return [];

  const url = `${base}?tabId=${encodeURIComponent(tabName)}`;
  try {
    const res = await axios.get(url);
    const rows = res.data?.data || [];

    memoryCache[season][tabName] = rows;
    cacheDirty = true;

    console.log(`✅ '${tabName}' (${season}) — ${rows.length} rows`);
    return rows;
  } catch (err) {
    const code = err?.response?.status || err.message;
    console.log(`⚠️ '${tabName}' (${season}) failed: ${code}`);
    memoryCache[season][tabName] = [];
    cacheDirty = true;
    return [];
  }
}

async function getNoDrawData(season) {
  const tab10 = `CleanNoDraw_6plus_Detailed_${season}_Gap10`;
  const tab8 = `CleanNoDraw_6plus_Detailed_${season}_Gap8`;

  const rows10 = await getSpecificTab(season, tab10);
  if (rows10.length > 0) return rows10;

  const rows8 = await getSpecificTab(season, tab8);
  return rows8;
}

async function loadSeasonData(season) {
  try {
    const [gap10, gap8, promoReleg, flexible] = await Promise.all([
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap10`),
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap8`),
      getSpecificTab(season, `PromoReleg_${season}`),
      getSpecificTab(season, `Flexible_CleanStreaks_11_Unique_${season}`),
    ]);

    const seasonData = { season, gap10, gap8, promoReleg, flexible };
    if (!memoryCache[season]) memoryCache[season] = {};
    memoryCache[season]._combined = seasonData;
    cacheDirty = true;
    saveCacheToFile();

    console.log(`✅ Successfully refreshed season ${season}`);
    failedSeasons.delete(season);
    return seasonData;
  } catch (err) {
    console.error(`❌ Load failed for ${season}: ${err.message}`);
    failedSeasons.add(season);
    return null;
  }
}

async function getAllDataCombined() {
  const seasons = Object.keys(sheetApis);
  for (const season of seasons) {
    const has = memoryCache[season]?.["_combined"];
    if (!has || failedSeasons.has(season)) {
      await loadSeasonData(season);
    }
  }
  saveCacheToFile();
  return Object.values(memoryCache)
    .map((s) => s._combined)
    .filter(Boolean);
}

async function getTabAcrossSeasons(tabTemplate) {
  const results = [];
  for (const season of Object.keys(sheetApis)) {
    const tabName = tabTemplate.replace("{{season}}", season);
    const rows = await getSpecificTab(season, tabName);
    results.push({ season, tab: tabName, rows });
  }
  saveCacheToFile();
  return results;
}

loadCacheFromFile();

module.exports = {
  getAllDataCombined,
  loadSeasonData,
  getTabAcrossSeasons,
  getSpecificTab,
  memoryCache,
  saveCacheToFile,
};