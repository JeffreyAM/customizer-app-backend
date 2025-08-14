import swaggerJsdoc, { OAS3Definition, OAS3Options } from "swagger-jsdoc";

const definition: OAS3Definition = {
  openapi: "3.0.0",
  info: {
    title: "EDM, Shopify & Printful Customizer API",
    version: "1.0.0",
  },
  tags: [
    {
      name: "Internal",
      description: "Internal endpoints for customization and data management.",
    },
    {
      name: "External/Shopify",
      description: "Endpoints for interacting with Shopify store data and orders that are modified for our use.",
    },
    {
      name: "External/Printful",
      description: "Endpoints for interacting with Printful's API and services that are modified for our use.",
    },
    {
      name: "External/Printful Proxy",
      description: "Routes that forward requests to the Printful API, maintaining authentication and store context.",
    },
    {
      name: "External/Shopify/Webhook",
      description: "Endpoints for interacting with Shopify store webhooks.",
    },
  ],
};

const options: OAS3Options = {
  definition,
  apis: ["src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
