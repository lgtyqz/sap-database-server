const express = require('express');
const multer = require("multer");
const sqlite3 = require('sqlite3');

const app = express();
const server = require("http").createServer(app);

app.use(multer().none());
app.use(express.json());

const STD_PORT_NUMBER = 3000;

const MSG_SERVER_ERROR = 500;
const MSG_BAD_REQUEST = 400;

const WIN_OUTCOME_CODE = 1;
const LOSS_OUTCOME_CODE = 2;

const db = new sqlite3.Database("boards.db");

const GAME_HISTORY_SCHEMA = [
  "Actions",
  "CreatedOn",
  "GenesisBuildModel",
  "GenesisModeModel",
  "LastTurn",
  "MatchId",
  "Mode",
  "Outcome",
  "ParticipationId",
  "UserId",
  "UserName",
  "Version"
];

db.run(`
  CREATE TABLE IF NOT EXISTS "boards" (
    game_version  INTEGER,
    match_id  TEXT,
    fight_outcome INTEGER,
    player_id TEXT,
    player_name TEXT,
    player_board  TEXT,
    turn_number INTEGER,
    UNIQUE(player_id, player_board, match_id, game_version)
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS "games" (
    game_version INTEGER,
    match_id	TEXT,
    player1_win INTEGER,
    player1_name  TEXT,
    player2_name  TEXT,
    player1_elo INTEGER,
    player2_elo INTEGER,
    player1_id TEXT,
    player2_id TEXT,
    UNIQUE(match_id, game_version)
  );
`);

function checkSchema(json){
  for(let i = 0; i < GAME_HISTORY_SCHEMA.length; i++){
    if(!(GAME_HISTORY_SCHEMA[i] in json)){
      return false;
    }
  }
  return true;
}

function winOrLose(outcomeCode){
  if(outcomeCode === WIN_OUTCOME_CODE){
    return 1;
  }else{
    return 0;
  }
}

function flipOutcome(outcomeCode){
  switch(outcomeCode){
    case WIN_OUTCOME_CODE:
      return LOSS_OUTCOME_CODE;
    case LOSS_OUTCOME_CODE:
      return WIN_OUTCOME_CODE;
  }
  // Ties?
  return outcomeCode;
}

app.post("/upload-games", (req, res) => {
  // Check whether request body has the proper format
  if(checkSchema(req.body)){
    let playersInfo = JSON.parse(req.body["GenesisModeModel"]);
    // Store in boards & games
    db.run(`
      INSERT INTO "games" (
        game_version,
        match_id,
        player1_win,
        player1_name,
        player2_name,
        player1_elo,
        player2_elo,
        player1_id,
        player2_id
      ) VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      ) 
    `, [
      req.body["Version"],
      req.body["MatchId"],
      winOrLose(req.body["Outcome"]),
      req.body["UserName"],
      playersInfo["Opponents"][0]["DisplayName"],
      playersInfo["Rank"],
      playersInfo["Opponents"][0]["Rank"],
      req.body["UserId"],
      playersInfo["Opponents"][0]["UserId"]
    ]);
    let actionsList = req.body["Actions"];
    for(let i = 0; i < actionsList.length; i++){
      if(actionsList[i]["Type"] === 0){
        let battleJSON = JSON.stringify(actionsList[i]["Battle"]);
        // Player Board
        db.run(`
          INSERT INTO "boards" (
            game_version,
            match_id,
            fight_outcome,
            player_id,
            player_name,
            player_board,
            turn_number
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
          )
        `, [
          req.body["Version"],
          req.body["MatchId"],
          battleJSON["Outcome"],
          req.body["UserId"],
          req.body["UserName"],
          battleJSON["PlayerBoard"],
          actionsList[i]["Turn"]
        ]);

        // Opponent Board
        db.run(`
          INSERT INTO "boards" (
            game_version,
            match_id,
            fight_outcome,
            player_id,
            player_name,
            player_board,
            turn_number
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
          )
        `, [
          req.body["Version"],
          req.body["MatchId"],
          flipOutcome(battleJSON["Outcome"]),
          playersInfo["Opponents"][0]["UserId"],
          playersInfo["Opponents"][0]["DisplayName"],
          battleJSON["OpponentBoard"],
          actionsList[i]["Turn"]
        ]);
      }
    }
  }
});

app.get("/pet-stats", (req, res) => {

});

// Download entire database
app.get("/download", (req, res) => {
  const file = `${__dirname}/boards.db`;
  res.download(file);
});

server.listen(STD_PORT_NUMBER, () => {
  console.log('listening on *:' + STD_PORT_NUMBER);
});