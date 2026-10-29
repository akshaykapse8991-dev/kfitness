import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Info,
  Dumbbell,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  Eye,
  Award,
  Video,
  X,
} from 'lucide-react';

interface SetupAdjustment {
  component: string;
  adjustment: string;
}

interface StepGuide {
  stepNumber: number;
  phase: string;
  instruction: string;
}

interface EquipmentData {
  machineName: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  safetyRating: 'BEGINNER_FRIENDLY' | 'MODERATE' | 'ADVANCED_CAUTION' | string;
  setupAdjustments: SetupAdjustment[];
  stepByStepGuide: StepGuide[];
  criticalMistakes: string[];
  proCues: string[];
  suggestedStartingLoad: string;
}

const PRESET_EQUIPMENT_DEMOS = [
  {
    id: 'leg_press',
    name: '45° Incline Leg Press',
    category: 'Plate-Loaded Quad & Glute Machine',
    hint: '45-Degree Incline Seated Leg Press Machine with weight sled and safety stops',
  },
  {
    id: 'lat_pulldown',
    name: 'Seated Lat Pulldown',
    category: 'Selectorized Pin-Stack Back Machine',
    hint: 'High pulley seated cable lat pulldown machine with thigh support pads',
  },
  {
    id: 'cable_crossover',
    name: 'Dual Cable Crossover',
    category: 'Adjustable Pulley Cable System',
    hint: 'Dual adjustable height cable crossover machine with D-handles',
  },
  {
    id: 'smith_machine',
    name: 'Smith Machine Barbell',
    category: 'Guided Fixed-Track Barbell Rig',
    hint: 'Smith machine with vertical guide rails and safety lockout pegs',
  },
  {
    id: 'pec_deck',
    name: 'Pec Deck / Flye Machine',
    category: 'Pin-Selectorized Chest & Rear Delt Machine',
    hint: 'Seated pec deck fly machine with dual lever arms and adjustable seat',
  },
];

interface EquipmentTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExerciseToTrack?: (name: string) => void;
}

export const EquipmentTutorialOverlay: React.FC<EquipmentTutorialOverlayProps> = ({
  isOpen,
  onClose,
  onSelectExerciseToTrack,
}) => {
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | 'demo'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const [equipmentResult, setEquipmentResult] = useState<EquipmentData | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'setup' | 'execution' | 'safety'>('setup');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manage camera
  useEffect(() => {
    if (isOpen && inputMode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, inputMode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err?.message || 'Camera permissions blocked. Upload an image or select a preset.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Take snapshot from video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(640, videoRef.current.videoWidth || 640);
    canvas.height = Math.min(480, videoRef.current.videoHeight || 480);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(b64);
      runIdentification(b64, 'image/jpeg');
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setCapturedImage(b64);
      runIdentification(b64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Preset demo machine
  const handleSelectDemo = (demo: (typeof PRESET_EQUIPMENT_DEMOS)[0]) => {
    setInputMode('demo');
    // Generate synthetic gym equipment frame
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 480);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, 540, 380);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`GYM EQUIPMENT IDENTIFIED: ${demo.name.toUpperCase()}`, 70, 110);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Category: ${demo.category}`, 70, 150);
      ctx.fillText('Pin Selector / Weight Stack Detected • Safe Alignment Loaded', 70, 180);
    }
    const b64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(b64);
    runIdentification(b64, 'image/jpeg', demo.hint);
  };

  // Call AI identification endpoint
  const runIdentification = async (
    imageBase64: string,
    mimeType: string,
    hint: string = ''
  ) => {
    setIsIdentifying(true);
    setEquipmentResult(null);

    try {
      const response = await fetch('/api/ai/identify-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mimeType,
          equipmentNameHint: hint,
          userExperienceLevel: experienceLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to identify gym equipment.');
      }

      setEquipmentResult(data.data);
    } catch (err: any) {
      console.error('Equipment identification failed:', err);
      setCameraError(err?.message || 'Visual machine analysis failed. Try a clearer angle.');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setEquipmentResult(null);
    setCameraError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (inputMode === 'camera') startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini Vision AR Guide
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Gym Safety & Form
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Camera className="w-6 h-6 text-emerald-400" />
              Gym Equipment Identifier & Tutorial Overlay
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Point your camera at any unfamiliar gym machine. Gemini Vision recognizes the equipment and overlays setup pins, biomechanical cues, and injury prevention guides.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto space-y-6 flex-1 pr-1">
          {/* Preset Quick Selectors */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Quick Test Machines:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_EQUIPMENT_DEMOS.slice(0, 3).map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleSelectDemo(demo)}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{demo.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-semibold">Level:</span>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Scanner Viewfinder / Captured Photo Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Viewfinder Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Mode Selectors */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    setInputMode('camera');
                    handleReset();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    inputMode === 'camera'
                      ? 'bg-emerald-600 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>
                <button
                  onClick={() => {
                    setInputMode('upload');
                    handleReset();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    inputMode === 'upload'
                      ? 'bg-emerald-600 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>

              {/* Viewfinder Canvas */}
              <div className="relative aspect-[4/3] bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-xl flex items-center justify-center">
                {capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Captured Equipment"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Image Captured</span>
                    </div>
                  </div>
                ) : inputMode === 'camera' ? (
                  cameraError ? (
                    <div className="p-4 text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-semibold">{cameraError}</p>
                      <button
                        onClick={() => handleSelectDemo(PRESET_EQUIPMENT_DEMOS[0])}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs"
                      >
                        Try Demo Machine
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
                      {/* AR Scanner Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                          <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                        </div>
                        <div className="text-center bg-slate-950/70 py-1 px-3 rounded-full self-center border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                          AIM AT GYM MACHINE / PINS
                        </div>
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                          <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">Select Gym Machine Photo</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {inputMode === 'camera' && !capturedImage && (
                  <button
                    onClick={handleSnapPhoto}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 fill-slate-950" />
                    <span>Identify Machine Now</span>
                  </button>
                )}

                {capturedImage && (
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Different Machine</span>
                  </button>
                )}
              </div>

              {isIdentifying && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                  <span className="text-xs text-emerald-300 font-bold">
                    Gemini Vision recognizing machine pins & biomechanics...
                  </span>
                </div>
              )}
            </div>

            {/* Results / Interactive Tutorial Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {equipmentResult ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Equipment Header Card */}
                  <div className="p-4 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          {equipmentResult.category}
                        </span>
                        <h3 className="text-xl font-black text-white mt-0.5">
                          {equipmentResult.machineName}
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          equipmentResult.safetyRating.includes('BEGINNER')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {equipmentResult.safetyRating.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Target Muscles */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400">Target Muscles:</span>
                      {equipmentResult.primaryMuscles.map((muscle, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/20"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tabs: Setup & Adjustments vs Safe Execution vs Mistakes & Cues */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveStepTab('setup')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeStepTab === 'setup'
                          ? 'bg-emerald-600 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1. Pin & Seat Setup
                    </button>
                    <button
                      onClick={() => setActiveStepTab('execution')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeStepTab === 'execution'
                          ? 'bg-emerald-600 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      2. Execution Tutorial
                    </button>
                    <button
                      onClick={() => setActiveStepTab('safety')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeStepTab === 'safety'
                          ? 'bg-emerald-600 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      3. Hazards & Pro Cues
                    </button>
                  </div>

                  {/* TAB 1: PIN & SEAT SETUP */}
                  {activeStepTab === 'setup' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Machine Adjustments Checklist Before Unracking
                      </h4>
                      <div className="space-y-2">
                        {equipmentResult.setupAdjustments.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="text-xs">
                              <strong className="text-white block">{item.component}</strong>
                              <span className="text-slate-400">{item.adjustment}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                        <span>Suggested Starting Load:</span>
                        <strong className="text-white">{equipmentResult.suggestedStartingLoad}</strong>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EXECUTION TUTORIAL */}
                  {activeStepTab === 'execution' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        Step-by-Step Biomechanical Execution
                      </h4>
                      <div className="space-y-2.5">
                        {equipmentResult.stepByStepGuide.map((step) => (
                          <div
                            key={step.stepNumber}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-emerald-400">
                                Step {step.stepNumber}: {step.phase}
                              </span>
                            </div>
                            <p className="text-slate-300">{step.instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: HAZARDS & PRO CUES */}
                  {activeStepTab === 'safety' && (
                    <div className="space-y-3">
                      {/* Hazards */}
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Critical Mistakes & Joint Hazards to Avoid:
                        </span>
                        <ul className="text-xs text-rose-200 space-y-1.5">
                          {equipmentResult.criticalMistakes.map((m, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pro Cues */}
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 fill-current" />
                          Pro Muscle Recruitment Cues:
                        </span>
                        <ul className="text-xs text-amber-200 space-y-1.5">
                          {equipmentResult.proCues.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Button */}
                  {onSelectExerciseToTrack && (
                    <button
                      onClick={() => {
                        onSelectExerciseToTrack(equipmentResult.machineName);
                        onClose();
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Dumbbell className="w-4 h-4 fill-slate-950" />
                      <span>Track Sets on this Machine Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-950/60 rounded-3xl border border-slate-800">
                  <Dumbbell className="w-12 h-12 text-slate-600 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">No Machine Scanned Yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Snap a photo using the live camera on the left or click any quick test preset (Leg Press, Lat Pulldown, etc.).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
