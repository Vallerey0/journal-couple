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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -1,
        },
      },
      "JC",
    ),
    {
      width: 512,
      height: 512,
    },
  );
}
