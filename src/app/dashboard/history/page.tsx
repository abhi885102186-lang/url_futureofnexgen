
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, MessageSquare } from "lucide-react";
import useChatHistory from "@/hooks/use-chat-history";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HistoryPage() {
  const { conversations, isLoaded } = useChatHistory();

  return (
    <div className="container mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Chat History
          </h1>
          <p className="text-muted-foreground">
            Review your past conversations with the assistant.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Conversation Log</CardTitle>
          <CardDescription>Your most recent interactions are shown first.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2 pr-4">
                {!isLoaded && <div className="text-center py-10 text-muted-foreground">Loading history...</div>}
                {isLoaded && conversations.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">No conversations yet.</div>
                )}
                {isLoaded && conversations.map(convo => (
                    <Link key={convo.id} href={`/dashboard?id=${convo.id}`} className="block">
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                            <div className="flex items-center gap-4">
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                <div className="grid gap-1">
                                    <p className="font-semibold truncate">{convo.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {convo.messages.length} messages
                                    </p>
                                </div>
                            </div>
                            <time className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(convo.timestamp), { addSuffix: true })}
                            </time>
                        </div>
                    </Link>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
