const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");

let db;

// Users table helper
async function init() {
  try {
    db = await sqlite.open({
      filename: "database.db",
      driver: sqlite3.Database
    });
  } catch (err) {
    console.error(err);
  }
}

init();

async function getUserByUsername(username) {
  const row = await db.get(
    "SELECT username, password, level FROM Users WHERE username=?",
    [username]
  );
  return row;
}

module.exports = { getUserByUsername };