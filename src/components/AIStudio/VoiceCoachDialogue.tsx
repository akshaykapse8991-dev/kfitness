import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Radio,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Headphones,
} from 'lucide-react';

interface VoiceCoachDialogueProps {
  onWorkoutCuesRequested?: () => void;
}

const COACH_VOICES = [
  { id: 'Zephyr', name: 'Zephyr (Dynamic Trainer)', description: 'Energetic, confident, driving pace' },
  { id: 'Puck', name: 'Puck (High-Energy Coach)', description: 'Upbeat, enthusiastic, motivating' },
  { id: 'Kore', name: 'Kore (Calm & Focused)', description: 'Clear, steady, mindful breathing guidance' },
  { id: 'Fenrir', name: 'Fenrir (Powerlifting Commander)', description: 'Deep, commanding, intensity builder' },
];

const PRESET_VOICE_COMMANDS = [
  'Pump me up for a heavy squat PR set right now!',
  'Give me a 60-second recovery breathing countdown.',
  'How do I fix elbow flare during the barbell bench press?',
  'Quick 3-minute dynamic warm-up before leg day.',
  'Post-workout meal advice for maximum protein synthesis.',
];

export const VoiceCoachDialogue: React.FC<VoiceCoachDialogueProps> = () => {
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [coachStatus, setCoachStatus] = useState<string>('Ready for voice workout commands');
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [coachReplyText, setCoachReplyText] = useState<string>(
    'Press the microphone or tap any workout command below to start hands-free voice coaching!'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio references
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const currentAudioSourceRef = useRef<HTMLAudioElement | null>(null);

  // Stop active playback
  const stopAudio = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.pause();
      currentAudioSourceRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  // Play WAV base64 returned by Gemini Voice TTS
  const playWavBase64 = (base64Audio: string) => {
    try {
      stopAudio();
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      currentAudioSourceRef.current = audio;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);

      audio.play().catch((err) => {
        console.warn('Audio play autoplay policy blocked:', err);
        setIsPlayingAudio(false);
      });
    } catch (e: any) {
      console.error('Audio playback error:', e);
      setIsPlayingAudio(false);
    }
  };

  // Send request to TTS voice coach
  const triggerVoiceResponse = async (userPrompt: string) => {
    try {
      setErrorMsg(null);
      setSpokenTranscript(userPrompt);
      setCoachStatus('Coach is preparing verbal guidance...');
      stopAudio();

      const res = await fetch('/api/ai/voice-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userPrompt,
          voiceName: selectedVoice,
          style: 'Energetic, motivational personal trainer giving clear concise instructions',
        }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        setCoachReplyText(userPrompt);
        setCoachStatus(`Speaking with voice: ${selectedVoice}`);
        playWavBase64(data.audioBase64);
      } else {
        throw new Error(data.error || 'Voice synthesis unavailable');
      }
    } catch (err: any) {
      console.error('Voice coach error:', err);
      setErrorMsg(err?.message || 'Failed to synthesize coach audio');
      setCoachStatus('Ready');
    }
  };

  // Toggle Live WebSocket session with gemini-3.8-live
  const toggleLiveWebSocket = () => {
    if (liveConnected) {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      setLiveConnected(false);
      setCoachStatus('Live session disconnected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      setCoachStatus('Connecting to Gemini 3.8 Live API...');

      ws.onopen = () => {
        setLiveConnected(true);
        setCoachStatus('Live Coach Connected (Gemini 3.8 Live active)');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMsg(`Live API Notice: ${msg.error}`);
          }
          if (msg.audio) {
            playWavBase64(msg.audio);
          }
          if (msg.text) {
            setCoachReplyText(msg.text);
          }
        } catch {}
      };

      ws.onerror = (e) => {
        console.warn('Live WebSocket error:', e);
        setErrorMsg('Live WebSocket connection requires active live tier; TTS fallback is active.');
        setLiveConnected(false);
      };

      ws.onclose = () => {
        setLiveConnected(false);
      };
    } catch (err: any) {
      setErrorMsg(`Could not connect to Live API: ${err.message}`);
    }
  };

  // Handle browser speech input or microphone activation
  const toggleMicrophone = async () => {
    if (isRecording) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setCoachStatus('Microphone stopped');
      return;
    }

    try {
      setErrorMsg(null);
      // Check speech recognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
          setCoachStatus('Listening... Speak your workout question or command!');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          setCoachStatus('Processing your voice instruction...');
          triggerVoiceResponse(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
          setCoachStatus('Speech detection ended.');
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        // Fallback: Request microphone permission directly
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsRecording(true);
        setCoachStatus('Microphone active. (Browser Speech API not supported; click a voice prompt below!)');
      }
    } catch (micErr: any) {
      console.error('Microphone access denied:', micErr);
      setErrorMsg('Microphone access denied or unavailable. You can tap any preset voice command below!');
      setIsRecording(false);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (webSocketRef.current) webSocketRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 gap-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-emerald-400" />
              Live Fitness Coach & Voice Dialogue
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              gemini-3.8-live / TTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hands-free audio coaching for heavy sets, rest intervals, and live technique cues.
          </p>
        </div>

        {/* Live WebSocket Bridge & Voice Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none cursor-pointer"
            >
              {COACH_VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleLiveWebSocket}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              liveConnected
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${liveConnected ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>{liveConnected ? 'Disconnect Live' : 'Connect Live WS'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/80 rounded-2xl border border-slate-800/80 relative overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isPlayingAudio
              ? 'bg-emerald-500/20 scale-125'
              : isRecording
              ? 'bg-red-500/20 scale-110'
              : 'bg-teal-500/10 scale-90'
          }`}
        />

        {/* Status Pill */}
        <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlayingAudio
                ? 'bg-emerald-400 animate-ping'
                : isRecording
                ? 'bg-red-400 animate-bounce'
                : 'bg-teal-400'
            }`}
          />
          <span className="font-medium">{coachStatus}</span>
        </div>

        {/* Central Visualizer & Mic Button */}
        <div className="relative flex items-center justify-center">
          {/* Animated concentric rings */}
          {isPlayingAudio && (
            <>
              <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30 animate-ping" />
              <div className="absolute w-56 h-56 rounded-full border border-teal-500/20 animate-pulse" />
            </>
          )}

          <button
            onClick={toggleMicrophone}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 ${
              isRecording
                ? 'bg-red-600 text-white shadow-red-500/40 ring-4 ring-red-400/40 animate-pulse'
                : isPlayingAudio
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/40 ring-4 ring-emerald-400/30'
                : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border-2 border-emerald-500/40 shadow-emerald-500/15'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10" />
            ) : isPlayingAudio ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
              {isRecording ? 'Listening' : isPlayingAudio ? 'Speaking' : 'Push to Talk'}
            </span>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-4 mt-6">
          {isPlayingAudio && (
            <button
              onClick={stopAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-500/30 text-xs font-semibold transition"
            >
              <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
              Stop Audio
            </button>
          )}
        </div>

        {/* Spoken Text Display */}
        <div className="w-full max-w-xl mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 text-center">
          <p className="text-xs uppercase font-bold text-slate-500 mb-1 tracking-wider">
            Coach Dialogue Display
          </p>
          <p className="text-sm text-slate-200 font-medium italic">
            "{coachReplyText}"
          </p>
          {spokenTranscript && spokenTranscript !== coachReplyText && (
            <p className="text-xs text-emerald-400/80 mt-2">
              User Command: <span className="text-slate-300">{spokenTranscript}</span>
            </p>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Voice Workout Commands */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-emerald-400" />
          Quick Voice Coaching Commands (Tap to Trigger Voice Output):
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_VOICE_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => triggerVoiceResponse(cmd)}
              className="p-3 text-left rounded-xl bg-slate-950/70 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition flex items-start gap-2.5 group"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 shrink-0 mt-0.5 transition" />
              <span>{cmd}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
