import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, Bot, FileText, Shield, FileCheck, Upload } from "lucide-react";

function DashboardDemo() {
  const tasks = [
    { label: "Replace HVAC filter", urgency: "Now", urgencyColor: "bg-red-500", icon: AlertTriangle },
    { label: "Clean gutters", urgency: "Soon", urgencyColor: "bg-amber-500", icon: Clock },
    { label: "Test smoke detectors", urgency: "Soon", urgencyColor: "bg-amber-500", icon: Clock },
    { label: "Seal driveway cracks", urgency: "Later", urgencyColor: "bg-blue-500", icon: Clock },
  ];

  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [currentlyChecking, setCurrentlyChecking] = useState<number | null>(null);

  const runCycle = useCallback(() => {
    setCheckedItems([]);
    setCurrentlyChecking(null);

    const timers: ReturnType<typeof setTimeout>[] = [];
    tasks.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentlyChecking(i), 1200 + i * 1600));
      timers.push(setTimeout(() => {
        setCheckedItems(prev => [...prev, i]);
        setCurrentlyChecking(null);
      }, 1200 + i * 1600 + 800));
    });

    timers.push(setTimeout(() => {
      setCheckedItems([]);
      setCurrentlyChecking(null);
      runCycle();
    }, 1200 + tasks.length * 1600 + 1500));

    return timers;
  }, []);

  useEffect(() => {
    const timers = runCycle();
    return () => timers.forEach(clearTimeout);
  }, [runCycle]);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm" data-testid="demo-dashboard">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-heading font-bold text-foreground">Next Up</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {tasks.length - checkedItems.length} remaining
        </span>
      </div>
      <div className="p-3 space-y-2">
        {tasks.map((task, i) => {
          const isChecked = checkedItems.includes(i);
          const isChecking = currentlyChecking === i;
          return (
            <motion.div
              key={i}
              animate={{
                opacity: isChecked ? 0.4 : 1,
                scale: isChecking ? 1.02 : 1,
                backgroundColor: isChecking ? "rgba(249,115,22,0.06)" : "rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30"
            >
              <motion.div
                animate={{
                  scale: isChecking ? [1, 1.3, 1] : 1,
                  rotate: isChecked ? [0, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isChecked
                    ? "bg-green-100 dark:bg-green-950/40"
                    : isChecking
                    ? "bg-primary/20"
                    : "bg-muted"
                }`}
              >
                {isChecked ? (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300 }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </motion.div>
                ) : (
                  <task.icon className={`h-3.5 w-3.5 ${isChecking ? "text-primary" : "text-muted-foreground"}`} />
                )}
              </motion.div>
              <span className={`text-xs font-medium flex-1 transition-all duration-300 ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium ${task.urgencyColor} ${isChecked ? "opacity-40" : ""}`}>
                {task.urgency}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ChatDemo() {
  const conversations = [
    [
      { role: "user" as const, text: "My faucet is dripping" },
      { role: "assistant" as const, text: "Usually a worn washer or O-ring. Try turning off water supply, then replace the washer (~$5)." },
      { role: "assistant" as const, text: "Cost: $5-15 DIY, $150-300 plumber. You've got this!" },
    ],
    [
      { role: "user" as const, text: "When should I replace my roof?" },
      { role: "assistant" as const, text: "Asphalt shingles last 20-25 years. Look for curling, missing shingles, or granule loss." },
      { role: "assistant" as const, text: "Average cost: $8,000-15,000. Start a savings fund now!" },
    ],
  ];

  const [convoIndex, setConvoIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const convo = conversations[convoIndex];

  useEffect(() => {
    if (visibleCount < convo.length) {
      setIsTyping(true);
      const typingDelay = visibleCount === 0 ? 600 : 1200;
      const showDelay = typingDelay + 800;

      const t1 = setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(prev => prev + 1);
      }, showDelay);

      return () => clearTimeout(t1);
    } else {
      const t = setTimeout(() => {
        setVisibleCount(0);
        setConvoIndex(prev => (prev + 1) % conversations.length);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [visibleCount, convoIndex, convo.length]);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm h-full flex flex-col" data-testid="demo-chat">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-heading font-bold text-foreground">AI Assistant</span>
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-2 w-2 rounded-full bg-green-500 ml-auto"
        />
      </div>
      <div className="p-3 space-y-2.5 flex-1 min-h-[200px]">
        {convo.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={`${convoIndex}-${i}`}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && visibleCount < convo.length && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${convo[visibleCount].role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`px-3 py-2.5 rounded-xl ${
              convo[visibleCount].role === "user"
                ? "bg-primary/80 rounded-br-sm"
                : "bg-muted rounded-bl-sm"
            }`}>
              <div className="flex gap-1.5 items-center">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className={`h-1.5 w-1.5 rounded-full ${convo[visibleCount].role === "user" ? "bg-primary-foreground/60" : "bg-muted-foreground/60"}`} />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className={`h-1.5 w-1.5 rounded-full ${convo[visibleCount].role === "user" ? "bg-primary-foreground/60" : "bg-muted-foreground/60"}`} />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className={`h-1.5 w-1.5 rounded-full ${convo[visibleCount].role === "user" ? "bg-primary-foreground/60" : "bg-muted-foreground/60"}`} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DocumentsDemo() {
  const documents = [
    { name: "Home Insurance Policy", type: "Insurance", icon: Shield, color: "text-blue-500" },
    { name: "HVAC Warranty Certificate", type: "Warranty", icon: FileCheck, color: "text-green-500" },
    { name: "Roof Inspection Report", type: "Inspection", icon: FileText, color: "text-amber-500" },
    { name: "Kitchen Remodel Permit", type: "Permit", icon: FileText, color: "text-primary" },
  ];

  const [uploadedDocs, setUploadedDocs] = useState<number[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);

  const runCycle = useCallback(() => {
    setUploadedDocs([]);
    setUploading(null);

    const timers: ReturnType<typeof setTimeout>[] = [];
    documents.forEach((_, i) => {
      timers.push(setTimeout(() => setUploading(i), 800 + i * 1400));
      timers.push(setTimeout(() => {
        setUploadedDocs(prev => [...prev, i]);
        setUploading(null);
      }, 800 + i * 1400 + 700));
    });

    timers.push(setTimeout(() => {
      setUploadedDocs([]);
      setUploading(null);
      setTimeout(runCycle, 600);
    }, 800 + documents.length * 1400 + 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const cleanup = runCycle();
    return cleanup;
  }, [runCycle]);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm" data-testid="demo-documents">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-heading font-bold text-foreground">Document Vault</span>
        <Upload className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-4 space-y-2">
        {documents.map((doc, i) => {
          const isUploaded = uploadedDocs.includes(i);
          const isUploading = uploading === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: isUploaded || isUploading ? 1 : 0.3,
                x: isUploaded || isUploading ? 0 : -10,
              }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50"
            >
              <doc.icon className={`h-4 w-4 shrink-0 ${isUploaded ? doc.color : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-[10px] text-muted-foreground">{doc.type}</p>
              </div>
              {isUploading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
                />
              )}
              {isUploaded && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FileCheck className="h-4 w-4 text-green-500" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export { DashboardDemo, ChatDemo, DocumentsDemo };
