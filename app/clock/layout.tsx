import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Clock",
  description: "Clock",
  applicationName: "Clock",
  manifest: "/clock/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Clock",
  },
  icons: {
    apple: [{ url: "/icons/clock.svg", type: "image/svg+xml" }],
    icon: [{ url: "/icons/clock.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function ClockLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white antialiased">{children}</div>
  );
}
