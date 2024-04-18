const express = require("express");
const { send } = require("process");
const app = express();
const axios = require("axios").default;
const bodyParser = require("body-parser");
const faceRecognition = async (image) => {
  try {
    const fs = require("fs");
    const FormData = require("form-data");

    fs.writeFileSync("face.jpg", image, "binary");

    console.log("Image saved successfully.");

    const imageStream = fs.createReadStream("face.jpg");

    const form = new FormData();
    form.append("providers", "google");
    form.append("file", imageStream);
    form.append("fallback_providers", "");

    const options = {
      method: "POST",
      url: "https://api.edenai.run/v2/image/face_detection",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMmQ5MTA4NzQtZmIwYS00MzY0LWIyNzgtZTViNTNhODE0ODI3IiwidHlwZSI6ImFwaV90b2tlbiJ9.L8skxvE3M9M3Ndflz6Fqy8ye8FK0R0hdJXa8vzmJdxU",
        "Content-Type": "multipart/form-data; boundary=" + form.getBoundary(),
      },
      data: form,
    };

    const response = await axios.request(options);
    console.log(response.data);
    const result = response.data.google.items.map((item) => {
      return item.confidence;
    });
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    return "error";
  }
};

const objectRecognition = async (image) => {
  try {
    const fs = require("fs");
    const FormData = require("form-data");

    fs.writeFileSync("image.jpg", image, "binary");

    console.log("Image saved successfully.");

    const imageStream = fs.createReadStream("image.jpg");

    const form = new FormData();
    form.append("providers", "google");
    form.append("file", imageStream);
    form.append("fallback_providers", "");

    const options = {
      method: "POST",
      url: "https://api.edenai.run/v2/image/object_detection",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMmQ5MTA4NzQtZmIwYS00MzY0LWIyNzgtZTViNTNhODE0ODI3IiwidHlwZSI6ImFwaV90b2tlbiJ9.L8skxvE3M9M3Ndflz6Fqy8ye8FK0R0hdJXa8vzmJdxU",
        "Content-Type": "multipart/form-data; boundary=" + form.getBoundary(),
      },
      data: form,
    };

    const response = await axios.request(options);
    console.log(response.data);
    const carItem = response.data.google.items.find(
      (item) => item.label === "Car"
    );
    if (!carItem) {
      return 0;
    }

    return carItem.confidence;
  } catch (error) {
    console.error(error);
    return "error";
  }
};

const recieveImage = async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(404).json({ error: "Image not found" });
    }
    const decodedImage = Buffer.from(base64Image, "base64");
    const faceResult = await faceRecognition(decodedImage);
    if (faceResult == "error") {
      res.status(400).json({ error: "Failed to detect face" });
    }

    const objectResult = await objectRecognition(decodedImage);
    if (objectResult == "error") {
      res.status(400).json({ error: "Failed to detect object" });
    }
    console.log("carResult: " + objectResult);
    console.log("faceResult: " + faceResult[0]);
    return res.status(200).json({
      carResult: objectResult > 0.5 ? true : false,
      faceResult: faceResult[0] > 0.6 ? true : false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use((req, res, next) => {
  console.log(req.path);
  next();
});
app.use(bodyParser.json());

app.post("/send/img", recieveImage);

app.listen(5000, () => {
  console.log("Listening on port " + 5000);
});
