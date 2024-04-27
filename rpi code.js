const { exec } = require("child_process");
const axios = require("axios");
const fs = require("fs").promises;
const rpio = require("rpio");

function takeImage() {
  return new Promise((resolve, reject) => {
    const command = "fswebcam -r 1280x720 --jpeg 100 ~/images/image.jpg";

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

// Define GPIO pin numbers
const PIN_INPUT_1 = 27; // GPIO0 (Pin 11)
const PIN_INPUT_2 = 28; // GPIO1 (Pin 12)
const PIN_OUTPUT_1 = 22; // GPIO3 (Pin 15)
const PIN_OUTPUT_2 = 23; // GPIO4 (Pin 16)

// Set pin modes (input or output)
rpio.open(PIN_INPUT_1, rpio.INPUT);
rpio.open(PIN_INPUT_2, rpio.INPUT);
rpio.open(PIN_OUTPUT_1, rpio.OUTPUT, rpio.LOW);
rpio.open(PIN_OUTPUT_2, rpio.OUTPUT, rpio.LOW);

// Function to read input pins
function readInputPins() {
  const inputPin1State = rpio.read(PIN_INPUT_1);
  const inputPin2State = rpio.read(PIN_INPUT_2);
  console.log("Input Pin 1 State:" + inputPin1State);
  console.log("Input Pin 2 State:" + inputPin2State);
  controlOutputPins(inputPin1State, inputPin2State);
}

// Function to control output pins based on input states
async function controlOutputPins(inputPin1State, inputPin2State) {
  let { faceResult, carResult } = await sendImage();
  await sendEmail();
  // Based on PIN12
  if (inputPin1State === rpio.HIGH) {
    // in case we read the intrusion
    if (faceResult || carResult) {
      sendEmail("https://security-system-9vxi.onrender.com/intrusion");
    }
  } else {
    if (inputPin2State === rpio.HIGH) {
      if (carResult) {
        if (faceResult) {
          //face and car
          rpio.write(PIN_OUTPUT_1, rpio.HIGH);
          rpio.write(PIN_OUTPUT_2, rpio.HIGH);
          await sendEmail("https://security-system-9vxi.onrender.com/identity");
        } else {
          // car only
          rpio.write(PIN_OUTPUT_2, rpio.HIGH);
          rpio.write(PIN_OUTPUT_1, rpio.LOW);
          await sendEmail("https://security-system-9vxi.onrender.com/identity");
        }
      } else {
        if (faceResult) {
          // face only
          rpio.write(PIN_OUTPUT_1, rpio.HIGH);
          rpio.write(PIN_OUTPUT_2, rpio.LOW);
          await sendEmail("https://security-system-9vxi.onrender.com/identity");
        } else {
          // Nothing
          rpio.write(PIN_OUTPUT_2, rpio.LOW);
          rpio.write(PIN_OUTPUT_1, rpio.LOW);
        }
      }
    }
  }
}

// Periodically read input pins and control output pins
setInterval(() => {
  readInputPins();
}, 20000); // Repeat every 1 second (1000 milliseconds)
