"use client";

import { useState } from "react";
import Image from "next/image";
import { HelperWidgetScript, type HelperWidgetConfig } from "@helperai/react";
import { env } from "@/lib/env";
import { api } from "@/trpc/react";
import { TRPCReactProvider } from "@/trpc/react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const { data: sampleQuestions, isLoading } = api.sampleQuestions.useQuery();

  const config: HelperWidgetConfig = {
    title: "Ask a question",
  };

  const handleQuestionClick = (questionText: string) => {
    setQuestion(questionText);
    if (typeof window !== "undefined") {
      window.postMessage({
        type: "HELPER_WIDGET_MESSAGE",
        payload: {
          action: "PROMPT",
          content: questionText,
        },
      }, "*");
    }
  };

  return (
    <TRPCReactProvider>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo_icon.png"
                alt="Helper"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-orange-500 mb-2">Helper</h1>
            <p className="text-xl text-gray-600">Real answers from real people</p>
          </div>

          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question"
                className="w-full px-6 py-4 text-lg border-2 border-blue-300 rounded-full focus:outline-none focus:border-blue-500 pr-16"
              />
              <button
                onClick={() => handleQuestionClick(question)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Recommended</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sampleQuestions?.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question.text)}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{question.emoji}</span>
                      <span className="text-gray-800">{question.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <HelperWidgetScript host={env.NEXT_PUBLIC_DEV_HOST} {...config} />
      </div>
    </TRPCReactProvider>
  );
}
