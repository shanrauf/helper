"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { ConversationDetails } from "@helperai/client";
import { MessageContent, useChat, useConversation, useHelperClient } from "@helperai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRunOnce } from "@/components/useRunOnce";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const ChatWidget = ({
  initialMessage,
  conversation,
  onBack,
}: {
  initialMessage: string;
  conversation: ConversationDetails;
  onBack: () => void;
}) => {
  const { messages, input, handleInputChange, handleSubmit, agentTyping, status, append } = useChat({
    conversation,
    ai: {
      generateId: () => `client_${Math.random().toString(36).slice(-6)}`,
    },
  });

  useRunOnce(() => {
    append({ role: "user", content: initialMessage });
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border p-4 bg-card">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="Helper" width={32} height={32} className="rounded" />
            <h1 className="text-xl font-bold text-primary">Helper</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-6">
            {messages.map((message, index) => (
              <div
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                key={`${message.id}-${index}`}
              >
                <div className="max-w-[85%] rounded-lg p-4 shadow-sm bg-muted text-foreground border border-border">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <span className="font-medium">{message.role === "user" ? "You" : "Helper"}</span>
                  </div>
                  <div className="prose prose-sm max-w-none prose-p:mb-2 prose-p:last:mb-0 prose-headings:mb-2 prose-headings:mt-4 prose-headings:first:mt-0 prose-ul:mb-2 prose-ol:mb-2 prose-li:mb-1 prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:px-3 prose-blockquote:py-2 prose-blockquote:rounded-r prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg">
                    <MessageContent message={message} />
                  </div>
                </div>
              </div>
            ))}
            {agentTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-medium">Helper</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground">An agent is typing...</span>
                  </div>
                </div>
              </div>
            )}
            {status === "submitted" && !agentTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-medium">Helper</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              className="flex-1 bg-background border-border focus:border-primary focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const HomepageContent = ({ mailboxName }: { mailboxName: string }) => {
  const [question, setQuestion] = useState("");
  const [chatConversationSlug, setChatConversationSlug] = useState<string | null>(null);
  const { data: sampleQuestions, isLoading } = api.sampleQuestions.useQuery();
  const { client } = useHelperClient();

  // Get conversation details when conversationSlug is available
  const { data: conversation } = useConversation(
    chatConversationSlug!,
    { enableRealtime: false },
    { enabled: !!chatConversationSlug },
  );

  const handleQuestionClick = async () => {
    const result = await client.conversations.create();
    setChatConversationSlug(result.conversationSlug);
  };

  const handleBackToMain = () => {
    setChatConversationSlug(null);
    setQuestion("");
  };

  if (chatConversationSlug && conversation) {
    return <ChatWidget initialMessage={question} conversation={conversation} onBack={handleBackToMain} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo_icon.png" alt="Helper" width={80} height={80} className="rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">{mailboxName}</h1>
        </div>

        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question"
              className="w-full px-6 py-4 text-lg border-2 border-border rounded-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground pr-16"
              onKeyDown={(e) => {
                if (e.key === "Enter" && question.trim()) {
                  handleQuestionClick();
                }
              }}
            />
            <button
              onClick={() => question.trim() && handleQuestionClick()}
              disabled={!question.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Recommended</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse bg-card">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleQuestions?.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuestion(question.text);
                    handleQuestionClick();
                  }}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 text-left transition-colors bg-card text-foreground"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{question.emoji}</span>
                    <span className="text-foreground">{question.text}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
