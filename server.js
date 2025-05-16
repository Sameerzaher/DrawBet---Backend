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

// ✅ הפעלת CORS — גישה מ־frontend (onrender)
app.use(cors({
  origin: "*", // אפשר להחליף ל־"https://drawbet-frontend.onrender.com"
  methods: ["GET", "POST"],
}));

app.use(express.json());

// ✅ כל הטאבים לפי עונות:
app.get("/api/gap10", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap10");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap10 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/gap8", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap8");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap8 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/flexible11", async (req, res) => {
  try {
    // תבנית קבועה ללא עונות
    const data = await getTabAcrossSeasons("Flexible_CleanStreaks_11_Unique");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/flexible11 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/promorelegated", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("PromoReleg_{{season}}");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/promorelegated failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ שליפה של כל העונות המאוחדות
app.get("/api/all-data", async (req, res) => {
  try {
    const data = await getAllDataCombined();
    res.json(data);
  } catch (err) {
    console.error("❌ /api/all-data failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Cache נוכחי (כללי)
app.get("/api/cache", (req, res) => {
  res.json(memoryCache);
});

// ✅ Cache לפי עונה
app.get("/api/cache/:season", (req, res) => {
  const season = req.params.season;
  if (memoryCache[season]) {
    res.json(memoryCache[season]);
  } else {
    res.status(404).json({ error: `No cache found for season ${season}` });
  }
});

// ✅ רענון עונה מסוימת
app.post("/api/refresh/:season", async (req, res) => {
  const season = req.params.season;
  try {
    delete memoryCache[season];
    const data = await loadSeasonData(season);
    if (data) {
      saveCacheToFile();
      res.json({ success: true, season, data });
    } else {
      res.status(404).json({ success: false, message: `No data for ${season}` });
    }
  } catch (err) {
    console.error(`❌ Refresh failed for ${season}:`, err.message);
    res.status(500).json({ error: "Failed to refresh season" });
  }
});

// ✅ רענון כללי לכל העונות
app.post("/api/refresh-all", async (req, res) => {
  try {
    const seasons = Object.keys(memoryCache);
    for (const season of seasons) {
      await loadSeasonData(season);
    }
    saveCacheToFile();
    res.json({ success: true, message: "All seasons refreshed." });
  } catch (err) {
    console.error("❌ Refresh-all failed:", err.message);
    res.status(500).json({ error: "Failed to refresh all" });
  }
});

// ✅ Unified tab loader per season
app.get("/api/all-tabs/:season", async (req, res) => {
  const season = req.params.season;
  try {
    const [gap10, gap8, flexible, promo] = await Promise.all([
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap10`),
      getSpecificTab(season, `CleanNoDraw_6plus_Detailed_${season}_Gap8`),
      getSpecificTab(season, `Flexible_CleanStreaks_11_Unique_${season}`),
      getSpecificTab(season, `PromoReleg_${season}`),
    ]);

    res.json({ season, gap10, gap8, flexible, promoRelegated: promo });
  } catch (err) {
    console.error(`❌ Failed all-tabs for ${season}:`, err.message);
    res.status(500).json({ error: "Failed to load tabs" });
  }
});

// ✅ התחלת השרת
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
