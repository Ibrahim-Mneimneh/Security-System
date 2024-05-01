const { exec } = require("child_process");
const axios = require("axios");
const fs = require("fs").promises;
const rpio = require("rpio");

function takeImage() {
  return new Promise((resolve, reject) => {
    const command = "fswebcam -r 1280x720 --jpeg 100 ~/testing/image.jpg";

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing command:", error);
        reject(error);
      } else if (stderr) {
        console.error("stderr:", stderr);
        reject(new Error(stderr));
      } else {
        console.log("Image captured successfully");
        resolve();
      }
    });
  });
}

async function sendImage() {
  try {
    await takeImage();
    const imagePath = "./images/image.jpg";
    const imageBuffer = await fs.readFile(imagePath);

    const base64Image = imageBuffer.toString("base64");

    const response = await axios.post(
      "https://security-system-9vxi.onrender.com/send/img",
      { base64Image }
    );
    console.log("Image sent successfully", response.data);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

async function sendEmail(endpoint) {
  try {
    const imagePath = "./images/image.jpg";
    const imageBuffer = await fs.readFile(imagePath);

    const base64Image = imageBuffer.toString("base64");
    console.log("Sending email to:", endpoint);
    const response = await axios.post(endpoint, { base64Image });

    console.log("Email sent successfully");
    return response.data;
  } catch (error) {
    console.log("Error sending email:", error.message);
  }
}
