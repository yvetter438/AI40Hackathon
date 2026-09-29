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
          flexDirection: "column",
          background: "white",
          borderRadius: 40,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 44,
            width: "100%",
            background: "#ff3b30",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          TUE
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 300,
            color: "#000",
          }}
        >
          29
        </div>
      </div>
    ),
    { ...size },
  );
}
