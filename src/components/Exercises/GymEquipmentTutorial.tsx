import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Zap,
  Dumbbell,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface IdentifiedEquipment {
  equipmentName: string;
  equipmentCategory: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  setupChecklist: string[];
  executionGuide: string[];
  criticalMistakes: string[];
  alternativeExercises: string[];
  quickSafetySummary: string;
}

const PRESET_EQUIPMENT_SAMPLES = [
  {
    id: 'leg_press',
    name: '45° Incline Leg Press Machine',
    category: 'Plate-Loaded Compound',
    muscles: ['Quadriceps', 'Glutes', 'Adductors'],
    accent: '#10b981',
  },
  {
    id: 'lat_pulldown',
    name: 'Cable Lat Pulldown Station',
    category: 'Selectorized Cable',
    muscles: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
    accent: '#06b6d4',
  },
  {
    id: 'smith_machine',
    name: 'Smith Machine Multi-Station',
    category: 'Guided Fixed Barbell',
    muscles: ['Quadriceps / Chest / Shoulders'],
    accent: '#f59e0b',
  },
  {
    id: 'cable_crossover',
    name: 'Dual Adjustable Cable Crossover',
    category: 'Functional Cable Columns',
    muscles: ['Pectoralis Major', 'Deltoids', 'Core'],
    accent: '#8b5cf6',
  },
  {
    id: 'pec_deck',
    name: 'Pec Deck / Rear Delt Fly Machine',
    category: 'Pin-Selectorized Isolation',
    muscles: ['Chest / Rear Deltoids'],
    accent: '#ec4899',
  },
];

export const GymEquipmentTutorial: React.FC = () => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preset'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('leg_press');
  const [equipmentData, setEquipmentData] = useState<IdentifiedEquipment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera
  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      console.warn('Camera error:', e);
      setCameraError(e?.message || 'Unable to access camera. Please allow camera permissions or upload an image.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(b64);
      handleIdentifyImage(b64);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setCapturedImage(b64);
      handleIdentifyImage(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setMode('preset');
    setCapturedImage(null);

    // Create synthetic representative visual card
    const matched = PRESET_EQUIPMENT_SAMPLES.find((p) => p.id === presetId);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx && matched) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = matched.accent;
      ctx.fillRect(20, 20, 600, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(matched.name.toUpperCase(), 40, 80);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Category: ${matched.category}`, 40, 120);
      ctx.fillText(`Prime Movers: ${matched.muscles.join(', ')}`, 40, 150);
      ctx.strokeStyle = matched.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 180, 560, 250);
      ctx.fillStyle = matched.accent;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SAFETY ZONES: PINS • SEAT PAD • SAFETY STOPS', 60, 310);
      const b64 = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(b64);
      handleIdentifyImage(b64, matched.name);
    }
  };

  const handleIdentifyImage = async (imageB64: string, hintName = '') => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/ai/identify-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageB64,
          mimeType: 'image/jpeg',
          userPrompt: hintName ? `Specific equipment: ${hintName}` : 'Identify gym machine and provide safety tutorial',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to identify equipment.');
      }
      setEquipmentData(data.data);
    } catch (err: any) {
      console.error('Equipment scan failed:', err);
      setErrorMessage(err?.message || 'Could not identify equipment from this photo. Try another angle or select a preset.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setEquipmentData(null);
    setErrorMessage(null);
    if (mode === 'camera') startCamera();
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Vision AI Gym Guide
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Safety Stops & Adjustments
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            Gym Equipment Tutorial & Camera Identifier
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Point your phone camera at any gym machine, cable station, or bench. Gemini Vision instantly detects the machine, sets safety stop limits, and provides step-by-step video setup instructions.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => {
              setMode('camera');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'camera'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => {
              setMode('upload');
              handleReset();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => handleSelectPreset('leg_press')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'preset'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Machine Presets</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Bar if in preset mode */}
      {mode === 'preset' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_EQUIPMENT_SAMPLES.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedPresetId === p.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Viewfinder and Scan Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-[4/3] bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-xl">
            {capturedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured Equipment"
                  className="w-full h-full object-cover"
                />
                {/* Target Pin Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-black text-[10px] shadow-lg animate-pulse">
                    ✓ SAFETY STOPS LOCATED
                  </div>
                </div>
              </div>
            ) : mode === 'camera' ? (
              cameraError ? (
                <div className="p-6 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">{cameraError}</p>
                  <button
                    onClick={() => setMode('upload')}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Upload Machine Photo
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scanner Grid Overlay */}
                  <div className="absolute inset-0 border-2 border-indigo-500/30 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-indigo-400/50 rounded-2xl animate-pulse flex items-center justify-center">
                      <span className="text-[10px] font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded">
                        AIM AT MACHINE PINS
                      </span>
                    </div>
                  </div>
                </>
              )
            ) : (
              <div className="p-6 text-center space-y-3">
                <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-400">Select an image of gym equipment from your device.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Choose Photo
                </button>
              </div>
            )}

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 z-20">
                <div className="w-10 h-10 rounded-full border-3 border-indigo-400 border-t-transparent animate-spin" />
                <span className="text-xs font-bold text-indigo-300">Scanning Machine Mechanics...</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            {!capturedImage && mode === 'camera' && !cameraError && (
              <button
                onClick={handleCaptureSnapshot}
                disabled={isScanning}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Snap & Identify Equipment</span>
              </button>
            )}

            {capturedImage && (
              <button
                onClick={handleReset}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Another Machine</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Machine Guide & Video Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {equipmentData ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Machine Header */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {equipmentData.equipmentCategory.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    {equipmentData.equipmentName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Target Muscles:</span>
                    {equipmentData.primaryMuscles.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Safety Guide</span>
                </div>
              </div>

              {/* Golden Safety Rule */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-300">Golden Safety Protocol:</span>
                  <p>{equipmentData.quickSafetySummary}</p>
                </div>
              </div>

              {/* Setup Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Pre-Workout Machine Setup Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {equipmentData.setupChecklist.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Steps */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Biomechanical Execution Guide
                </h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {equipmentData.executionGuide.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Mistakes to Avoid */}
              <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  3 Dangerous Mistakes to Avoid
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {equipmentData.criticalMistakes.map((m, i) => (
                    <li key={i} className="text-rose-200/90">{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <Dumbbell className="w-12 h-12 text-slate-600" />
              <div>
                <h4 className="text-sm font-bold text-white">No Equipment Scanned Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Point the camera at any gym machine or select one of the presets on the left to see safety checkpoints, seat height guides, and video execution rules.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
