import type { Metadata } from "next";
import { CopilotKit } from "@copilotkit/react-core"; 
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "Pinechat",
  description: "Pinechat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}