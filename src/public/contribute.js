const CURRENT_VERSION = 37;

const STATUS_OK = 200;

// Ok I bought a domain lmao

function switchForms(){
  if(document.getElementById("token-form").classList.contains("hidden")){
    document.getElementById("switch-input-mode").innerText = "Or, enter your login information";
    document.getElementById("submit-button").onclick = () => {uploadWithToken()};
  }else{
    document.getElementById("switch-input-mode").innerText = "Or, get your auth token manually";
    document.getElementById("submit-button").onclick = () => {uploadWithLogin()};
  }
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("token-form").classList.toggle("hidden");
}

async function uploadWithLogin(){
  console.log("Started");
  document.getElementById("submit-button").disabled = true;
  document.getElementById("submit-button").innerText = "Uploading...";
  let rawAuthToken = await getAuthToken();
  if(rawAuthToken !== null){
    let authToken = `Bearer ${rawAuthToken}`;
    let fullHistory = await fetchHistory(authToken);
    await fetchAndUploadAllGames(authToken, fullHistory);
  }
  document.getElementById("submit-button").disabled = false;
  document.getElementById("submit-button").innerText = "Upload Complete!";
  setTimeout(() => {
    document.getElementById("submit-button").innerText = "Upload!";
  }, 2000);
}

async function uploadWithToken(){
  console.log("Started");
  document.getElementById("submit-button").disabled = true;
  document.getElementById("submit-button").innerText = "Uploading...";
  let rawAuthToken = document.getElementById("auth-token").value;
  if(rawAuthToken !== null){
    let authToken = `Bearer ${rawAuthToken}`;
    let fullHistory = await fetchHistory(authToken);
    await fetchAndUploadAllGames(authToken, fullHistory);
  }
  document.getElementById("submit-button").disabled = false;
  document.getElementById("submit-button").innerText = "Upload Complete!";
  setTimeout(() => {
    document.getElementById("submit-button").innerText = "Upload!";
  }, 2000);
}

async function getAuthToken(){
  let email = document.getElementById("user-email").value;
  let password = document.getElementById("user-password").value;
  let response = await fetch(`https://api.teamwood.games/0.${CURRENT_VERSION}/api/user/login`, {
    method: "POST",
    body: JSON.stringify({"Email": email, "Password": password, "Version": CURRENT_VERSION}),
    headers: {
      "Content-Type": "application/json; utf-8",
      "authority": "api.teamwood.games"
    }
  });
  if(response.status === STATUS_OK){
    let responseJSON = await response.json();

    let authToken = responseJSON["Token"];
    console.log(authToken);

    return authToken;
  }else{
    alert("Login credentials invalid. Please try again.");
    return null;
  }
}

async function fetchHistory(authToken){
  let response = await fetch(`https://api.teamwood.games/0.${CURRENT_VERSION}/api/history/fetch`, {
    method: "GET",
    headers: {
      "authorization": authToken,
      "authority": "api.teamwood.games"
    }
  });
  let responseJSON = await response.json();
  return responseJSON["History"];
}

async function fetchAndUploadAllGames(authToken, fullHistory){
  for(let i = 0; i < fullHistory.length; i++){
    document.getElementById("submit-button").innerText = `Uploading ${i + 1}/${fullHistory.length} games...`;
    // Check: Is this vs?
    if(fullHistory[i]["Mode"] === 0){
      await fetchAndUploadGame(authToken, fullHistory[i]["Id"]);
    }
  }
}

async function fetchAndUploadGame(authToken, gameID){
  console.log(gameID);
  let response = await fetch(`https://api.teamwood.games/0.${CURRENT_VERSION}/api/playback/history`, {
    method: "POST",
    body: JSON.stringify({"HistoryId": gameID, "Version": CURRENT_VERSION}),
    headers: {
      "authorization": authToken,
      "authority": "api.teamwood.games",
      "Content-Type": "application/json; utf-8"
    }
  });
  let responseJSON = await response.json();
  responseJSON["Version"] = CURRENT_VERSION;
  console.log(responseJSON);
  // POST to server
  let uploadResponse = await fetch(`uploadGames`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(responseJSON)
  });
  console.log(uploadResponse.status);
}