const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { getSheetData } = require("./getSheetData");

const app = express();
app.use(cors());

// קבצי גיליונות עם עונות
const spreadsheets = [
  { year: 2017, id: "196rGmls6sXYgO4OGejrbGMfGCkbSbXa6_qiY_i79ctY", league: "Spain" },
  { year: 2018, id: "1h3KmAWIZ-40vzc-Aj9rjR7uaqpAAIRarXVmsiV7Vfkk", league: "Spain" },
  { year: 2019, id: "1Aj8QjN9R7xbWc5QhQW2HWOlv-b0NPbrHjamY5eIsd1M", league: "Spain" },
  { year: 2020, id: "1kB5kO0nreDJjvyuYv7c6X_6xUb53TJP2gAay_OBbcrg", league: "Spain" },
  { year: 2021, id: "105m34i4f0PWKi1MoVY9nLVwJ5IZj2FBwRXSXx44MeOc", league: "Spain" },
  { year: 2022, id: "1MY3-7S76Tl2OF_QPF8RGOFjfZOimhB1uCo3Ewi1dK3w", league: "Spain" },
  { year: 2023, id: "1KwufAQhH0pqW9IouHpIGbOWv2rsObl0mJqUsLTuXqVw", league: "Spain" },
  { year: 2024, id: "1_ieatBSiE9_EbjINoBGlNu9QHQT940WnWXlVYDWFXUY", league: "Spain" },
];

const gapVersions = ["Gap8", "Gap10"];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTeamName(team, league) {
  if (!team || !league) return team;
  return team.startsWith(league + " ") ? team.replace(`${league} `, "") : team;
}

// ✅ API ראשי – טוען נתוני רצפים מגיליונות Google Sheets
app.get("/api/activity", async (req, res) => {
  const allData = [];
  let globalHeader = null;
  const successSheets = [];
  const failedSheets = [];
  let count = 0;

  for (const { year, id, league } of spreadsheets) {
    for (const gap of gapVersions) {
      const sheetName = `CleanNoDraw_6plus_Detailed_${year}_${gap}`;
      const range = `${sheetName}!A1:Z1000`;
      count++;

      try {
        console.log(`📤 (${count}) Fetching: ${sheetName}`);
        await sleep(3000); // חשוב: להפחית סיכוי ל־quota

        const data = await getSheetData(id, range);
        if (data.length > 1) {
          if (!globalHeader) {
            globalHeader = data[0];
            console.log("🧾 Headers loaded.");
          }

          const teamIndex = globalHeader.findIndex(h =>
            h?.toString().trim().toLowerCase() === "team"
          );

          const rows = data.slice(1);
          const cleaned = rows.map(row => {
            const newRow = [...row];
            if (teamIndex !== -1 && row[teamIndex]) {
              newRow[teamIndex] = cleanTeamName(row[teamIndex], league);
            }
            return [year.toString(), gap, league, ...newRow];
          });

          allData.push(...cleaned);
          successSheets.push(sheetName);
          console.log(`✅ Loaded: ${sheetName} (${cleaned.length} rows)`);
        } else {
          failedSheets.push(sheetName);
          console.warn(`⚠️ No data in: ${sheetName}`);
        }

      } catch (err) {
        failedSheets.push(sheetName);
        console.error(`❌ Error loading ${sheetName}: ${err.message}`);
      }
    }
  }

  const finalData = globalHeader
    ? [["Year", "Gap", "League", ...globalHeader], ...allData]
    : [];

  console.log(`\n📊 Summary:`);
  console.log(`✅ Success (${successSheets.length}):`, successSheets);
  console.log(`❌ Failed  (${failedSheets.length}):`, failedSheets);
  console.log(`📦 Total rows: ${allData.length}`);

  res.json(finalData);
});

// ✅ קריאה לנתוני קבוצות שעלו/ירדו – מקובץ cache מקומי
app.get("/api/promorelegated", (req, res) => {
  const filePath = path.join(__dirname, "cache/promorelegated.json");

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    console.log("📂 Loaded from cache/promorelegated.json");
    res.json(json);
  } else {
    console.warn("⚠️ promorelegated.json not found");
    res.status(500).send("❌ No cached data found. Run cachePromorelegated.js");
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
