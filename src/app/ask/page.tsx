import AskPage from "@/components/ask-page";
import { getViewer } from "@/lib/auth";
import { getPublicDirectory, getSettings, listQuestions } from "@/lib/directory";
import { directoryForViewer } from "@/lib/membership-gate";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `اسأل جنزور | ${settings.siteName}`, description: `اسأل أهل القرية: مين أحسن دكتور أو سباك أو مدرّس؟ الأعضاء يرشّحوا لك من ${settings.siteName} مباشرة.` };
}
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await getViewer();
  const [data, questions, params] = await Promise.all([getPublicDirectory(), listQuestions(viewer.id), searchParams]);
  return <AskPage data={directoryForViewer(data, viewer)} viewer={viewer} initialQuestions={questions} focusId={typeof params.q === "string" ? params.q : ""}/>;
}
