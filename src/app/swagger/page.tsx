"use client";
import { useEffect } from "react";
import SwaggerUI from "swagger-ui-dist/swagger-ui-bundle";
import "swagger-ui-dist/swagger-ui.css";

export default function SwaggerPage() {
  useEffect(() => {
    SwaggerUI({
      dom_id: "#swagger-container",
      url: "/api/swagger",
      docExpansion: "list", // collapsible accordion by default
      defaultModelsExpandDepth: -1, // hides schemas by default
      showCommonExtensions: true,
      showExtensions: true,
    });
  }, []);

  return <div id="swagger-container" style={{ height: "100vh" }} />;
}
