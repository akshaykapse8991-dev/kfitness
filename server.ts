import express from 'express';
import http from 'http';
import { GoogleGenAI, Type, ThinkingLevel, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Body parser with larger payload support for food images, audio, and exercise videos
app.use(express.json({ limit: '65mb' }));
app.use(express.urlencoded({ extended: true, limit: '65mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), hasApiKey: !!apiKey });
});

// Android APK Download Route
app.get('/api/download-apk', (req, res) => {
  const primaryApk = path.resolve(__dirname, 'APK_DOWNLOAD', 'app-debug.apk');
  const backupApk = path.resolve(__dirname, '.build-outputs', 'app-debug.apk');
  const targetPath = fs.existsSync(primaryApk) ? primaryApk : fs.existsSync(backupApk) ? backupApk : null;
  
  if (targetPath) {
    res.download(targetPath, 'KapseFitness-v2.5.apk');
  } else {
    res.status(404).json({ error: 'APK file not found' });
  }
});

// =========================================================================
// 1. AI CAMERA FOOD NUTRITION SCANNER
// =========================================================================
app.post('/api/scan-food', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', userGoal = 'Fat Loss' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    let base64Data = image;
    let actualMime = mimeType;
    if (image.includes(',')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        actualMime = match[1];
        base64Data = match[2];
      } else {
        base64Data = image.split(',')[1];
      }
    }

    const prompt = `Analyze this food image in deep detail, with high accuracy for Indian and global dishes.
User's current fitness goal: "${userGoal}".
Identify every distinct food item on the plate, estimate standard realistic portion weights in grams/servings, and compute the nutritional macros (Calories, Protein in grams, Total Carbohydrates in grams, Fats in grams, Dietary Fiber in grams).
Identify if each item is Vegetarian (isVeg: true/false).
Provide a total calorie and macro sum, a health score (1 to 10), an overall nutritional verdict, and 2-3 actionable diet tips tailored to the user's fitness goal.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: actualMime,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: {
              type: Type.STRING,
              description: 'Clear name of the detected dish or plate (e.g. "North Indian Thali: 2 Rotis, Dal Tadka & Paneer Bhurji")',
            },
            items: {
              type: Type.ARRAY,
              description: 'List of individual food components detected on the plate',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Food item name' },
                  portionDescription: { type: Type.STRING, description: 'Estimated portion size' },
                  estimatedGrams: { type: Type.NUMBER, description: 'Estimated weight in grams' },
                  calories: { type: Type.NUMBER, description: 'Total calories for this portion' },
                  protein: { type: Type.NUMBER, description: 'Protein in grams' },
                  carbs: { type: Type.NUMBER, description: 'Carbohydrates in grams' },
                  fat: { type: Type.NUMBER, description: 'Fats in grams' },
                  fiber: { type: Type.NUMBER, description: 'Dietary fiber in grams' },
                  isVeg: { type: Type.BOOLEAN, description: 'Whether this specific item is vegetarian' },
                },
                required: ['name', 'portionDescription', 'calories', 'protein', 'carbs', 'fat', 'isVeg'],
              },
            },
            totalCalories: { type: Type.NUMBER, description: 'Total calories across all items' },
            totalProtein: { type: Type.NUMBER, description: 'Total protein in grams' },
            totalCarbs: { type: Type.NUMBER, description: 'Total carbohydrates in grams' },
            totalFat: { type: Type.NUMBER, description: 'Total fats in grams' },
            totalFiber: { type: Type.NUMBER, description: 'Total fiber in grams' },
            healthScore: { type: Type.NUMBER, description: 'Rating from 1 to 10 on nutritional balance' },
            verdict: { type: Type.STRING, description: '2-3 sentence assessment of the meal nutritional value' },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable tips according to user goal',
            },
          },
          required: ['mealName', 'items', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'healthScore', 'verdict', 'suggestions'],
        },
      },
    });

    const textOutput = response.text || '{}';
    const parsedData = JSON.parse(textOutput);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning food:', error);
    res.status(500).json({
      error: 'Failed to analyze food image',
      details: error?.message || 'Unknown error occurred while contacting AI model',
    });
  }
});

// =========================================================================
// 2. AI DIET PLAN GENERATOR
// =========================================================================
app.post('/api/generate-diet-plan', async (req, res) => {
  try {
    const {
      goal = 'Fat Loss',
      targetCalories = 2000,
      preference = 'Veg Only',
      targetProtein = 120,
      lifestyle = 'Office Worker / Gym 4x week',
    } = req.body;

    const prompt = `Generate a realistic, authentic, and delicious full-day Indian diet plan tailored to:
- Fitness Goal: ${goal}
- Target Daily Calories: ${targetCalories} kcal
- Target Protein: ${targetProtein}g
- Diet Preference: ${preference} (strictly honor vegetarian / non-veg / eggetarian guidelines)
- Lifestyle: ${lifestyle}

Provide an organized schedule covering Early Morning, Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner, and Bedtime. Include authentic Indian foods with accurate macros.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            goal: { type: Type.STRING },
            dietaryPreference: { type: Type.STRING },
            dailyTotals: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER },
              },
              required: ['calories', 'protein', 'carbs', 'fat'],
            },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING },
                  mealName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        portion: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER },
                        isVeg: { type: Type.BOOLEAN },
                      },
                      required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'isVeg'],
                    },
                  },
                  mealCalories: { type: Type.NUMBER },
                  mealProtein: { type: Type.NUMBER },
                  cookingOrHealthTip: { type: Type.STRING },
                },
                required: ['timeSlot', 'mealName', 'items', 'mealCalories', 'mealProtein'],
              },
            },
            hydrationAdvice: { type: Type.STRING },
            keyGuidelines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            groceryList: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Weekly grocery essentials required for this plan',
            },
          },
          required: ['planTitle', 'dailyTotals', 'meals', 'hydrationAdvice', 'keyGuidelines', 'groceryList'],
        },
      },
    });

    const textOutput = response.text || '{}';
    const parsedData = JSON.parse(textOutput);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating diet plan:', error);
    res.status(500).json({
      error: 'Failed to generate personalized diet plan',
      details: error?.message || 'AI service error',
    });
  }
});

// =========================================================================
// 3. GEMINI CHATBOT (Multi-turn with model picker & role-based personas)
// Models: gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite
// =========================================================================
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  strength: `You are "Coach Vikram", an elite Certified Strength & Conditioning Specialist (CSCS) and hypertrophy coach with Kapse Fitness.
Focus on evidence-based resistance training, progressive overload, RPE (Rate of Perceived Exertion), biomechanics, periodization, and injury prevention.
Be encouraging, analytical, structured, and give direct actionable workout protocols with sets, reps, and rest timers. Format key takeaways in clean markdown bullet points.`,

  nutrition: `You are "Dr. Ananya", an expert Indian Sports Nutritionist and Dietitian with Kapse Fitness.
Specialties: Indian vegetarian and non-vegetarian macro optimization, bioavailable plant proteins (paneer, soya chunks, sprouts, dal combinations), meal timing, micronutrients, hydration, and healthy desi swaps.
Provide clear gram-accurate macro breakdowns, portion recommendations, and practical cooking/prep tips. Always emphasize long-term metabolic health.`,

  biomechanics: `You are "Dr. Rajesh", a clinical Biomechanics Researcher and Physical Therapist specializing in joint kinematics, injury rehabilitation, and mobility optimization.
Analyze movement patterns (squat depth, hip hinge, shoulder impingement in presses, spinal neutrality in deadlifts), muscle recruitment angles, and active recovery routines. Explain physiological mechanisms clearly and give regression/progression cues.`,

  general: `You are the lead AI Personal Trainer and Fitness Coach at Kapse Fitness.
You help users with customized workouts, Indian nutrition planning, goal tracking, habit discipline, and daily motivation.
Deliver clear, inspiring, practical advice tailored to the user's specific fitness goals. Use markdown formatting with clear headings, bold metrics, and bulleted action steps.`,
};

app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.8-flash',
      persona = 'general',
      userContext = {},
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Validate model selection strictly from approved list
    let chosenModel = 'gemini-3.8-flash';
    if (model === 'gemini-4-argon') chosenModel = 'gemini-4-argon';
    else if (model === 'gemini-3.1-flash-lite') chosenModel = 'gemini-3.1-flash-lite';
    else chosenModel = 'gemini-3.8-flash';

    const baseInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.general;
    const contextPrompt = userContext && Object.keys(userContext).length > 0
      ? `\n[User Profile Context: Goal: ${userContext.goal || 'General Fitness'}, Weight: ${userContext.weightKg || 'N/A'}kg, Daily Calorie Target: ${userContext.targetCalories || 'N/A'} kcal, Target Protein: ${userContext.targetProtein || 'N/A'}g]`
      : '';

    const systemInstruction = `${baseInstruction}${contextPrompt}`;

    // Format chat contents according to @google/genai guidelines
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      // Keep recent turns to prevent context blowup while maintaining conversation memory
      const recentTurns = history.slice(-10);
      for (const turn of recentTurns) {
        if (turn.content && typeof turn.content === 'string') {
          contents.push({
            role: turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.content }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let response;
    let actualModelUsed = chosenModel;

    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents,
        config: {
          systemInstruction,
          ...(chosenModel === 'gemini-4-argon' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {}),
        },
      });
    } catch (modelErr: any) {
      // If gemini-4-argon fails due to billing or paid requirement, automatically fallback to gemini-3.8-flash
      if (chosenModel === 'gemini-4-argon') {
        console.warn('gemini-4-argon failed, falling back to gemini-3.8-flash:', modelErr?.message);
        actualModelUsed = 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: { systemInstruction },
        });
      } else {
        throw modelErr;
      }
    }

    const reply = response.text || 'I am ready to assist your fitness journey.';
    res.json({
      success: true,
      reply,
      modelUsed: actualModelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate chat response',
      details: error?.message || 'AI service error',
    });
  }
});

// =========================================================================
// 4. GOOGLE SEARCH GROUNDING (Fitness, Nutrition & Workout Science)
// Model: gemini-3.8-flash with googleSearch tool
// =========================================================================
app.post('/api/ai/search-science', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const prompt = `Conduct a rigorous, scientifically grounded review answering this fitness or nutrition inquiry: "${query}".
Break down:
1. Scientific Consensus & Latest Research Findings
2. Practical Implementation (Sets, Timing, Dosages, or Form adjustments)
3. Common Myths vs Evidence-Based Reality
Keep the tone authoritative, practical, and backed by research.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    // Extract real web sources with title and URL
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Scientific Reference',
        uri: chunk.web.uri,
      }));

    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    res.json({
      success: true,
      answer: text,
      sources,
      webSearchQueries,
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({
      error: 'Failed to query fitness science database',
      details: error?.message || 'Google Search Grounding error',
    });
  }
});

// =========================================================================
// 5. GOOGLE MAPS GROUNDING (Nearby Gyms, Tracks, Studios & Health Stores)
// Model: gemini-3.8-flash with googleMaps tool
// =========================================================================
app.post('/api/ai/nearby-fitness', async (req, res) => {
  try {
    const {
      category = 'Gyms & Fitness Centers',
      locationName,
      latitude,
      longitude,
    } = req.body;

    const locDescription = locationName
      ? `in or around ${locationName}`
      : (latitude && longitude ? `near coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : 'nearby');

    const prompt = `Find the highest-rated ${category} ${locDescription}.
Provide an engaging overview of the top 3-5 places including their standout amenities, equipment quality, specialty training areas (free weights, calisthenics, functional turf, recovery sauna), and vibe.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];

    // Extract Maps places according to SKILL.md specification
    const places: Array<{ title: string; uri: string; snippets: string[] }> = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.maps && chunk.maps.uri) {
          const snippets: string[] = [];
          if (chunk.maps.placeAnswerSources?.reviewSnippets) {
            for (const r of (chunk.maps.placeAnswerSources.reviewSnippets as any[])) {
              const snippetText = r.review || r.snippet;
              if (snippetText) snippets.push(snippetText);
            }
          }
          places.push({
            title: chunk.maps.title || 'Fitness Center',
            uri: chunk.maps.uri,
            snippets,
          });
        }
      }
    }

    res.json({
      success: true,
      answer: text,
      places,
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    res.status(500).json({
      error: 'Failed to search nearby fitness locations',
      details: error?.message || 'Google Maps Grounding error',
    });
  }
});

// =========================================================================
// 6. WORKOUT BEATS GENERATOR (Lyria Music: lyria-3-clip-preview & lyria-3-pro-preview)
// Streams audio chunks; falls back gracefully if paid model is unavailable
// =========================================================================
app.post('/api/ai/generate-beats', async (req, res) => {
  try {
    const {
      prompt,
      model = 'lyria-3-clip-preview',
      bpm = 135,
      genre = 'Cyberpunk Synthwave',
      duration = 'clip', // 'clip' (30s) or 'pro' (full track)
    } = req.body;

    const chosenModel = duration === 'pro' || model === 'lyria-3-pro-preview'
      ? 'lyria-3-pro-preview'
      : 'lyria-3-clip-preview';

    const fullPrompt = prompt
      ? `${prompt}, ${bpm} BPM, energetic workout motivation, heavy bassline, driving percussion.`
      : `High-octane ${genre} workout beat at ${bpm} BPM. Powerful rhythmic drops, deep punchy 808 kick, driving synth arpeggios, ideal for heavy weightlifting and intense cardio PRs.`;

    try {
      const response = await ai.models.generateContentStream({
        model: chosenModel,
        contents: fullPrompt,
      });

      let audioBase64 = '';
      let lyrics = '';
      let mimeType = 'audio/wav';

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64) {
        return res.json({
          success: true,
          audioBase64,
          mimeType,
          lyrics,
          modelUsed: chosenModel,
          prompt: fullPrompt,
        });
      }

      throw new Error('No audio data stream returned from Lyria model');
    } catch (lyriaErr: any) {
      console.warn('Lyria generation notice:', lyriaErr?.message);
      // Return clear status so client renders high-tempo dynamic audio synth fallback
      return res.json({
        success: false,
        requiresPaidKey: true,
        error: lyriaErr?.message || 'Lyria requires a paid tier Gemini API key.',
        modelRequested: chosenModel,
        prompt: fullPrompt,
        bpm,
        genre,
      });
    }
  } catch (error: any) {
    console.error('Beat generator error:', error);
    res.status(500).json({
      error: 'Failed to generate workout beats',
      details: error?.message || 'Audio generation error',
    });
  }
});

// =========================================================================
// 7. VOICE CONVERSATIONS (gemini-3.8-flash-lite-tts & live audio dialogue)
// Single-speaker high efficiency fitness coach voice generator
// =========================================================================
app.post('/api/ai/voice-dialogue', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Zephyr',
      style = 'Energetic, motivational personal trainer giving clear concise instructions',
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio synthesized by voice model');
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (error: any) {
    console.error('Voice dialogue error:', error);
    res.status(500).json({
      error: 'Failed to generate coach voice audio',
      details: error?.message || 'Voice synthesis error',
    });
  }
});

// =========================================================================
// 8. AI EXERCISE FORM HELPER (gemini-3.8-flash Multimodal Biomechanical Analyzer)
// Analyzes lift videos/keyframes, detects joint angles, faults & safety risks
// =========================================================================
app.post('/api/ai/analyze-form', async (req, res) => {
  try {
    const {
      video,
      mimeType = 'video/mp4',
      frames = [],
      exerciseName = 'Barbell Squat',
      userNotes = '',
      targetFocus = ['Spinal Neutrality', 'Depth', 'Knee Tracking'],
    } = req.body;

    if (!video && (!frames || frames.length === 0)) {
      return res.status(400).json({ error: 'Video or keyframe images are required for form analysis' });
    }

    const parts: any[] = [];

    if (video) {
      let base64Data = video;
      let actualMime = mimeType;
      if (video.includes(',')) {
        const match = video.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          actualMime = match[1];
          base64Data = match[2];
        } else {
          base64Data = video.split(',')[1];
        }
      }
      parts.push({
        inlineData: {
          mimeType: actualMime,
          data: base64Data,
        },
      });
    } else if (frames && frames.length > 0) {
      for (const frame of frames.slice(0, 10)) {
        let frameData = frame;
        let frameMime = 'image/jpeg';
        if (frame.includes(',')) {
          const m = frame.match(/^data:([^;]+);base64,(.+)$/);
          if (m) {
            frameMime = m[1];
            frameData = m[2];
          } else {
            frameData = frame.split(',')[1];
          }
        }
        parts.push({
          inlineData: {
            mimeType: frameMime,
            data: frameData,
          },
        });
      }
    }

    const promptText = `You are an elite sports biomechanics specialist, CSCS certified coach, and Olympic lifting mentor analyzing technique for: "${exerciseName}".
User notes: "${userNotes || 'Standard working set'}".
Target focus areas: ${Array.isArray(targetFocus) ? targetFocus.join(', ') : targetFocus}.

Carefully analyze this lift execution:
1. Confirm the exercise and assess mechanical efficiency.
2. Provide an overall Form Score (0 to 100).
3. Determine Safety Status: "SAFE" (80-100), "NEEDS_ATTENTION" (60-79), or "INJURY_RISK" (<60).
4. Estimate total reps completed and lifting tempo cadence.
5. Provide detailed phase-by-phase breakdown: Setup & Stance, Eccentric Phase (Descent), Bottom / Hole (Depth & Pelvic Angle), Concentric Phase (Ascent), and Lockout / Finish.
6. Evaluate key joint biomechanics:
   - Spine (lumbar neutrality, thoracic extension, head/cervical alignment)
   - Knees (knee valgus/cave, tracking over 2nd toe, forward travel vs hip hinge)
   - Hips (depth relative to parallel, posterior chain engagement, pelvic tilt / butt wink)
   - Bar / Load Path (verticality, drift forward/backward, midfoot balance)
7. Identify primary technical faults (e.g., knee caving, excessive lumbar rounding, heel lift, premature hip rise).
8. Detail critical safety warnings or injury prevention advice.
9. Deliver 3-4 golden, actionable corrective cues for their very next set.
10. Recommend 2 specific assistance or mobility drills.
11. Provide a concise, encouraging 2-3 sentence coaching verdict.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exerciseDetected: { type: Type.STRING },
            formScore: { type: Type.NUMBER },
            safetyStatus: { type: Type.STRING, description: '"SAFE", "NEEDS_ATTENTION", or "INJURY_RISK"' },
            repCount: { type: Type.NUMBER },
            tempoAssessment: { type: Type.STRING },
            summaryVerdict: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseName: { type: Type.STRING },
                  rating: { type: Type.STRING, description: '"EXCELLENT", "ACCEPTABLE", or "FAULT"' },
                  observation: { type: Type.STRING },
                },
                required: ['phaseName', 'rating', 'observation'],
              },
            },
            jointBiomechanics: {
              type: Type.OBJECT,
              properties: {
                spine: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['status', 'details'],
                },
                knees: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['status', 'details'],
                },
                hips: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['status', 'details'],
                },
                barPath: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['status', 'details'],
                },
              },
              required: ['spine', 'knees', 'hips', 'barPath'],
            },
            primaryFaults: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            safetyWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctiveCues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedDrills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                },
                required: ['name', 'purpose'],
              },
            },
          },
          required: [
            'exerciseDetected',
            'formScore',
            'safetyStatus',
            'repCount',
            'summaryVerdict',
            'phases',
            'jointBiomechanics',
            'primaryFaults',
            'correctiveCues',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Form analysis error:', error);
    res.status(500).json({
      error: 'Biomechanical form analysis failed',
      details: error?.message || 'Error occurred while contacting Gemini model',
    });
  }
});

// =========================================================================
// 9. AI BIOLOGICAL AGE & LONGEVITY ASSESSMENT (gemini-3.8-flash)
// Analyzes physiological age delta, biomarker risks & evidence-based anti-aging
// =========================================================================
app.post('/api/ai/biological-age-analysis', async (req, res) => {
  try {
    const {
      chronologicalAge = 30,
      biologicalAge = 28,
      bmi = 23.5,
      restingHeartRate = 62,
      sleepHours = 7.5,
      sleepConsistency = 85,
      vo2Max = 44,
      gender = 'male',
      weeklyWorkouts = 4,
    } = req.body;

    const prompt = `Analyze this individual's biological vs chronological age and biomarker longevity profile:
- Chronological Age: ${chronologicalAge} years
- Calculated Biological / Fitness Age: ${biologicalAge} years (${(biologicalAge - chronologicalAge).toFixed(1)} years difference)
- Gender: ${gender}
- BMI: ${bmi}
- Resting Heart Rate: ${restingHeartRate} bpm
- Average Sleep: ${sleepHours} hours/night (Consistency score: ${sleepConsistency}%)
- Estimated VO2 Max: ${vo2Max} ml/kg/min
- Weekly Workouts: ${weeklyWorkouts} sessions/week

Provide:
1. Overall Longevity Grade (A+, A, B, C, D) and Longevity Score (0 to 100).
2. The Top 2-3 physiological biomarker strengths protecting their cellular healthspan.
3. The Critical risk areas adding biological years (e.g. elevated RHR, sub-optimal sleep regularity, cardiovascular capacity).
4. Evidence-based, personalized interventions (Zone 2 cardio protocol, resistance programming, sleep circadian anchors, nutritional timing) to reverse biological age by 3 to 7 years.
5. A motivational, scientific summary verdict explaining what their biological age means for their future vitality.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            longevityGrade: { type: Type.STRING },
            longevityScore: { type: Type.NUMBER },
            topStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            interventions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: 'e.g. Cardiovascular, Recovery, Metabolic, Strength' },
                  action: { type: Type.STRING },
                  projectedReversalYears: { type: Type.NUMBER, description: 'e.g. 1.5' },
                },
                required: ['category', 'action', 'projectedReversalYears'],
              },
            },
            expertVerdict: { type: Type.STRING },
          },
          required: ['longevityGrade', 'longevityScore', 'topStrengths', 'criticalRisks', 'interventions', 'expertVerdict'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Biological age AI analysis error:', error);
    res.status(500).json({
      error: 'Biological age AI assessment failed',
      details: error?.message || 'Error occurred while contacting Gemini model',
    });
  }
});

// =========================================================================
// 10. AI NUTRITION COACH (gemini-3.8-flash)
// Analyzes weekly meal logs & suggests 3 personalized dietary optimizations
// =========================================================================
app.post('/api/ai/nutrition-coach', async (req, res) => {
  try {
    const {
      weeklyMeals = [],
      dailyAverage = {},
      targetCalories = 2000,
      targetProtein = 130,
      targetCarbs = 220,
      targetFat = 65,
      goal = 'Fat Loss & Muscle Retention',
      dietaryPreference = 'Balanced Indian',
    } = req.body;

    const mealsSummary = Array.isArray(weeklyMeals) && weeklyMeals.length > 0
      ? weeklyMeals.slice(0, 30).map((m: any) => `${m.name} (${m.calories} kcal, P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`).join('; ')
      : 'Standard Indian meals: Roti, Dal, Paneer Bhurji, White Rice, Curd, Tea with milk, mixed vegetable sabzi';

    const prompt = `You are a clinical sports nutritionist and expert in authentic Indian dietetics analyzing a user's recent dietary intake:
- User Fitness Goal: ${goal}
- Diet Preference: ${dietaryPreference}
- Target Daily Macros: ${targetCalories} kcal (Protein: ${targetProtein}g, Carbs: ${targetCarbs}g, Fat: ${targetFat}g)
- Actual Intake Sample: ${mealsSummary}
- Current Daily Averages: ${JSON.stringify(dailyAverage || {})}

Analyze their nutritional balance and provide EXACTLY THREE personalized, practical dietary optimizations to better align with their macro targets.
Focus on realistic Indian cuisine adjustments (e.g. Sattu, Paneer, Tofu, Sprouted Moong, Curd, Dal variations, Roti grains, Ghee control).

Provide:
1. An overall executive coaching assessment (2-3 sentences).
2. Adherence scores (0-100%) for Calories, Protein, Carbs, and Fats.
3. EXACTLY THREE high-impact dietary optimizations with:
   - title (e.g. "Anchor Breakfast with a High-Leucine Protein Source")
   - category ("Protein Optimization", "Glycemic & Carb Timing", or "Fat & Calorie Calibration")
   - foodSwap (e.g. "Replace plain breakfast poha with Sprouted Moong Chilla + 50g Paneer")
   - macroImpact (e.g. "+16g protein, -15g refined carbs, +4g fiber")
   - rationale (Scientific reason why this accelerates their goal)
   - suggestedFoods (2-3 specific Indian foods to add)
4. A punchy motivational coaching tip for the upcoming week.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: { type: Type.STRING },
            adherenceScores: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fats: { type: Type.NUMBER },
              },
              required: ['calories', 'protein', 'carbs', 'fats'],
            },
            optimizations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  foodSwap: { type: Type.STRING },
                  macroImpact: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  suggestedFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'category', 'foodSwap', 'macroImpact', 'rationale', 'suggestedFoods'],
              },
            },
            motivationalTip: { type: Type.STRING },
          },
          required: ['overallAssessment', 'adherenceScores', 'optimizations', 'motivationalTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Nutrition Coach error:', error);
    res.status(500).json({
      error: 'AI Nutrition Coach analysis failed',
      details: error?.message || 'Error occurred while contacting Gemini model',
    });
  }
});

// =========================================================================
// 11. AI GYM EQUIPMENT TUTORIAL IDENTIFIER (gemini-3.8-flash Vision)
// Scans gym machine photo, identifies safety stops, adjustments & video guide
// =========================================================================
app.post('/api/ai/identify-equipment', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', userPrompt = '' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image of gym equipment is required' });
    }

    let base64Data = image;
    let actualMime = mimeType;
    if (image.includes(',')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        actualMime = match[1];
        base64Data = match[2];
      } else {
        base64Data = image.split(',')[1];
      }
    }

    const prompt = `You are a certified master fitness equipment specialist and gym biomechanist.
Identify the gym equipment, machine, or workout station in this image.
Explain how to safely adjust, load, and execute exercises on it.
User notes: "${userPrompt || 'Identify machine and safety setup'}".

Provide:
1. equipmentName: Official name of the machine/station (e.g., "45-Degree Incline Leg Press Machine", "Seated Cable Lat Pulldown", "Smith Machine", "Dual Adjustable Pulley Cable Crossover", "Pec Deck / Rear Delt Fly").
2. equipmentCategory: "plate_loaded" | "pin_selectorized" | "cables" | "free_weights" | "bodyweight".
3. primaryMuscles: Array of prime mover muscles.
4. secondaryMuscles: Array of synergist / stabilizer muscles.
5. setupChecklist: 4-5 numbered safety setup checkpoints (seat pad position, safety stop pins, weight collar, footplate angle).
6. executionGuide: Step-by-step cueing for 1 repetition (Unracking, eccentric descent, bottom range of motion, concentric drive, lockout rules).
7. criticalMistakes: 3 dangerous mistakes that lead to joint injury on this machine.
8. alternativeExercises: 2-3 free-weight or dumbbell exercises that target the same movement pattern.
9. quickSafetySummary: 1-2 sentence golden safety rule.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: actualMime,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            equipmentName: { type: Type.STRING },
            equipmentCategory: { type: Type.STRING },
            primaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING } },
            secondaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING } },
            setupChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            executionGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternativeExercises: { type: Type.ARRAY, items: { type: Type.STRING } },
            quickSafetySummary: { type: Type.STRING },
          },
          required: [
            'equipmentName',
            'equipmentCategory',
            'primaryMuscles',
            'secondaryMuscles',
            'setupChecklist',
            'executionGuide',
            'criticalMistakes',
            'alternativeExercises',
            'quickSafetySummary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Equipment identification error:', error);
    res.status(500).json({
      error: 'Failed to identify gym equipment',
      details: error?.message || 'Error occurred while contacting Gemini model',
    });
  }
});

// =========================================================================
// 8. WEBSOCKET SERVER: REAL-TIME LIVE VOICE COACH (gemini-3.8-live)
// Connects to Gemini Live API and bridges 16kHz PCM input and 24kHz PCM output
// =========================================================================
const wss = new WebSocketServer({ server, path: '/api/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini Live Voice Coach WebSocket');
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are an energetic, elite personal trainer and workout coach at Kapse Fitness. Keep responses short, punchy, motivating, and directly focused on form, reps, breathing, and performance during training.',
      },
      callbacks: {
        onmessage: (message: any) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (audio) {
            clientWs.send(JSON.stringify({ audio, text }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session callback error:', err?.message);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
          }
        },
      },
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'connected', message: 'Connected to Live Coach' }));
    }

    clientWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio && session) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text && session) {
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (err: any) {
        console.error('Error handling WebSocket client message:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        if (session) session.close();
      } catch {}
    });
  } catch (liveErr: any) {
    console.error('Failed to establish Gemini Live session:', liveErr?.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        error: liveErr?.message || 'Live API connection unavailable on current tier',
        liveUnavailable: true,
      }));
    }
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kapse Fitness server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
