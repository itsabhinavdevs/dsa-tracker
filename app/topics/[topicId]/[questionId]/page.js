"use client";

import { useParams } from "next/navigation";
import QuestionDetail from "@/components/QuestionDetail";

export default function QuestionPage() {
  const { topicId, questionId } = useParams();
  return <QuestionDetail isGlobal={false} topicId={topicId} questionId={questionId} />;
}
