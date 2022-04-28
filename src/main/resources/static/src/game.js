const stopButton = document.getElementById("stopButton");
const statusButton = document.getElementById("statusButton")
let current = "";
let destination = "";
let roomName = "";
let roomId = "";
const horizontalId = ["a", "b", "c", "d", "e", "f", "g", "h"]
const verticalId = ["1", "2", "3", "4", "5", "6", "7", "8"]

window.onload = async function () {
    let chessMap = await loadGame();
    await setChessMap(chessMap)
}

statusButton.addEventListener("click", async function () {
    await getStatus();
});

stopButton.addEventListener("click", async function () {
    if (!confirm("방을 삭제하시겠습니까?")) {
        await finish();
    } else {
        await deleteAndFinish();
    }
    location.href = "/";
});

async function loadGame() {
    let response = await fetch("/game/load", {
        method: "GET"
    }).then(handleErrors)
        .catch(function (error) {
            alert(error.message);
        })
    response = await response.json();
    document.getElementById("turnInfo").innerHTML = "현재 턴: "
        + response.turn;

    roomId = response.roomId;
    roomName = response.roomName;
    document.getElementById("roomInfo").innerHTML = "♟️ "+ roomName + "체스 게임"
    return response.chessMap;
}

async function getStatus() {
    console.log(roomId)
    let status = await fetch("/status/" + roomId, {
        method: "GET"
    }).then(handleErrors)
        .catch(function (error) {
            alert(error.message);
        });
    status = await status.json();

    const whitePlayerScore = status.whitePlayerScore;
    const blackPlayerScore = status.blackPlayerScore;
    const whitePlayerResult = status.whitePlayerResult;
    const blackPlayerResult = status.blackPlayerResult;

    const result = "[White 팀] <br> 점수 : " + whitePlayerScore + "<br> 결과 : "
        + whitePlayerResult
        + "<br><br>[Black 팀] <br> 점수 : " + blackPlayerScore + "<br> 결과 : "
        + blackPlayerResult;

    alert("현재 점수를 표시합니다.");

    document.getElementById("score").innerHTML = result;
}

async function finish() {
    alert("방을 유지한채 게임이 종료되었습니다.");
    removeAllPieces();
}

async function deleteAndFinish() {
    await fetch("/game/" + roomId, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
    })
    alert("방이 삭제됐습니다.");
    removeAllPieces();
}

function removeAllPieces() {
    for (const horizontal of horizontalId) {
        for (const vertical of verticalId) {
            let pointId = document.getElementById(horizontal + vertical);
            if (pointId.hasChildNodes()) {
                pointId.removeChild(pointId.firstChild);
            }
        }
    }
}

function clickPiece(pieceId) {
    if (current === "") {
        current = pieceId;
        return;
    }
    if (current !== "" && destination === "") {
        destination = pieceId;
        movePiece(current, destination);
        current = "";
        destination = "";
    }
}

async function movePiece(current, destination) {
    let board = await requestMovePiece(current, destination);
    await setChessMap(board);
}

async function requestMovePiece(current, destination) {
    let boardAndTurnInfo = await fetch("/move", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            roomId: roomId,
            current: current,
            destination: destination,
        }),
    }).then(handleErrors)
        .catch(function (error) {
            alert(error.message);
        });
    boardAndTurnInfo = await boardAndTurnInfo.json();
    let isRunning = boardAndTurnInfo.running;
    if (isRunning !== true) {
        alert("킹이 죽어 게임이 종료됩니다.");
    }
    document.getElementById("turnInfo").innerHTML = "현재 턴: "
        + boardAndTurnInfo.turn;
    document.getElementById("score").innerHTML = "";
    return boardAndTurnInfo.chessMap;
}

async function handleErrors(response) {
    if (!response.ok) {
        let errorMessage = await response.json();
        throw Error(errorMessage.message);
    }
    return response;
}

function setChessMap(chessMap) {
    for (let file = 0; file < 8; file++) {
        for (let rank = 1; rank <= 8; rank++) {
            const eachDiv = document.getElementById(toFileName(file) + rank);
            let mapValue = chessMap[8 - rank][file];
            if (eachDiv.hasChildNodes()) {
                eachDiv.removeChild(eachDiv.firstChild);
            }
            if (mapValue === ".") {
                continue;
            }
            const img = document.createElement("img");
            img.src = "/images/pieces/" + toPieceImageName(mapValue) + ".svg";
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.display = 'block';
            img.style.margin = '15px auto';
            eachDiv.appendChild(img);
        }
    }
}

function toFileName(file) {
    const fileNames = new Map([
        [0, "a"], [1, "b"], [2, "c"], [3, "d"], [4, "e"], [5, "f"], [6, "g"],
        [7, "h"]
    ]);
    return fileNames.get(file);
}

function toPieceImageName(mapValue) {
    const imageNames = new Map([
        ["P", "black-pawn"], ["R", "black-rook"], ["N", "black-knight"],
        ["B", "black-bishop"],
        ["Q", "black-queen"], ["K", "black-king"], ["p", "white-pawn"],
        ["r", "white-rook"],
        ["n", "white-knight"], ["b", "white-bishop"], ["q", "white-queen"],
        ["k", "white-king"]
    ]);
    return imageNames.get(mapValue);
}
