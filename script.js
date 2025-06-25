const video = document.querySelector("#video");
const startBtn = document.querySelector("#start");
const captureBtn = document.getElementById("capture");
const tryAgainBtn = document.getElementById("tryAgain");
const videoContainer = document.querySelector(".video"); // FIXED: select single element
const canvas = document.createElement("canvas");
const submit=document.querySelector("#submit")

let capturedSelfieData = null;
let stream = null; // this will hold the webcam stream globally

let captured=false;
let uploaded=false;
// Start Webcam
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Ensure video plays and dimensions are set
    await video.play(); // this ensures dimensions are ready
  } catch (err) {
    console.error("Error accessing webcam:", err);
    alert("Unable to access the webcam. Please allow camera permission.");
  }
});

// Capture Selfie
captureBtn.addEventListener("click", () => {
  if(!stream){
    alert("start video first");
  }
  else{
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  // Stop video stream
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Clear and show captured selfie
  videoContainer.innerHTML = ""; // FIXED: now clears actual container
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
  captured=true;
}
});

// Try Again
tryAgainBtn.addEventListener("click", () => {
  location.reload(); // resets everything
});


const idUploadContainer = document.querySelector(".doc");
const verifyBtn = document.getElementById("verify");
const resultMsg = document.getElementById("resultMsg");
const idCardInput = document.getElementById("upload");
const fileInput = document.getElementById('idCard');

idCardInput.addEventListener('click',()=>{
    const file = fileInput.files[0];
    if(!file){
      alert("select the file first");
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert("Only image files are allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      idUploadContainer.innerHTML = `<img src="${e.target.result}" alt="ID Preview">`;
    };
    reader.readAsDataURL(file);
    submit.style.display = "inline-block";
    uploaded=true;
});

submit.addEventListener("click", async () => {
  if (!captured && !uploaded) {
    alert("Please capture your selfie and upload your ID card.");
    return;
  } else if (!captured) {
    alert("Please capture your selfie first.");
    return;
  } else if (!uploaded) {
    alert("Please upload your ID card first.");
    return;
  }

  const formData = new FormData();
  formData.append("selfie", dataURLtoBlob(capturedSelfieData));
  formData.append("id_card", fileInput.files[0]);

  resultMsg.innerText = "Verifying...";
  resultMsg.style.color = "black";

  try {
    const res = await fetch("https://web-production-de1b7.up.railway.app/", {
      method: "POST",
      body: formData,
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

// Convert base64 to Blob
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(",");
  const byteString = atob(parts[1]);
  const mimeString = parts[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}


