const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const {unlink, unlinkSync, existsSync} = require('fs');
const ValidGame = require('./res/valid-game.json');
const { writeGameToDB, initializeDBTables } = require('../src/db-utils');

console.log(ValidGame);

const TEST_DATABASE_PATH = "./test-boards.db";

// Start by deleting test db
if(existsSync(TEST_DATABASE_PATH)){
  unlinkSync(TEST_DATABASE_PATH);
}

test("Database initalization error-free", async () => {
  const db = await open({
    filename: TEST_DATABASE_PATH,
    driver: sqlite3.Database
  });
  await initializeDBTables(db);
  await db.close();
});

test("Database write doesn't have errors", async () => {
  const db = await open({
    filename: TEST_DATABASE_PATH,
    driver: sqlite3.Database
  });
  await writeGameToDB(ValidGame, db);
  await db.close();
});