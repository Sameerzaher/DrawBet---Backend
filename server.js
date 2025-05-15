const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  getAllDataCombined,
  getTabAcrossSeasons,
  getSpecificTab,
  loadSeasonData,
  memoryCache,
  saveCacheToFile,
} = require("./sheetService");

const app = express();
app.use(cors());
app.use(express.json());

// Load all data across all seasons
app.get("/api/all-data", async (req, res) => {
  try {
    const data = await getAllDataCombined();
    res.json(data);
  } catch (err) {
    console.error("❌ /api/all-data failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Gap10 tab per season
app.get("/api/gap10", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap10");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap10 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Gap8 tab per season
app.get("/api/gap8", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap8");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap8 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Flexible tab per season
app.get("/api/flexible11", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("Flexible_CleanStreaks_11_Unique");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/flexible11 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Promoted/relegated teams per season
app.get("/api/promorelegated", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("PromoReleg_{{season}}");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/promorelegated failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get cache for all
app.get("/api/cache", (req, res) => {
  res.json(memoryCache);
});

// Get cache for specific season
app.get("/api/cache/:season", (req, res) => {
  const season = req.params.season;
  if (memoryCache[season]) {
    res.json(memoryCache[season]);
  } else {
    res.status(404).json({ error: `No cache found for season ${season}` });
  }
});

// Refresh specific season
app.post("/api/refresh/:season", async (req, res) => {
  const season = req.params.season;
  console.log(`🔄 Request to refresh season ${season}`);
  try {
    delete memoryCache[season];
    const data = await loadSeasonData(season);
    if (data) {
      console.log(`✅ Successfully refreshed season ${season}`);
      saveCacheToFile();
      res.json({ success: true, season, message: `Refreshed ${season}`, data });
    } else {
      res.status(404).json({ success: false, message: `No data for ${season}` });
    }
  } catch (err) {
    console.error(`❌ Failed to refresh season ${season}:`, err);
    res.status(500).json({ error: "Failed to refresh season", details: err.message });
  }
});

// Refresh ALL seasons
app.post("/api/refresh-all", async (req, res) => {
  const seasons = Object.keys(memoryCache);
  try {
    for (const season of seasons) {
      await loadSeasonData(season);
    }
    saveCacheToFile();
    res.json({ success: true, message: "All seasons refreshed." });
  } catch (err) {
    console.error("❌ Failed to refresh all:", err);
    res.status(500).json({ error: "Failed to refresh all", details: err.message });
  }
});

// Unified tab loader per season
app.get("/api/all-tabs/:season", async (req, res) => {
  const season = req.params.season;
  try {
    const [gap10, gap8, flexible, promo] = await Promise.all([
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap10`),
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap8`),
      getSpecificTab(season, `Flexible_CleanStreaks_11_Unique`),
      getSpecificTab(season, `PromoReleg_${season}`),
    ]);

    res.json({ season, gap10, gap8, flexible, promoRelegated: promo });
  } catch (err) {
    console.error(`❌ /api/all-tabs/${season} failed:`, err);
    res.status(500).json({ error: "Failed to load all tabs for season" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
