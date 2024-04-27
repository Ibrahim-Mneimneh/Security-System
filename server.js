const express = require("express");
const { send } = require("process");
dotenv = require("dotenv");
dotenv.config();
const app = express();
const axios = require("axios").default;
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const handlebars = require("handlebars");
const path = require("path");
const { getLebanonDateTime } = require("./getDate");

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
    return res.status(200).json({ result });
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
const sendIdentity = (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Image not Included" });
    }
    const subject = "Someone at Your Stepdoor!";
    const filePath = "./intrusion.hbs";
    const recipientEmail = "ib79mneimneh@gmail.com";
    const time = getLebanonDateTime();
    const transporter = nodemailer.createTransport({
      service: process.env.centralService,
      auth: {
        user: process.env.centralName,
        pass: process.env.centralPass,
      },
    });
    const templatePath = path.join(__dirname, filePath);
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);
    const mailOptions = {
      from: process.env.centralName,
      to: recipientEmail,
      subject,
      html: template({
        image: '<img src="cid:myimagecid123"/>',
        time,
      }),
    };
    const attachments = [
      {
        filename: "image.jpg",
        content: base64Image,
        encoding: "base64",
        cid: "unique@nodemailer.com",
      },
    ];
    mailOptions.attachments = attachments;

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(500).json({ error });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ result: "Email sent successfully!" });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const sendIntrusion = (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Image not Included" });
    }
    const subject = "Home Intrusion Alert!!";
    const filePath = "./somone.hbs";
    const recipientEmail = "ib79mneimneh@gmail.com";
    const time = getLebanonDateTime();
    const transporter = nodemailer.createTransport({
      service: process.env.centralService,
      auth: {
        user: process.env.centralName,
        pass: process.env.centralPass,
      },
    });
    const templatePath = path.join(__dirname, filePath);
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);
    const mailOptions = {
      from: process.env.centralName,
      to: recipientEmail,
      subject,
      html: template({
        image: '<img src="cid:myimagecid123"/>',
        time,
      }),
    };
    const attachments = [
      {
        filename: "image.jpg",
        content: base64Image,
        encoding: "base64",
        cid: "unique@nodemailer.com",
      },
    ];
    mailOptions.attachments = attachments;

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(500).json({ error, result: false });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ result: true });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
app.post("/identity", sendIdentity);
app.post("/intrusion", sendIdentity);
app.listen(5000, () => {
  console.log("Listening on port " + 5000);
});
