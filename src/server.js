const express = require('express');
const cors = require('cors');
const multer = require("multer");
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const {initializeDBTables, writeGameToDB} = require('./db-utils');

const app = express();
const server = require("http").createServer(app);

app.use(multer().none());
app.use(express.json({limit: "1mb"}));

app.use(cors());

const STD_PORT_NUMBER = 3000;

const MSG_SERVER_ERROR = 500;
const MSG_BAD_REQUEST = 400;

const DATABASE_FILENAME = 'boards.db';
const DATABASE_PATH = `./${DATABASE_FILENAME}`;

let db;

open({
  filename: DATABASE_PATH,
  driver: sqlite3.Database
}).then((DB) => {
  db = DB;
  initializeDBTables(db);
});

app.post("/uploadGames", async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  // Check whether request body has the proper format
  try {
    const db = await open({
      filename: DATABASE_PATH,
      driver: sqlite3.Database
    });
    await writeGameToDB(req.body, db);
    await db.close();
    res.status(200).send();
  }catch(e){
    console.log(e);
    res.status(500).send("A server error has occurred.");
  }
});

app.get("/pet-stats", (req, res) => {

});

// Download entire database
app.get("/download", (req, res) => {
  const file = `${__dirname}/../${DATABASE_FILENAME}`;
  res.download(file);
});

server.listen(STD_PORT_NUMBER, () => {
  console.log('listening on *:' + STD_PORT_NUMBER);
});