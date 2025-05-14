const { google } = require("googleapis");
const keys = require("./credentials.json"); // ודא שהקובץ הזה קיים בתיקייה

const auth = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth });

/**
 * קורא טווח מגיליון בגוגל שיטס
 */
async function getSheetData(spreadsheetId, range, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return res.data.values || [];

    } catch (err) {
      const isQuota = err.message.includes("Quota exceeded") || err.code === 429;

      if (attempt < maxRetries && isQuota) {
        const waitMs = attempt * 1500;
        console.warn(`🔁 Quota limit – retrying in ${waitMs / 1000}s... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } else {
        throw err; // ייכשל סופית
      }
    }
  }
}

module.exports = { getSheetData };
