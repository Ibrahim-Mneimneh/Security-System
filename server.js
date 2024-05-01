const express = require("express");
const { send } = require("process");
dotenv = require("dotenv");
dotenv.config();
const app = express();
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const handlebars = require("handlebars");
const path = require("path");
const { getLebanonDateTime } = require("./getDate");
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runImage(prompt, base64Image) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const imageParts = {
    inlineData: {
      data: base64Image,
      mimeType: "image/jpeg",
    },
  };
  const result = await model.generateContent([prompt, imageParts]);
  const response = result.response;
  let text = response.text();
  text = JSON.parse(text);
  return text;
}
function saveBase64Image(base64String, outputPath) {
  try {
    // Remove header from base64 data
    const base64Data = base64String.replace(/^data:image\/jpeg;base64,/, "");

    // Decode base64 data into a buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Write the buffer to the file
    fs.writeFileSync(outputPath, imageBuffer);

    console.log("Image saved successfully as", outputPath);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

const analyzeImage = async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Please add a base64Image" });
    }
    saveBase64Image(base64Image, "./image.jpg");
    const prompt =
      'Does this picture contain a human or a car.Provide this information the format as following as a string: {"car":true, "human":true}';
    const result = await runImage(prompt, base64Image);
    if (!result) {
      return res.status(400).json({ error: "Failed to obtain result" });
    }
    let emailResult;
    if (result.human || result.car) {
      emailResult = emailSender(
        base64Image,
        "Someone at Your Stepdoor!",
        "./someone.hbs"
      );
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const emailSender = (base64Image, subject, filePath) => {
  try {
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
        throw Error("Error sending email:" + error);
      } else {
        console.log("Email sent:", info.response);
        return "success";
      }
    });
  } catch (error) {
    throw Error("Error sending email, 500:", error.message);
  }
};
const sendIntrusion = (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Image not Included" });
    }
    const emailResult = emailSender(
      base64Image,
      "Home Intrusion Alert!!",
      "./intrusion.hbs"
    );
    return res.status(200).json({ result: "success" });
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

app.post("/send/img", analyzeImage);
app.post("/intrusion", sendIntrusion);
app.listen(5000, () => {
  console.log("Listening on port " + 5000);
});
