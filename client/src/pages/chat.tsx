import { Layout } from "@/components/layout";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHome, getChatMessages, createChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/generated_images/orange_house_logo_with_grey_gear..png";

export default function Chat() {
  const [input, setInput] = useState("");
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

  const createMessageMutation = useMutation({
    mutationFn: (data: { role: string; content: string }) =>
      createChatMessage(home!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", home?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !home) return;

    const userMessage = input;
    setInput("");

    await createMessageMutation.mutateAsync({
      role: "user",
      content: userMessage,
    });

    // Mock AI response for now
    setTimeout(async () => {
      await createMessageMutation.mutateAsync({
        role: "assistant",
        content: "I can help with that! Based on your home profile, I'd recommend consulting with a licensed professional for this type of work. Would you like me to provide more details about costs, safety considerations, or finding qualified contractors in your area?",
      });
    }, 1000);
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
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me about maintenance tasks, safety concerns, cost estimates, or any home-related questions!
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
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-white/80 border-t backdrop-blur-md">
            <div className="relative flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0" data-testid="button-attach">
                <Paperclip className="h-5 w-5" />
              </Button>
               <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0" data-testid="button-image">
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Ask about maintenance, repairs, or costs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 rounded-full px-4 border-muted-foreground/20 focus-visible:ring-primary/20"
                data-testid="input-message"
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim() || createMessageMutation.isPending}
                className="rounded-full shadow-lg shadow-primary/20 shrink-0"
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
