const express = require("express");
const cors = require("cors");

const {
  getAllDataCombined,
  getTabAcrossSeasons,
  getSpecificTab,
  loadSeasonData,
  memoryCache
} = require("./sheetService");

const app = express();
app.use(cors());

/**
 * טוען את כל הנתונים (cache לזיכרון ודיסק)
 */
app.get("/api/all-data", async (req, res) => {
  try {
    const data = await getAllDataCombined();
    res.json(data);
  } catch (err) {
    console.error("❌ /api/all-data failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * טוען את כל Gap10 מכל העונות
 */
app.get("/api/gap10", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap10");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap10 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * טוען את כל Gap8 מכל העונות
 */
app.get("/api/gap8", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("CleanNoDraw_6plus_Detailed_{{season}}_Gap8");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/gap8 failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * טוען את כל PromoReleg_{{season}} מכל העונות
 */
app.get("/api/promorelegated", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("PromoReleg_{{season}}");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/promorelegated failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * טוען את כל Flexible_CleanStreaks_11_Unique מכל העונות
 */
app.get("/api/flexible", async (req, res) => {
  try {
    const data = await getTabAcrossSeasons("Flexible_CleanStreaks_11_Unique");
    res.json(data);
  } catch (err) {
    console.error("❌ /api/flexible failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * מחזיר את כל ה־cache הנוכחי מהזיכרון (מה שנטען ונשמר)
 */
app.get("/api/cache", (req, res) => {
  res.json(memoryCache);
});

/**
 * מחזיר את ה־cache של עונה ספציפית בלבד
 */
app.get("/api/cache/:season", (req, res) => {
  const season = req.params.season;
  if (memoryCache[season]) {
    res.json(memoryCache[season]);
  } else {
    res.status(404).json({ error: `No cache found for season ${season}` });
  }
});

/**
 * טוען מחדש עונה ספציפית מהמקור (API), גם אם יש cache
 */
app.get("/api/refresh/:season", async (req, res) => {
  const season = req.params.season;
  try {
    const data = await loadSeasonData(season);
    res.json(data || { error: `No data found for season ${season}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh season", details: err.message });
  }
});

// 📡 הפעלת השרת
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
