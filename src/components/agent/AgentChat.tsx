import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// API history turn (what we send to backend to maintain context)
interface HistoryTurn {
  role: string;
  content: string | object[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgentChat() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente de JS Logistics Admin. Puedo ayudarte a registrar entregas, recogidas, gastos, ingresos, base diaria de mensajeros y más. ¿Qué necesitas hacer hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // History sent to backend for multi-turn context
  const [apiHistory, setApiHistory] = useState<HistoryTurn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const { data } = await api.post('/agent/chat', {
        message: text,
        history: apiHistory,
      });
      const rawData = data.newTurns.at(-1)
      const contentObject = JSON.parse(rawData.content)
      const keyInfo = contentObject.key
      queryClient.invalidateQueries({ queryKey: [`${keyInfo}`] })

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      // Append new turns to the history
      setApiHistory((prev) => [...prev, ...data.newTurns]);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error || 'Error al procesar tu solicitud. Intenta de nuevo.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: '¡Hola de nuevo! ¿En qué puedo ayudarte?',
      },
    ]);
    setApiHistory([]);
  };

  // ─── Closed state: floating button ──────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Abrir asistente IA"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  // ─── Open state: chat panel ──────────────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border bg-background shadow-2xl transition-all duration-200 ${
        minimized ? 'h-14 w-80' : 'h-[520px] w-[380px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-sm font-semibold">Asistente IA — JS Logistics</span>
        <button
          onClick={() => setMinimized((v) => !v)}
          className="rounded p-0.5 hover:bg-white/20"
          aria-label={minimized ? 'Expandir' : 'Minimizar'}
        >
          {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-0.5 hover:bg-white/20"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="flex flex-col gap-3 pb-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground'
                    }`}
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t px-3 py-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje… (Enter para enviar)"
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none text-sm"
                rows={1}
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={handleClear}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar conversación
            </button>
          </div>
        </>
      )}
    </div>
  );
}
