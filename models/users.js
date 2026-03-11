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

// Insert a new user
async function createUser(username, password, level) {
  await db.run(
    "INSERT INTO Users VALUES (?,?,?)",
    [username, password, level]
  );
}

module.exports = { getUserByUsername, createUser };