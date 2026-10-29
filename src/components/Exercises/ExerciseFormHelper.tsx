import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Camera,
  Upload,
  Play,
  Square,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  ChevronRight,
  Eye,
  Award,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  Volume2,
} from 'lucide-react';

interface FormPhase {
  phaseName: string;
  rating: 'EXCELLENT' | 'ACCEPTABLE' | 'FAULT' | string;
  observation: string;
}

interface JointCheck {
  status: string;
  details: string;
}

interface FormAnalysisResult {
  exerciseDetected: string;
  formScore: number;
  safetyStatus: 'SAFE' | 'NEEDS_ATTENTION' | 'INJURY_RISK' | string;
  repCount: number;
  tempoAssessment: string;
  summaryVerdict: string;
  phases: FormPhase[];
  jointBiomechanics: {
    spine: JointCheck;
    knees: JointCheck;
    hips: JointCheck;
    barPath: JointCheck;
  };
  primaryFaults: string[];
  safetyWarnings: string[];
  correctiveCues: string[];
  recommendedDrills?: { name: string; purpose: string }[];
}

const COMMON_LIFTS = [
  { id: 'barbell_squat', name: 'Barbell Back Squat', focus: ['Spine Neutrality', 'Depth Below Parallel', 'Knee Valgus'] },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift (RDL)', focus: ['Hip Hinge', 'Lumbar Neutrality', 'Bar Proximity'] },
  { id: 'conventional_deadlift', name: 'Conventional Deadlift', focus: ['Starting Hip Height', 'Lat Engagement', 'Lockout'] },
  { id: 'bench_press', name: 'Barbell Bench Press', focus: ['Elbow Flare Angle', 'Arch & Scapular Retraction', 'Touch Point'] },
  { id: 'overhead_press', name: 'Overhead Press (OHP)', focus: ['Core Brace', 'Head Path', 'Full Lockout'] },
  { id: 'barbell_row', name: 'Barbell Bent-Over Row', focus: ['Torso Stability', 'Elbow Drive', 'Momentum Control'] },
  { id: 'pull_up', name: 'Pull-Up / Chin-Up', focus: ['Full Range of Motion', 'Scapular Depression', 'No Kip'] },
  { id: 'push_up', name: 'Push-Up', focus: ['Plank Line', 'Elbow 45° Angle', 'Full Chest Touch'] },
];

export const ExerciseFormHelper: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string>('Barbell Back Squat');
  const [customExercise, setCustomExercise] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'Spine Neutrality',
    'Depth & Range of Motion',
    'Knee Tracking',
  ]);

  // Video capture states
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | 'demo'>('camera');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('video/mp4');
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('Initializing analysis...');
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const frameIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toggle camera stream
  useEffect(() => {
    if (inputMode === 'camera' && !recordedVideoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, recordedVideoUrl]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err?.message || 'Unable to access camera. Please allow camera permissions or upload a video instead.'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start recording with 3-second countdown
  const handleInitiateRecording = () => {
    if (isRecording) return;
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    if (!mediaStreamRef.current) return;
    chunksRef.current = [];
    const frames: string[] = [];

    // Setup MediaRecorder
    let options: MediaRecorderOptions = { mimeType: 'video/webm' };
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      options = { mimeType: 'video/mp4;codecs=avc1' };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = options.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setVideoMimeType(mime.split(';')[0]);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          setRecordedBase64(b64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500); // 500ms slices
      setIsRecording(true);
      setRecordingSeconds(0);

      // Record timer
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 18) {
            // Auto cap at 18 seconds (plenty for 3-5 reps)
            handleStopRecording();
            return 18;
          }
          return prev + 1;
        });
      }, 1000);

      // Frame sampler (captures 1 frame per 1.5s as high-fidelity visual context)
      const canvas = document.createElement('canvas');
      frameIntervalRef.current = setInterval(() => {
        if (liveVideoRef.current && liveVideoRef.current.videoWidth) {
          canvas.width = Math.min(480, liveVideoRef.current.videoWidth);
          canvas.height = Math.min(360, liveVideoRef.current.videoHeight);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(liveVideoRef.current, 0, 0, canvas.width, canvas.height);
            const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
            frames.push(frameBase64);
            setCapturedFrames([...frames]);
          }
        }
      }, 1500);
    } catch (e: any) {
      console.error('Failed to create MediaRecorder:', e);
      setCameraError('Recording failed: ' + e?.message);
    }
  };

  const handleStopRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 45 * 1024 * 1024) {
      setAnalysisError('Video file exceeds 45MB. Please upload a shorter 5-15 second clip of your lift.');
      return;
    }

    const url = URL.createObjectURL(file);
    setRecordedVideoUrl(url);
    setVideoMimeType(file.type || 'video/mp4');

    const reader = new FileReader();
    reader.onloadend = () => {
      setRecordedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Also extract sample frames using a temporary video element
    const tempVid = document.createElement('video');
    tempVid.src = url;
    tempVid.muted = true;
    tempVid.crossOrigin = 'anonymous';
    tempVid.onloadeddata = () => {
      tempVid.currentTime = Math.min(1, tempVid.duration / 2);
    };
    tempVid.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(tempVid, 0, 0, 480, 360);
        setCapturedFrames([canvas.toDataURL('image/jpeg', 0.8)]);
      }
    };
  };

  // Load interactive demo
  const handleLoadDemo = (liftType: 'squat' | 'rdl') => {
    setInputMode('demo');
    setRecordedVideoUrl(null);
    setSelectedExercise(liftType === 'squat' ? 'Barbell Back Squat' : 'Romanian Deadlift (RDL)');
    setUserNotes(
      liftType === 'squat'
        ? 'Heavy set of 4 reps at 100kg. Checking depth and knee stability.'
        : 'Working set of 6 reps at 80kg. Checking hamstring tension and lumbar neutrality.'
    );

    // Generate high-resolution representative canvas frames for biomechanical analysis
    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Frame 1: Stance & Setup
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 480, 360);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 400, 280);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(liftType === 'squat' ? 'DEMO SQUAT: REP 1 SETUP' : 'DEMO RDL: SETUP', 80, 100);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Feet shoulder-width • Bar racked across rear delts • Core braced', 80, 140);
      frames.push(canvas.toDataURL('image/jpeg', 0.9));

      // Frame 2: Bottom Depth
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 480, 360);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(liftType === 'squat' ? 'DEMO SQUAT: HOLE DEPTH (AT PARALLEL)' : 'DEMO RDL: MAX HINGE', 80, 100);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Femur parallel to floor • Slight lumbar flex • Knees tracking over toes', 80, 140);
      frames.push(canvas.toDataURL('image/jpeg', 0.9));
    }

    setCapturedFrames(frames);
    setRecordedBase64(frames[0]);
    setVideoMimeType('image/jpeg');
  };

  const handleResetVideo = () => {
    setRecordedVideoUrl(null);
    setRecordedBase64(null);
    setCapturedFrames([]);
    setAnalysisResult(null);
    setAnalysisError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (inputMode === 'camera') {
      startCamera();
    }
  };

  const toggleFocusItem = (item: string) => {
    setSelectedFocus((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  // Perform AI Form Analysis
  const handleAnalyzeForm = async () => {
    if (!recordedBase64 && capturedFrames.length === 0) {
      setAnalysisError('Please record or upload a video clip of your lift first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress('Uploading clip to Gemini Vision engine...');

    const activeExerciseName =
      selectedExercise === 'Custom Lift' ? customExercise || 'Exercise Lift' : selectedExercise;

    const progressTimer = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev.includes('Uploading')) return 'Tracking joint skeleton & center of gravity...';
        if (prev.includes('joint skeleton')) return 'Analyzing bar path verticality & pelvic angles...';
        if (prev.includes('bar path')) return 'Synthesizing injury safety score & corrective cues...';
        return 'Finalizing biomechanical feedback...';
      });
    }, 2200);

    try {
      const response = await fetch('/api/ai/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video: recordedBase64,
          mimeType: videoMimeType,
          frames: capturedFrames,
          exerciseName: activeExerciseName,
          userNotes,
          targetFocus: selectedFocus,
        }),
      });

      const data = await response.json();
      clearInterval(progressTimer);

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Server failed to analyze exercise video.');
      }

      setAnalysisResult(data.data);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Form analysis failed:', err);
      setAnalysisError(err?.message || 'Failed to complete biomechanical analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Speak cues aloud using Web Speech API
  const handleReadCuesAloud = () => {
    if (!analysisResult?.correctiveCues?.length) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `Here are your cues for the next set: ${analysisResult.correctiveCues.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.8 Multimodal Vision
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CSCS Biomechanics
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Camera className="w-6 h-6 text-indigo-400" />
              AI Exercise Form Helper
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Record or upload a 5–15 second clip of your squats, deadlifts, bench, or presses. Gemini Vision tracks joint angles, detects spinal flexion or knee valgus, and delivers instant safety corrections.
            </p>
          </div>

          {/* Quick Demo Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadDemo('squat')}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Squat Demo</span>
            </button>
            <button
              onClick={() => handleLoadDemo('rdl')}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>RDL Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Video / Capture, Right Exercise Setup & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder & Media Recorder (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setInputMode('camera');
                  setRecordedVideoUrl(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'camera'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>
              <button
                onClick={() => {
                  setInputMode('upload');
                  setRecordedVideoUrl(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Video</span>
              </button>
              <button
                onClick={() => handleLoadDemo('squat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'demo'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sample Data</span>
              </button>
            </div>

            {recordedVideoUrl && (
              <button
                onClick={handleResetVideo}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-record</span>
              </button>
            )}
          </div>

          {/* Viewfinder / Video Container */}
          <div className="relative aspect-[4/3] bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center">
                <span className="text-8xl font-black text-amber-400 animate-ping">
                  {countdown}
                </span>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-300 mt-4">
                  Get into starting position!
                </span>
              </div>
            )}

            {/* Display recorded video preview if exists */}
            {recordedVideoUrl ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={previewVideoRef}
                  src={recordedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-500/90 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clip Ready ({recordingSeconds > 0 ? `${recordingSeconds}s` : 'Uploaded'})</span>
                </div>
              </div>
            ) : inputMode === 'camera' ? (
              /* Live Camera Stream */
              <div className="relative w-full h-full bg-slate-950">
                {cameraError ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                    <p className="text-sm font-semibold text-slate-200">{cameraError}</p>
                    <button
                      onClick={() => setInputMode('upload')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500"
                    >
                      Switch to File Upload
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Biomechanical Alignment Overlay Grid */}
                    <div className="absolute inset-0 pointer-events-none border border-indigo-500/20">
                      {/* Vertical Midline for Bar Path */}
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-indigo-500/30 border-dashed" />
                      {/* Depth Target Line */}
                      <div className="absolute left-0 right-0 top-2/3 h-0.5 bg-amber-500/30 border-dashed" />
                      {/* Head Guide Box */}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border border-indigo-400/20" />
                      {/* Corner Target Markers */}
                      <div className="absolute top-4 left-4 text-[10px] font-mono text-indigo-400 bg-slate-950/60 px-2 py-0.5 rounded">
                        FRAME: 480p • LIVE
                      </div>
                    </div>

                    {/* Recording Status Banner */}
                    {isRecording && (
                      <div className="absolute top-4 right-4 bg-rose-600/90 text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-2 animate-pulse shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        <span>RECORDING {recordingSeconds}s / 18s</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : inputMode === 'upload' ? (
              /* File Upload Zone */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Upload Exercise Video</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Select a 5–20 second video clip of your lift (.mp4, .webm, or .mov up to 45MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Choose Video File
                </button>
              </div>
            ) : (
              /* Demo Sample Container */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/60">
                <Sparkles className="w-12 h-12 text-indigo-400 animate-bounce" />
                <h3 className="text-base font-bold text-white">Sample Lift Data Loaded</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Loaded pre-recorded test rep sequence for "{selectedExercise}". Ready to run full biomechanical analysis.
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Keyframe snapshots captured (2 frames)</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            {inputMode === 'camera' && !recordedVideoUrl ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isRecording ? (
                  <button
                    onClick={handleInitiateRecording}
                    disabled={countdown !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Start Recording Set</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording ({recordingSeconds}s)</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">
                  3s countdown before recording starts
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {recordedVideoUrl ? 'Clip captured. Review before analyzing.' : 'Ready to analyze.'}
              </div>
            )}

            {/* Run Analysis Action */}
            <button
              onClick={handleAnalyzeForm}
              disabled={isAnalyzing || (!recordedBase64 && capturedFrames.length === 0)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-xl shadow-indigo-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Biomechanics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Form with Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Progress Banner */}
          {isAnalyzing && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-indigo-300">Biomechanical Neural Analysis</span>
                <p className="text-xs text-slate-300">{analysisProgress}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {analysisError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <p>{analysisError}</p>
            </div>
          )}
        </div>

        {/* Right Column: Exercise Configuration & Guidelines (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Lift & Analysis Parameters
            </h3>

            {/* Exercise Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Select Lift to Analyze</label>
              <select
                value={selectedExercise}
                onChange={(e) => {
                  setSelectedExercise(e.target.value);
                  const matched = COMMON_LIFTS.find((l) => l.name === e.target.value);
                  if (matched) {
                    setSelectedFocus(matched.focus);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {COMMON_LIFTS.map((lift) => (
                  <option key={lift.id} value={lift.name}>
                    {lift.name}
                  </option>
                ))}
                <option value="Custom Lift">+ Custom Exercise</option>
              </select>

              {selectedExercise === 'Custom Lift' && (
                <input
                  type="text"
                  placeholder="Enter exercise name (e.g., Bulgarian Split Squat)"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Target Focus Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Key Checkpoints & Priorities</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Spine Neutrality',
                  'Depth & Range of Motion',
                  'Knee Tracking',
                  'Bar Path Verticality',
                  'Hip Hinge & Pelvic Tilt',
                  'Elbow Angle',
                  'Core Bracing & Breathing',
                ].map((focus) => {
                  const active = selectedFocus.includes(focus);
                  return (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleFocusItem(focus)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {focus}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Lifter Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Lifter Context & Fatigue Notes</label>
              <textarea
                rows={2}
                placeholder="e.g., Working set at 90kg, feeling slight lower back fatigue, checking parallel depth"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Recording Best Practices */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Camera Angles for Optimal Feedback
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-300">Squats & Deadlifts:</strong> 45° front-side or pure side profile at waist height.</li>
                <li><strong className="text-slate-300">Bench & Press:</strong> 45° angle showing wrist, elbow, and chest touch point.</li>
                <li>Ensure full body (head to feet) and barbell are visible in frame.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results Section */}
      {analysisResult && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Biomechanical Evaluation: {analysisResult.exerciseDetected}
            </h3>
            {analysisResult.correctiveCues?.length > 0 && (
              <button
                onClick={handleReadCuesAloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-600/30 transition-all cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Next-Set Cues</span>
              </button>
            )}
          </div>

          {/* Scorecards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Overall Form Score
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span
                  className={`text-4xl font-black ${
                    analysisResult.formScore >= 80
                      ? 'text-emerald-400'
                      : analysisResult.formScore >= 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {analysisResult.formScore}
                </span>
                <span className="text-slate-400 font-bold text-sm">/ 100</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    analysisResult.formScore >= 80
                      ? 'bg-emerald-500'
                      : analysisResult.formScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, analysisResult.formScore)}%` }}
                />
              </div>
            </div>

            {/* Safety Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Safety Classification
              </span>
              <div className="my-2">
                {analysisResult.safetyStatus === 'SAFE' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Safe Execution</span>
                  </div>
                ) : analysisResult.safetyStatus === 'NEEDS_ATTENTION' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Deviations Noted</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-sm">
                    <Flame className="w-4 h-4" />
                    <span>Injury Risk Detected</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {analysisResult.safetyStatus === 'SAFE'
                  ? 'Joints aligned within safe biomechanical parameters.'
                  : 'Compensations may overload connective tissue under heavy load.'}
              </p>
            </div>

            {/* Reps Detected */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Reps & Cadence
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-white">{analysisResult.repCount}</span>
                <span className="text-xs text-slate-400 ml-1.5 font-bold">Reps Tracked</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Tempo: {analysisResult.tempoAssessment || 'Controlled cadence'}
              </p>
            </div>

            {/* Coaching Verdict */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Coach's Summary
              </span>
              <p className="text-xs text-slate-300 line-clamp-3 mt-1 italic">
                "{analysisResult.summaryVerdict}"
              </p>
              <span className="text-[10px] text-slate-500">CSCS Form Assessment</span>
            </div>
          </div>

          {/* Safety Warning Banner (if any) */}
          {analysisResult.safetyWarnings && analysisResult.safetyWarnings.length > 0 && (
            <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Critical Safety & Injury Prevention Alerts</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-200">
                {analysisResult.safetyWarnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Golden Corrective Cues for Next Set */}
          {analysisResult.correctiveCues && analysisResult.correctiveCues.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Golden Cues For Your Next Set (Mental Checklist)</span>
                </div>
                <span className="text-[11px] text-slate-400">Recite these before un-racking</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {analysisResult.correctiveCues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-3.5 space-y-1 shadow-md"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>Cue #{idx + 1}</span>
                    </div>
                    <p className="text-xs text-white font-semibold">{cue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Joint Biomechanics Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Joint Biomechanics & Load Pathway
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Spine */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Spine & Lumbar</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      analysisResult.jointBiomechanics?.spine?.status?.toLowerCase().includes('good') ||
                      analysisResult.jointBiomechanics?.spine?.status?.toLowerCase().includes('neutral')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {analysisResult.jointBiomechanics?.spine?.status || 'Neutral'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {analysisResult.jointBiomechanics?.spine?.details || 'Spinal curvature evaluated.'}
                </p>
              </div>

              {/* Knees */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Knees & Valgus</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      analysisResult.jointBiomechanics?.knees?.status?.toLowerCase().includes('good') ||
                      analysisResult.jointBiomechanics?.knees?.status?.toLowerCase().includes('stable')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {analysisResult.jointBiomechanics?.knees?.status || 'Tracking'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {analysisResult.jointBiomechanics?.knees?.details || 'Knee lateral stability evaluated.'}
                </p>
              </div>

              {/* Hips */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Hips & Depth</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      analysisResult.jointBiomechanics?.hips?.status?.toLowerCase().includes('good') ||
                      analysisResult.jointBiomechanics?.hips?.status?.toLowerCase().includes('parallel')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {analysisResult.jointBiomechanics?.hips?.status || 'Hinge Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {analysisResult.jointBiomechanics?.hips?.details || 'Hip depth and pelvis tracked.'}
                </p>
              </div>

              {/* Bar Path */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Bar / Load Path</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      analysisResult.jointBiomechanics?.barPath?.status?.toLowerCase().includes('vertical') ||
                      analysisResult.jointBiomechanics?.barPath?.status?.toLowerCase().includes('good')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {analysisResult.jointBiomechanics?.barPath?.status || 'Midfoot'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {analysisResult.jointBiomechanics?.barPath?.details || 'Trajectory balance assessed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Phase-by-Phase Breakdown */}
          {analysisResult.phases && analysisResult.phases.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Phase-by-Phase Execution Analysis
              </h4>

              <div className="space-y-2.5">
                {analysisResult.phases.map((ph, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-extrabold shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white">{ph.phaseName}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{ph.observation}</p>
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                        ph.rating === 'EXCELLENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ph.rating === 'ACCEPTABLE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {ph.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Corrective Drills */}
          {analysisResult.recommendedDrills && analysisResult.recommendedDrills.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recommended Corrective & Mobility Drills
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisResult.recommendedDrills.map((drill, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <span className="text-xs font-bold text-emerald-400">{drill.name}</span>
                    <p className="text-xs text-slate-400">{drill.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
