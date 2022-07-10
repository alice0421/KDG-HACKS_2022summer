let faceapi;
let video;
let detections;
let detections_list = [];
let fukkin_ct = 0;
let score_end;
let start_check = false;

// by default all options are set to true
const detection_options = {
  withLandmarks: true,
  withDescriptors: false,
};

function setup() {
  canvas = createCanvas(windowWidth, windowHeight); // canvasタグを生成
  canvas.parent("p5-canvas-wrapper"); // index.htmlのp5-canvasの子要素にcanvasタグを持ってくる
  canvas.style("height", "100%");
  canvas.style("width", "auto");

  // load up your video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // Hide the video element, and just show the canvas
  faceapi = ml5.faceApi(video, detection_options, modelReady);
  textAlign(RIGHT);
}

function modelReady() {
  console.log("ready!");
  console.log(faceapi);
  faceapi.detect(gotResults);
}

function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  detect_fukkin(result);

  detections = result;

  // background(220);
  background(255);
  image(video, 0, 0, width, height);
  if (detections) {
    if (detections.length > 0) {
      // console.log(detections)
      // drawBox(detections);
      // drawLandmarks(detections);
    }
  }
  faceapi.detect(gotResults);
}

function drawBox(detections) {
  for (let i = 0; i < detections.length; i++) {
    const alignedRect = detections[i].alignedRect;
    const x = alignedRect._box._x;
    const y = alignedRect._box._y;
    const boxWidth = alignedRect._box._width;
    const boxHeight = alignedRect._box._height;

    noFill();
    stroke(161, 95, 251);
    strokeWeight(2);
    rect(x, y, boxWidth, boxHeight);
  }
}

function drawLandmarks(detections) {
  noFill();
  stroke(161, 95, 251);
  strokeWeight(2);

  for (let i = 0; i < detections.length; i++) {
    const mouth = detections[i].parts.mouth;
    const nose = detections[i].parts.nose;
    const leftEye = detections[i].parts.leftEye;
    const rightEye = detections[i].parts.rightEye;
    const rightEyeBrow = detections[i].parts.rightEyeBrow;
    const leftEyeBrow = detections[i].parts.leftEyeBrow;

    drawPart(mouth, true);
    drawPart(nose, false);
    drawPart(leftEye, true);
    drawPart(leftEyeBrow, false);
    drawPart(rightEye, true);
    drawPart(rightEyeBrow, false);
  }
}

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

function detect_fukkin(result) {
  detections_list.push(result);
  if (result.length > 0) {
    // 現フレーム顔あり
    let i = 10; // 顔がない時の連続フレーム数
    let fukkin = detections_list
      .slice(-i, detections_list.length - 1)
      .every(function (val) {
        return val == 0;
      });
    if (fukkin && start_check) {
      // 腹筋あり
      console.log("腹筋あり");
      fukkin_ct = fukkin_ct + 1;
      document.querySelector("#fukkin-ct").textContent = fukkin_ct;
      document.hanabi_5.src = "img/hanabi_pink.svg";
      document.hanabi_4.src = "img/hanabi_pink.svg";
      document.hanabi_3.src = "img/hanabi_orangeBig.svg";
      document.hanabi_2.src = "img/hanabi_orangeBig.svg";
      document.hanabi_1.src = "img/hanabi_orangeBig.svg";
      document.getElementById("audioElement").currentTime = 0;
      document.getElementById("audioElement").play();
      document.querySelector("#score").textContent = score_end;
    }
  } else {
    // 現フレーム顔なし
  }
}

document.getElementById("start-button").onclick = function () {
  start_check = true;
  this.classList.toggle("start");
  var sub_wrap = document.getElementById("sub-wrap");
  var end_wrap = document.getElementById("end-wrap");
  var count_wrap = document.getElementById("timer-wrap");
  count_wrap.classList.add("start");
  document.getElementById("btn-change-mode").style.display = "none";

  window.setTimeout(function () {
    count_wrap.classList.add("end");
    sub_wrap.classList.add("start");
    document.getElementById("wave-wrap").classList.add("start");
    document.getElementById("orange").style.display = "none";
  }, 3000);

  window.setTimeout(function () {
    sub_wrap.classList.remove("start");
    end_wrap.classList.add("end");
    score_end = fukkin_ct;
    document.querySelector("#score").textContent = score_end;
    start_check = false;
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

// Start押下でBGM流れる
var my_audio = new Audio("img/fireworks.mp3");
//ボタンにクリックイベントを設定
document.getElementById("start-text").onclick = function () {
  my_audio.currentTime = 0; //再生開始位置を先頭に戻す
  my_audio.play(); //サウンドを再生
};
