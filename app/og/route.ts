import { ImageResponse } from "next/og";
import React from "react";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
          color: "#ffffff",
          padding: "80px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            textAlign: "center",
          },
        },
        "Journal Couple",
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: 18,
            fontSize: 34,
            fontWeight: 600,
            opacity: 0.95,
            textAlign: "center",
          },
        },
        "Private couple journal untuk menyimpan kenangan bersama",
      ),
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
