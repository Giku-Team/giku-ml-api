const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swagger");
const modelNutritionRoutes = require("./routes/model-nutrition");
const modelStuntingRoutes = require("./routes/model-stunting");

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", modelNutritionRoutes);
// app.use("/api", modelStuntingRoutes);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
