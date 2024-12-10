const express = require("express");
const tf = require("@tensorflow/tfjs-node");
const router = express.Router();
const { bucket } = require("../config/storage"); // Import bucket dari konfigurasi
const { verifyToken } = require("../middleware/AuthToken");
const multer = require("multer");
const path = require("path");
// const dataKandunganGizi = require("../assets/kandungan-gizi.json");

const modelPath = "ml-model/model.json";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
let dataKandunganGizi = [];
// Path ke lokasi model
const modelPath2 = path.resolve(__dirname, "../tmp/model.json");

async function loadModel() {
  try {
    // // Mendapatkan file model.json dari Google Cloud Storage
    // const file = bucket.file(modelPath);

    // // Cek apakah file ada
    // const [fileExists] = await file.exists();
    // if (!fileExists) {
    //   throw new Error(`Model file does not exist at path: ${modelPath}`);
    // }

    // // Mendapatkan dataset kandungan gizi file
    // const fileJson = bucket.file("ml-model/dataset/kandungan-gizi.json");
    // // Membaca konten dataset kandungan gizi file
    // const [contents] = await fileJson.download();

    // // Parse JSON ke dalam variabel
    // dataKandunganGizi = JSON.parse(contents.toString());

    // // Memuat model menggunakan TensorFlow.js
    // const model = await tf.loadLayersModel(
    //   `https://storage.googleapis.com/giku-bucket/ml-model/model.json`
    // );
    // console.log("Model berhasil dimuat!");

    // Menyimpan model ke dalam file lokal untuk dimuat oleh TensorFlow.js
    const modelLocalPath = "/tmp/model.json"; // Path lokal sementara
    //  const fs = require('fs');
    //  fs.writeFileSync(modelLocalPath, modelJson[0]);

    // Memuat model menggunakan TensorFlow.js
    const model = await tf.loadLayersModel(`file://${modelPath2}`);
    console.log("Model berhasil dimuat!");

    return model;
  } catch (error) {
    console.error("Error downloading or loading model:", error);
    throw error;
  }
}

// Endpoint untuk prediksi
router.post("/predict/stunting", upload.single("image"), async (req, res) => {
  try {
    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({ code: 400, message: "No image uploaded." });
    }

    // Load the model
    const model = await loadModel();
    // Data input: [umur, gender, tinggi badan]
    // Contoh: umur = 24 bulan, gender = laki-laki (1), tinggi badan = 85 cm
    const inputData = tf.tensor2d([24, 1, 20], [1, 3]); // [batch_size, features]

    // Lakukan prediksi
    const prediction = model.predict(inputData);
    const predictedOutput = prediction.argMax(-1).dataSync()[0];

    // Cetak hasil
    console.log("Hasil Prediksi:", predictedOutput);

    //   let imageTensor = tf.node.decodeImage(req.file.buffer, 3); // Decode to a 3-channel (RGB) image tensor

    //   // Resize image to match the model's input shape, e.g., 100x100
    //   const resizedImage = tf.image.resizeBilinear(imageTensor, [100, 100]);
    //   const normalizedImage = resizedImage.div(tf.scalar(255.0)); // Normalize image to [0, 1]
    //   const finalInput = normalizedImage.expandDims(0); // Add batch dimension for the prediction

    //   // Make prediction
    //   const prediction = model.predict(finalInput);
    //   const predictedClass = prediction.argMax(-1).dataSync()[0]; // Get the predicted class
    //   const confidence = prediction.max().dataSync()[0].toFixed(2);
    //   const kandunganGizi = dataKandunganGizi[predictedClass].data;
    //   const namaMakanan = dataKandunganGizi[predictedClass].Makanan;

    //   // Send the result back as a JSON response
    //   res.status(200).json({
    //     code: 200,
    //     message: "success",
    //     ConfidenceScore: confidence,
    //     NamaMakanan: namaMakanan,
    //     KandunganGizi: kandunganGizi,
    //   });
  } catch (error) {
    console.error("Error during prediction:", error);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
