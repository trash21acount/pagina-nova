import { AppViewHost } from "@/components/layout/app-view-host";
import { HomeShell } from "@/components/layout/home-shell";
import CinematicLanding from "@/components/landing/CinematicLanding";
import { parseDocumentMarkdown } from "@/lib/document-parser";
import { DocumentLayout } from "@/components/document/document-layout";

export default function HomePage() {
  const documentContent = parseDocumentMarkdown();

  return (
    <AppViewHost view="landing">
      <HomeShell landingContent={<CinematicLanding />} documentContent={<DocumentLayout content={documentContent} />} />
    </AppViewHost>
  );
}
