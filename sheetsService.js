const fs = require("fs");
const path = require("path");
const { getSheetData } = require("./getSheetData");

// קישורי גליונות לפי שנה
const spreadsheets = [
  { year: 2017, id: "196rGmls6sXYgO4OGejrbGMfGCkbSbXa6_qiY_i79ctY" },
  { year: 2018, id: "1h3KmAWIZ-40vzc-Aj9rjR7uaqpAAIRarXVmsiV7Vfkk" },
  { year: 2019, id: "1Aj8QjN9R7xbWc5QhQW2HWOlv-b0NPbrHjamY5eIsd1M" },
  { year: 2020, id: "1kB5kO0nreDJjvyuYv7c6X_6xUb53TJP2gAay_OBbcrg" },
  { year: 2021, id: "105m34i4f0PWKi1MoVY9nLVwJ5IZj2FBwRXSXx44MeOc" },
  { year: 2022, id: "1MY3-7S76Tl2OF_QPF8RGOFjfZOimhB1uCo3Ewi1dK3w" },
  { year: 2023, id: "1KwufAQhH0pqW9IouHpIGbOWv2rsObl0mJqUsLTuXqVw" },
  { year: 2024, id: "1_ieatBSiE9_EbjINoBGlNu9QHQT940WnWXlVYDWFXUY" },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ⛏️ שליפה ישירה מ־Google Sheets
async function getAllPromoRelegatedTeams() {
  const promoted = [];
  const relegated = [];

  for (const { year, id } of spreadsheets) {
    const sheetName = `PromoReleg_${year}`;
    const range = `${sheetName}!A2:C`;

    try {
      console.log(`📥 Loading ${sheetName}...`);
      await sleep(1500);

      const rows = await getSheetData(id, range);
      for (const row of rows) {
        const promotedList = row[1]?.split(",").map(t => t.trim()) || [];
        const relegatedList = row[2]?.split(",").map(t => t.trim()) || [];

        promotedList.forEach(team => {
          if (team) promoted.push({ year, team });
        });

        relegatedList.forEach(team => {
          if (team) relegated.push({ year, team });
        });
      }
    } catch (err) {
      console.warn(`⚠️ Failed to load ${sheetName}: ${err.message}`);
    }
  }

  return { promoted, relegated };
}

// 📂 גרסה שמטענת מקובץ אם קיים, אחרת טוענת ושומרת
async function getAllPromoRelegatedTeamsCached() {
  const cachePath = path.join(__dirname, "cache", "promorelegated.json");

  if (fs.existsSync(cachePath)) {
    console.log("📂 Loaded from cache/promorelegated.json");
    const raw = fs.readFileSync(cachePath, "utf8");
    return JSON.parse(raw);
  }

  console.log("🚀 Cache not found – loading from Google Sheets...");
  const result = await getAllPromoRelegatedTeams();

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));
  console.log("✅ Saved new cache to:", cachePath);

  return result;
}

module.exports = {
  getAllPromoRelegatedTeams,
  getAllPromoRelegatedTeamsCached,
};
