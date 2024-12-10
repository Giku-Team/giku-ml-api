const express = require("express");
const tf = require("@tensorflow/tfjs-node");
const router = express.Router();
const { bucket } = require("../config/storage"); // Import bucket dari konfigurasi
const { verifyToken } = require("../middleware/AuthToken");
const multer = require("multer");
// const dataKandunganGizi = require("../assets/kandungan-gizi.json");

const modelPath = "ml-model/model.json";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
let dataKandunganGizi = [];

async function loadModel() {
  try {
    // Mendapatkan file model.json dari Google Cloud Storage
    const file = bucket.file(modelPath);

    // Cek apakah file ada
    const [fileExists] = await file.exists();
    if (!fileExists) {
      throw new Error(`Model file does not exist at path: ${modelPath}`);
    }

    // Mendapatkan dataset kandungan gizi file
    const fileJson = bucket.file("ml-model/dataset/kandungan-gizi.json");
    // Membaca konten dataset kandungan gizi file
    const [contents] = await fileJson.download();

    // Parse JSON ke dalam variabel
    dataKandunganGizi = JSON.parse(contents.toString());

    // Memuat model menggunakan TensorFlow.js
    const model = await tf.loadLayersModel(
      `https://storage.googleapis.com/giku-bucket/ml-model/model.json`
    );
    console.log("Model berhasil dimuat!");

    return model;
  } catch (error) {
    console.error("Error downloading or loading model:", error);
    throw error;
  }
}

// Endpoint untuk prediksi
router.post(
  "/predict/nutrition",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      // Check if image is uploaded
      if (!req.file) {
        return res
          .status(400)
          .json({ code: 400, message: "No image uploaded." });
      }

      // Load the model
      const model = await loadModel();

      let imageTensor = tf.node.decodeImage(req.file.buffer, 3); // Decode to a 3-channel (RGB) image tensor

      // Resize image to match the model's input shape, e.g., 100x100
      const resizedImage = tf.image.resizeBilinear(imageTensor, [100, 100]);
      const normalizedImage = resizedImage.div(tf.scalar(255.0)); // Normalize image to [0, 1]
      const finalInput = normalizedImage.expandDims(0); // Add batch dimension for the prediction

      // Make prediction
      const prediction = model.predict(finalInput);
      const predictedClass = prediction.argMax(-1).dataSync()[0]; // Get the predicted class
      const confidence = prediction.max().dataSync()[0].toFixed(2);
      const kandunganGizi = dataKandunganGizi[predictedClass].data;
      const namaMakanan = dataKandunganGizi[predictedClass].Makanan;

      // Send the result back as a JSON response
      res.status(200).json({
        code: 200,
        message: "success",
        ConfidenceScore: confidence,
        NamaMakanan: namaMakanan,
        KandunganGizi: kandunganGizi,
      });
    } catch (error) {
      console.error("Error during prediction:", error);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  }
);
/**
 * @swagger
 * /api/predict/nutrition:
 *   post:
 *     tags:
 *       - Nutrition Prediction
 *     security:
 *       - BearerAuth: []
 *     summary: Predict nutrition from an uploaded image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file of the food
 *     responses:
 *       200:
 *         description: Successfully predicted nutrition
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 ConfidenceScore:
 *                   type: string
 *                   description: Confidence score of the prediction
 *                   example: "0.87"
 *                 NamaMakanan:
 *                   type: string
 *                   description: Predicted food name
 *                   example: "Sun Pisang Susu"
 *                 KandunganGizi:
 *                   type: object
 *                   description: Nutritional content of the food
 *                   properties:
 *                     Kalori (kcal):
 *                       type: integer
 *                       example: 160
 *                     Lemak (g):
 *                       type: string
 *                       example: "2,5"
 *                     Protein (g):
 *                       type: integer
 *                       example: 4
 *                     Karbohidrat (g):
 *                       type: integer
 *                       example: 31
 *                     Gula (g):
 *                       type: integer
 *                       example: 8
 *                     Natrium (g):
 *                       type: string
 *                       example: "0,1"
 *                     Vitamin A (%):
 *                       type: integer
 *                       example: 25
 *                     Vitamin D (%):
 *                       type: integer
 *                       example: 70
 *                     Vitamin E (%):
 *                       type: integer
 *                       example: 35
 *                     Vitamin K (%):
 *                       type: integer
 *                       example: 0
 *                     Vitamin B1 (Tiamin) (%):
 *                       type: integer
 *                       example: 40
 *                     Vitamin B2 (Riboflavin) (%):
 *                       type: integer
 *                       example: 50
 *                     Vitamin B3 (Niasin) (%):
 *                       type: integer
 *                       example: 50
 *                     Vitamin B5 (Asam Pantotenat) (%):
 *                       type: integer
 *                       example: 30
 *                     Vitamin B6 (Piridoksin) (%):
 *                       type: integer
 *                       example: 95
 *                     Vitamin B9 (Asam Folat) (%):
 *                       type: integer
 *                       example: 15
 *                     Vitamin B12 (Kobalamin) (%):
 *                       type: integer
 *                       example: 55
 *                     Vitamin C (%):
 *                       type: integer
 *                       example: 40
 *                     Biotin (%):
 *                       type: integer
 *                       example: 60
 *                     Kalium (%):
 *                       type: integer
 *                       example: 60
 *                     Kalsium (%):
 *                       type: integer
 *                       example: 65
 *                     Fosfor (%):
 *                       type: integer
 *                       example: 45
 *                     Magnesium (%):
 *                       type: integer
 *                       example: 40
 *                     Zat Besi (%):
 *                       type: integer
 *                       example: 85
 *                     Zink (%):
 *                       type: integer
 *                       example: 100
 *                     Tembaga (%):
 *                       type: integer
 *                       example: 0
 *                     Iodium (%):
 *                       type: integer
 *                       example: 30
 *                     Selenium (%):
 *                       type: integer
 *                       example: 0
 *                     Kolin (%):
 *                       type: integer
 *                       example: 15
 *                     Isoleusin (g):
 *                       type: integer
 *                       example: 0
 *                     Leusin (g):
 *                       type: integer
 *                       example: 0
 *                     Lisin (g):
 *                       type: integer
 *                       example: 0
 *                     Metionin (g):
 *                       type: integer
 *                       example: 0
 *                     Fenilalanin (g):
 *                       type: integer
 *                       example: 0
 *                     Threonin (g):
 *                       type: integer
 *                       example: 0
 *                     Triptofan (g):
 *                       type: integer
 *                       example: 0
 *                     Valin (g):
 *                       type: integer
 *                       example: 0
 *                     Taurin (g):
 *                       type: integer
 *                       example: 0
 *                     Klorida (g):
 *                       type: integer
 *                       example: 0
 *
 *       400:
 *         description: Bad request, for example if the file is missing or invalid
 *       401:
 *         description: Invalid or expired token
 *       403:
 *         description: Token required
 *       408:
 *         description: Request Timeout
 *       500:
 *         description: Internal server error
 */

module.exports = router;
