import { DocumentLayout } from "@/components/document/document-layout";
import { AppViewHost } from "@/components/layout/app-view-host";
import { HomeShell } from "@/components/layout/home-shell";
import { parseDocumentMarkdown } from "@/lib/document-parser";
import CinematicLanding from "@/components/landing/CinematicLanding";

export default function DocumentoPage() {
  const documentContent = parseDocumentMarkdown();

  return (
    <AppViewHost view="document">
      <HomeShell landingContent={<CinematicLanding />} documentContent={<DocumentLayout content={documentContent} />} />
    </AppViewHost>
  );
}
