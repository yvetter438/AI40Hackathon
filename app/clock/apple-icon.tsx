import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: "50%",
            border: "6px solid white",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 6,
              height: 42,
              background: "white",
              bottom: "50%",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 6,
              height: 32,
              background: "#ff9500",
              bottom: "50%",
              left: "58%",
              transform: "rotate(55deg)",
              transformOrigin: "bottom center",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "white",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
