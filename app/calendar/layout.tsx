import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Calendar",
  applicationName: "Calendar",
  manifest: "/calendar/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calendar",
  },
  icons: {
    apple: [{ url: "/icons/calendar.svg", type: "image/svg+xml" }],
    icon: [{ url: "/icons/calendar.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-black antialiased">{children}</div>
  );
}
