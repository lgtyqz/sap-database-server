const WIN_OUTCOME_CODE = 1;
const LOSS_OUTCOME_CODE = 2;

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

async function initializeDBTables(db){
  await db.run(`
    CREATE TABLE IF NOT EXISTS "boards" (
      game_version  INTEGER NOT NULL,
      match_id  TEXT NOT NULL,
      fight_outcome INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      player_board  TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      UNIQUE(player_id, player_board, match_id, game_version)
    );
  `);
  
  await db.run(`
    CREATE TABLE IF NOT EXISTS "games" (
      game_version INTEGER NOT NULL,
      match_id	TEXT NOT NULL,
      player1_win INTEGER NOT NULL,
      player1_name  TEXT NOT NULL,
      player2_name  TEXT NOT NULL,
      player1_elo INTEGER NOT NULL,
      player2_elo INTEGER NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      UNIQUE(match_id, game_version)
    );
  `);
}

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
  }
  return 0;
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

async function writeGameToDB(gameJSON, db){
  if(checkSchema(gameJSON)){
    let playersInfo = JSON.parse(gameJSON["GenesisModeModel"]);
    // Store in boards & games
    await db.run(`
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
      );
    `, [
      gameJSON["Version"],
      gameJSON["MatchId"],
      winOrLose(gameJSON["Outcome"]),
      gameJSON["UserName"],
      playersInfo["Opponents"][0]["DisplayName"],
      playersInfo["Rank"],
      playersInfo["Opponents"][0]["Rank"],
      gameJSON["UserId"],
      playersInfo["Opponents"][0]["UserId"]
    ]);
    let actionsList = gameJSON["Actions"];
    for(let i = 0; i < actionsList.length; i++){
      if(actionsList[i]["Type"] === 0){
        let battleJSON = JSON.parse(actionsList[i]["Battle"]);
        console.log(Object.keys(battleJSON));
        // Player Board
        await db.run(`
          REPLACE INTO "boards" (
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
            ?
          );
        `, [
          gameJSON["Version"],
          gameJSON["MatchId"],
          battleJSON["Outcome"],
          gameJSON["UserId"],
          gameJSON["UserName"],
          JSON.stringify(battleJSON["UserBoard"]),
          actionsList[i]["Turn"]
        ]);

        // Opponent Board
        await db.run(`
          REPLACE INTO "boards" (
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
            ?
          );
        `, [
          gameJSON["Version"],
          gameJSON["MatchId"],
          flipOutcome(battleJSON["Outcome"]),
          playersInfo["Opponents"][0]["UserId"],
          playersInfo["Opponents"][0]["DisplayName"],
          JSON.stringify(battleJSON["OpponentBoard"]),
          actionsList[i]["Turn"]
        ]);
      }
    }
  }
}

module.exports = {initializeDBTables, writeGameToDB}