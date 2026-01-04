import { Layout } from "@/components/layout";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getHome, getChatMessages } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/generated_images/orange_house_logo_with_grey_gear..png";

export default function Chat() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: home } = useQuery({
    queryKey: ["home"],
    queryFn: getHome,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", home?.id],
    queryFn: () => getChatMessages(home!.id),
    enabled: !!home?.id,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || !home || isStreaming) return;

    const userMessage = input;
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/home/${home.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setStreamingMessage(prev => prev + data.content);
                } else if (data.done) {
                  queryClient.invalidateQueries({ queryKey: ["chat", home.id] });
                } else if (data.error) {
                  toast({
                    title: "Error",
                    description: data.error,
                    variant: "destructive",
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  if (!home) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground">Please complete your home profile first.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-heading">Assistant</h1>
          <p className="text-muted-foreground">Expert advice for your home, 24/7.</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm">
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md px-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">How can I help?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    I can help you understand repairs, estimate costs, or figure out what can wait. What's on your mind?
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button 
                      onClick={() => setInput("What repairs should I prioritize?")}
                      className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      What should I fix first?
                    </button>
                    <button 
                      onClick={() => setInput("How much should I budget for home repairs?")}
                      className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      Help me plan costs
                    </button>
                    <button 
                      onClick={() => setInput("What can I safely do myself vs hire a pro?")}
                      className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      DIY or hire a pro?
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-6 italic">
                    Estimates are general ranges, not quotes. You're always in control.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                    data-testid={`message-${msg.id}`}
                  >
                    <Avatar className="h-10 w-10 border shadow-sm">
                      {msg.role === "assistant" ? (
                        <AvatarImage src={logoImage} />
                      ) : null}
                      <AvatarFallback className={msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                        {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <span className="text-xs text-muted-foreground font-medium mb-1">
                        {msg.role === "assistant" ? "Home Buddy" : "You"}
                      </span>
                      <div
                        className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white border text-foreground rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {streamingMessage && (
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={logoImage} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 max-w-[80%] items-start">
                      <span className="text-xs text-muted-foreground font-medium mb-1">
                        Home Buddy
                      </span>
                      <div className="p-4 rounded-2xl shadow-sm text-sm leading-relaxed bg-white border text-foreground rounded-tl-none">
                        {streamingMessage}
                        <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
                      </div>
                    </div>
                  </div>
                )}
                
                {isStreaming && !streamingMessage && (
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={logoImage} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 max-w-[80%] items-start">
                      <span className="text-xs text-muted-foreground font-medium mb-1">
                        Home Buddy
                      </span>
                      <div className="p-4 rounded-2xl shadow-sm text-sm leading-relaxed bg-white border text-foreground rounded-tl-none">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-white/80 border-t backdrop-blur-md">
            <div className="relative flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0" data-testid="button-attach">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach a file (coming soon)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0" data-testid="button-image">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add an image (coming soon)</TooltipContent>
              </Tooltip>
              <Input
                placeholder="Ask about maintenance, repairs, or costs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isStreaming && handleSend()}
                disabled={isStreaming}
                className="flex-1 rounded-full px-4 border-muted-foreground/20 focus-visible:ring-primary/20"
                data-testid="input-message"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    className="rounded-full shadow-lg shadow-primary/20 shrink-0"
                    data-testid="button-send"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
