let faceapi;
let faceapi2;
let video;
let detections;
let detections2;
let capture;
let theirVideo;
let detections_list_me = [];
let fukkin_ct_me = 0;
let detections_list_you = [];
let fukkin_ct_you = 0;
var conn;
let score_end;
let start_check = false;

// by default all options are set to true
const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
};

function setup() {
    canvas = createCanvas(1280, 960);
    canvas.parent("p5-canvas-wrapper");

    // load up your video
    capture = createCapture({video: {width: 640, height: 960}, audio: false});
    //video.size(width, height);
    // video.hide(); // Hide the video element, and just show the canvas
    capture.hide(); // ビデオを消した
    faceapi = ml5.faceApi(capture, detection_options, modelReady);
    textAlign(RIGHT);

    // skywayのインスタンスを作成
    let peer = new Peer({
        key: "a3dadfd7-94d5-466e-92fb-84bba5f87981",
    });
    // skywayでドメインを許可していれば実行される
    peer.on("open", () => {
        console.log("open! id=" + peer.id);
        createP("Your id: " + peer.id);
    });

    // id入力タグの生成
    let idInput = createInput("");

    // 送信ボタンの生成
    createButton("Call").mousePressed(() => {
        // ボタンが押されたら
        fukkin_ct_me = 0;
        fukkin_ct_you = 0;
        const callId = idInput.value(); //id入力欄の値を取得
        console.log("call! id=" + peer.id);
        const call = peer.call(callId, capture.elt.srcObject); //id先を呼び出し
        addVideo(call);
    });

    // // 相手から呼び出された実行される
    peer.on("call", (call) => {
        fukkin_ct_me = 0;
        fukkin_ct_you = 0;
        console.log("be called!");
        call.answer(capture.elt.srcObject); //呼び出し相手に対して返す
        addVideo(call);
    });
    // 相手からデータ通信の接続要求イベントが来た場合、このconnectionイベントが呼ばれる
    // - 渡されるconnectionオブジェクトを操作することで、データ通信が可能
    peer.on("connection", function (connection) {
        // データ通信用に connectionオブジェクトを保存しておく
        conn = connection;

        // 接続が完了した場合のイベントの設定
        // conn.on("open", function() {
        //     // 相手のIDを表示する
        //     // - 相手のIDはconnectionオブジェクトのidプロパティに存在する
        //     $("#peer-id").text(conn.id);
        // });

        // メッセージ受信イベントの設定
        conn.on("data", onRecvMessage);
    });

    function onRecvMessage(data) {
        // 画面に受信したメッセージを表示
        console.log("受け取り回数" + data);
        //$("#messages").append($("<p>").text(conn.id + ": " + data).css("font-weight", "bold"));
    }

    // 相手の映像を追加処理
    function addVideo(call) {
        call.on("stream", (theirStream) => {
            console.log("stream!");
            //相手のビデオを作成
            theirVideo = createVideo();
            theirVideo.elt.autoplay = true;
            theirVideo.elt.srcObject = theirStream;
            theirVideo.hide(); //キャンバスで描くので非表示

            //相手側のビデオ映像に対してfaceAPIをする
            faceapi2 = ml5.faceApi(theirVideo, detection_options, modelReady);
        });
    }
}

function modelReady() {
    console.log("ready!");
    console.log(faceapi);
    console.log(faceapi2);

    faceapi.detect(gotResults);
    if (faceapi2) {
        faceapi2.detect(gotResults2);
    }
}

// 自分の映像用
function gotResults(err, result) {
    if (err) {
        console.log(err);
        return;
    }
    detect_fukkin_me(result);
    // 自分の映像の情報を取得
    detections = result;
    faceapi.detect(gotResults);
}

// 相手の動画用
function gotResults2(err, result) {
    if (err) {
        console.log(err);
        return;
    }
    detect_fukkin_you(result);
    // 相手の映像の情報を取得する
    detections2 = result;

    faceapi2.detect(gotResults2);
}

function draw() {
    background(255);
    // 自分の映像を表示
    if (capture) image(capture, 0, 0, 640, 960);
    // 相手の映像をx軸に640pxずらして表示する
    if (theirVideo) image(theirVideo, 640, 0, 640, 960);

    // 自分の映像に加工を入れる処理
    if (detections) {
        if (detections.length > 0) {
            // 自分の映像の場合は引数で1を渡すことにしてる
            drawLandmarks(detections, 1);
        }
    }

    // 自分の映像に加工を入れる処理
    if (detections2) {
        if (detections2.length > 0) {
            // 相手の映像の場合は引数で2を渡すことにしてる
            drawLandmarks(detections2, 2);
        }
    }
}

// マスクとバーチャルディスタンスのアラート画像の読み込み
// let img;
// let img2;

// function preload() {
//     img = loadImage('mask.png');
//     img2 = loadImage('alert.png');
// }

// 口の位置や目隠しをする処理
// 引数はそれぞれの映像から得られた情報と自分(1)or相手(2)という情報
function drawLandmarks(detections, part) {
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);

    let mouthx = 0;
    let mouthy = 0;
    let lefteye1x, lefteye1y, righteye1x, righteye1y;
    let lefteye2x, lefteye2y, righteye2x, righteye2y;

    for (let i = 0; i < detections.length; i++) {
        const mouth = detections[i].parts.mouth;

        // // 口の重心をとるためにトータルを取得する
        // mouthx = mouthx + detections[i].parts.mouth[0].x;
        // mouthy = mouthy + detections[i].parts.mouth[0].y;

        // ///////// とりあえず目を隠す実装をする。不要なら外す /////////
        // if (part == 1) { // 1なので自分の映像のとき。
        //     // 左目
        //     lefteye1x = detections[i].parts.leftEye[0].x - 50;
        //     lefteye1y = detections[i].parts.leftEye[0].y;
        //     // 右目
        //     righteye1x = detections[i].parts.rightEye[0].x + 50;
        //     righteye1y = detections[i].parts.rightEye[0].y;
        // }

        // //相手がいた時用
        // ///////// とりあえず目を隠す実装をする。不要なら外す /////////
        // if (part == 2) { // 2なので相手の映像のとき
        //     lefteye2x = detections[i].parts.leftEye[0].x - 50 + 640;
        //     lefteye2y = detections[i].parts.leftEye[0].y;
        //     // 右目
        //     righteye2x = detections[i].parts.rightEye[0].x + 50 + 640;
        //     righteye2y = detections[i].parts.rightEye[0].y;
        // }

        // // 口の位置に合わせてマスクを表示する
        // if (part == 1) image(img, detections[i].parts.mouth[0].x - 60, detections[i].parts.mouth[0].y - 60, 200, 170);
        // if (part == 2) image(img, detections[i].parts.mouth[0].x + 580, detections[i].parts.mouth[0].y - 60, 200, 170);

        // // 口の輪郭をかく
        // if (part == 1) drawPart(mouth, true);
        // if (part == 2) drawPart2(mouth, true);
    }

    // それぞれの重心
    const mouth_px = mouthx / detections.length - 50;

    ////////// 目を隠す処理 不要だったら消す//////////
    // eyeline(lefteye1x, lefteye1y, righteye1x, righteye1y);
    // if (theirVideo) eyeline(lefteye2x, lefteye2y, righteye2x, righteye2y);

    // 画面上で相手に近づき過ぎた時に警告する
    //// 今は自分の画面で右端に240px(640-400)より近づいた時に警告を出す。必要に応じて数字は変える
    // if (mouth_px > 400) {
    //     image(img2, 20, 20, 600, 100);
    // }
}

// 口の輪郭をかく処理（自分用）
function drawPart(feature, closed) {
    beginShape();
    for (let i = 0; i < feature.length; i++) {
        const x = feature[i]._x;
        const y = feature[i]._y;
        vertex(x, y);
    }

    if (closed === true) {
        endShape(CLOSE);
    } else {
        endShape();
    }
}

// 口の輪郭をかく処理（相手用）
// function drawPart2(feature, closed) {

//     beginShape();
//     for (let i = 0; i < feature.length; i++) {
//         const x = feature[i]._x + 640;
//         const y = feature[i]._y;
//         vertex(x, y);
//     }

//     if (closed === true) {
//         endShape(CLOSE);
//     } else {
//         endShape();
//     }
// }

// // 目線を隠すための関数
// function eyeline(x1, y1, x2, y2) {
//     strokeWeight(30); //線の太さ
//     stroke(0, 0, 0); //線の色 R,G,B
//     line(
//         x1, y1, x2, y2
//     );
// }

function detect_fukkin_me(result) {
    detections_list_me.push(result);
    if (result.length > 0) {
        // 現フレーム顔あり
        let i = 10; // 顔がない時の連続フレーム数
        let fukkin = detections_list_me
            .slice(-i, detections_list_me.length - 1)
            .every(function (val) {
                return val == 0;
            });
        if (fukkin && start_check) {
            // 腹筋あり
            fukkin_ct_me = fukkin_ct_me + 1;
            console.log("私" + fukkin_ct_me + "回目");
            document.querySelector('#fukkin-me-ct').textContent = fukkin_ct_me;
            document.hanabi_1.src = "img/hanabi_pinkBig.svg";
            document.hanabi_5.src = "img/hanabi_pink.svg";
            document.querySelector('#score').textContent = score_end;
            document.getElementById("audioElement_hanabi").currentTime = 0;
            document.getElementById("audioElement_hanabi").play();
        }
    } else {
        // 現フレーム顔なし
    }
}

function detect_fukkin_you(result) {
    detections_list_you.push(result);
    if (result.length > 0) {
        // 現フレーム顔あり
        let i = 10; // 顔がない時の連続フレーム数
        let fukkin = detections_list_you
            .slice(-i, detections_list_you.length - 1)
            .every(function (val) {
                return val == 0;
            });
        if (fukkin && start_check) {
            // 腹筋あり
            fukkin_ct_you = fukkin_ct_you + 1;
            console.log("相手" + fukkin_ct_you + "回目");
            document.querySelector("#fukkin-you-ct").textContent = fukkin_ct_you;
            document.hanabi_2.src = "img/hanabi_orange.svg";
            document.hanabi_4.src = "img/hanabi_pink.svg";
            // 送信
            // conn.send(fukkin_ct_you);
        }
    } else {
        // 現フレーム顔なし
    }
}

document.getElementById("start-button").onclick = function () {
    document.getElementById("audioElement_start").currentTime = 0;
    document.getElementById("audioElement_start").play();
    start_check = true;
    document.getElementById("audioElement_battle").volume = 0.05;
    document.getElementById("audioElement_battle").currentTime = 0;
    document.getElementById("audioElement_battle").play();
    this.classList.toggle("start");
    var sub_wrap = document.getElementById("sub-wrap");
    var end_wrap = document.getElementById("end-wrap");
    var count_wrap = document.getElementById("timer-wrap");
    count_wrap.classList.add("start");
    document
        .getElementsByTagName("body")[0]
        .getElementsByTagName("button")[1].style.display = "none";
    document
        .getElementsByTagName("body")[0]
        .getElementsByTagName("input")[0].style.display = "none";
    document.getElementById("btn-change-mode").style.display = "none";

    window.setTimeout(function () {
        count_wrap.classList.add("end");
        sub_wrap.classList.add("start");
        document.getElementById("wave-wrap").classList.add("start");
        document.getElementById("orange").style.display = "none";
    }, 3000);

    window.setTimeout(async function () {
        // 3秒待機
        const sleep = (waitTime) =>
            new Promise((resolve) => setTimeout(resolve, waitTime));
        document.getElementById("audioElement_battle").pause();
        document.getElementById("audioElement_finish").currentTime = 0;
        document.getElementById("audioElement_finish").play();
        sub_wrap.classList.remove("start");
        end_wrap.classList.add("end");
        score_end = fukkin_ct_me;
        document.querySelector("#score").textContent = score_end;
        start_check = false;

        await sleep(3000);
        if (fukkin_ct_me > fukkin_ct_you) {
            document.getElementById("audioElement_win").currentTime = 0;
            document.getElementById("audioElement_win").play();
            document.getElementById("result_comment").textContent = "You Win!";
            document.hanabi_2.src = "img/hanabi_orange.svg";
            document.hanabi_1.src = "img/hanabi_orange.svg";
        } else if (fukkin_ct_me === fukkin_ct_you) {
            document.getElementById("result_comment").textContent = "Draw!";
        } else {
            document.getElementById("result_comment").textContent = "You Lose..";
            document.getElementById("audioElement_lose").currentTime = 0;
            document.getElementById("audioElement_lose").play();
        }
    }, 33000);
};

window.onload = function () {
    document
        .querySelector("#start-button")
        .addEventListener("click", function (e) {
            e.preventDefault();
            var count = 3;
            var id = setInterval(function () {
                count--;
                document.querySelector("#timer").textContent = count;
                if (count <= 1) clearInterval(id);
            }, 1000);

            e.preventDefault();
            var count2 = 33;
            var id2 = setInterval(function () {
                count2--;
                document.querySelector("#timer2").textContent = count2;
                if (count <= 1) clearInterval(id);
            }, 1000);
        });
};
