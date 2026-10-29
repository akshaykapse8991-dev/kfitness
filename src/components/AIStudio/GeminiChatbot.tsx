import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Dumbbell,
  Salad,
  Activity,
  Zap,
  Info,
} from 'lucide-react';
import { UserProfile } from '../../types/fitness';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  userProfile?: UserProfile;
}

const PERSONAS = [
  {
    id: 'general',
    name: 'Lead Trainer',
    roleTitle: 'Head AI Fitness Coach',
    icon: Dumbbell,
    color: 'emerald',
    badge: 'All-Rounder',
    description: 'Custom programming, motivation, and total body fitness guidance.',
  },
  {
    id: 'strength',
    name: 'Coach Vikram',
    roleTitle: 'CSCS Strength & Hypertrophy',
    icon: Zap,
    color: 'amber',
    badge: 'Heavy Lifting',
    description: 'Progressive overload, RPE, periodization, and lifting technique.',
  },
  {
    id: 'nutrition',
    name: 'Dr. Ananya',
    roleTitle: 'Indian Sports Nutritionist',
    icon: Salad,
    color: 'teal',
    badge: 'Desi Macros',
    description: 'Vegetarian protein combos, calorie partitioning, and meal timing.',
  },
  {
    id: 'biomechanics',
    name: 'Dr. Rajesh',
    roleTitle: 'PT & Biomechanics Specialist',
    icon: Activity,
    color: 'cyan',
    badge: 'Mobility & Joints',
    description: 'Kinematics, preventing joint impingement, and injury recovery.',
  },
];

const MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Recommended',
    description: 'Flagship speed & deep training intelligence',
    isPro: false,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Sub-second quick answers & rep checks',
    isPro: false,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Pro Tier',
    description: 'Deep complex biomechanics & advanced periodization',
    isPro: true,
  },
];

const PRESET_PROMPTS = [
  'How do I program progressive overload for a 4-day push/pull split?',
  'Best high-protein vegetarian Indian meal plan for lean bulking?',
  'How to eliminate lower back rounding during heavy barbell squats?',
  'Explain RPE vs RIR and how to use it to avoid overtraining.',
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ userProfile }) => {
  const [selectedPersona, setSelectedPersona] = useState<string>('general');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Namaste! I am your AI Fitness Trainer at **Kapse Fitness**.\n\nWhether you need customized workout splits, authentic high-protein Indian diet tweaks, or joint-safe exercise cues, I'm here to coach you with evidence-based protocols.\n\n*Select a specialist coach persona or ask any question below!*`,
        modelUsed: 'gemini-3.8-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          model: selectedModel,
          persona: selectedPersona,
          userContext: userProfile ? {
            goal: userProfile.goal,
            weightKg: userProfile.weightKg,
            targetCalories: userProfile.targetCalories,
            targetProtein: userProfile.targetProtein,
          } : {},
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const assistantMessage: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          modelUsed: data.modelUsed || selectedModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get answer');
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Coach Alert**: Could not process your request at this moment (${err?.message || 'Connection error'}). Please try again or select another model.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared. Ready for your next fitness, workout, or nutrition question!`,
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[740px] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Controls Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Personas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline">
            Coach:
          </span>
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                }`}
                title={p.description}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Model Picker & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} {m.isPro ? '★ Pro' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persona Info Banner */}
      <div className="px-4 py-2 bg-emerald-950/20 border-b border-emerald-500/15 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            Active: {PERSONAS.find((p) => p.id === selectedPersona)?.roleTitle}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 hidden sm:inline">
            {PERSONAS.find((p) => p.id === selectedPersona)?.description}
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 font-mono">
          Engine: {selectedModel}
        </span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-600/15'
                      : 'bg-slate-850/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Sub info */}
                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-500 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-emerald-400/70">{msg.modelUsed}</span>
                    </>
                  )}
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-300 ml-1 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400 inline" />
                      ) : (
                        <Copy className="w-3 h-3 inline" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 text-sm text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Coach is analyzing workout kinematics and nutrition guidelines...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">
            Quick Ask:
          </span>
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs text-slate-400 hover:text-emerald-300 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/40 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask anything: workout form, macro splits, recovery, creatine timing..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Coach</span>
          </button>
        </form>
      </div>
    </div>
  );
};
