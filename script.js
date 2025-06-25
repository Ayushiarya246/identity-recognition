const video = document.querySelector("#video");
const startBtn = document.querySelector("#start");
const captureBtn = document.getElementById("capture");
const tryAgainBtn = document.getElementById("tryAgain");
const videoContainer = document.querySelector(".video");
const canvas = document.createElement("canvas");
const submit = document.querySelector("#submit");

let capturedSelfieData = null;
let idCardImageData = null;
let stream = null;

let captured = false;
let uploaded = false;

// Start Webcam
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Error accessing webcam:", err);
    alert("Unable to access the webcam. Please allow camera permission.");
  }
});

// Capture Selfie
captureBtn.addEventListener("click", () => {
  if (!stream) {
    alert("Start video first");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  stream.getTracks().forEach((track) => track.stop());

  videoContainer.innerHTML = "";
  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png");
  img.alt = "Captured Selfie";
  img.style.maxWidth = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  videoContainer.appendChild(img);

  capturedSelfieData = img.src;
  captureBtn.style.display = "none";
  tryAgainBtn.style.display = "inline-block";
  captured = true;
});

// Try Again
tryAgainBtn.addEventListener("click", () => {
  location.reload();
});

const idUploadContainer = document.querySelector(".doc");
const resultMsg = document.getElementById("resultMsg");
const idCardInput = document.getElementById("upload");
const fileInput = document.getElementById("idCard");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert("Please select an ID image.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    idCardImageData = e.target.result;
    idUploadContainer.innerHTML = `<img src="${idCardImageData}" alt="ID Preview" />`;
    uploaded = true;
    submit.style.display = "inline-block";
  };
  reader.readAsDataURL(file);
});

submit.addEventListener("click", async () => {
  if (!captured || !uploaded) {
    alert("Please capture selfie and upload ID card first.");
    return;
  }

  resultMsg.innerText = "Verifying...";
  resultMsg.style.color = "black";

  try {
    const res = await fetch("https://web-production-de1b7.up.railway.app/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selfie: capturedSelfieData,
        idCard: idCardImageData
      })
    });

    const result = await res.json();

    if (!result.success) {
      resultMsg.innerText = "Verification failed. " + (result.message || "");
      resultMsg.style.color = "red";
      return;
    }

    const verificationDiv = document.createElement("div");
    verificationDiv.className = "verification-result";
    verificationDiv.style.marginTop = "20px";
    verificationDiv.style.padding = "20px";
    verificationDiv.style.border = "2px solid black";
    verificationDiv.style.backgroundColor = "#f0f8ff";
    verificationDiv.style.borderRadius = "15px";
    verificationDiv.style.fontSize = "large";
    verificationDiv.style.fontWeight = "bold";
    verificationDiv.style.color = result.eligible ? "green" : "red";

    verificationDiv.innerHTML = `
      <p>Face Match: ${result.match ? "✅ Matched" : "❌ Not Matched"}</p>
      <p>Date of Birth: ${result.dob || "Not Found"}</p>
      <p>Age: ${result.age !== null ? result.age : "N/A"}</p>
      <p>${result.eligible ? "✅ You are eligible to vote!" : "❌ You must be 18 or older to vote."}</p>
    `;

    resultMsg.innerHTML = "";
    resultMsg.appendChild(verificationDiv);
  } catch (err) {
    console.error("Verification error:", err);
    resultMsg.innerText = "An error occurred during verification.";
    resultMsg.style.color = "red";
  }
});
