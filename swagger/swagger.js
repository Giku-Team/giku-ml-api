const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Giku App",
    version: "1.0.0",
    description: "API Documentation for Model ML Giku App",
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT", // Format token
      },
    },
  },
  security: [
    {
      BearerAuth: [], // Terapkan secara global
    },
  ],
  servers: [
    {
      url: "http://localhost:8080",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // Path to route files
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
