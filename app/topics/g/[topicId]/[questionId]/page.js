"use client";

import { useParams } from "next/navigation";
import QuestionDetail from "@/components/QuestionDetail";

// Route for questions that belong to the shared/global sheet, e.g.
// /topics/g/arrays/two-sum-3 — kept as a separate route (instead of a
// query param) so it's a clean, shareable/bookmarkable URL.
export default function GlobalQuestionPage() {
  const { topicId, questionId } = useParams();
  return <QuestionDetail isGlobal={true} topicId={topicId} questionId={questionId} />;
}
