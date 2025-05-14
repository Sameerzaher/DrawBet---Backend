const fs = require("fs");
const path = require("path");
const { getAllPromoRelegatedTeams } = require("../sheetsService");

async function cachePromoRelegated() {
  console.log("📥 Fetching promoted + relegated teams from Google Sheets...");

  try {
    const result = await getAllPromoRelegatedTeams();

    const cacheDir = path.join(__dirname, "../cache");
    const filePath = path.join(cacheDir, "promorelegated.json");

    // צור את התיקייה אם לא קיימת
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
      console.log(`📁 Created cache folder: ${cacheDir}`);
    }

    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(`✅ Saved to ${filePath}`);
  } catch (err) {
    console.error("❌ Failed to cache data:", err.message);
  }
}

cachePromoRelegated();
