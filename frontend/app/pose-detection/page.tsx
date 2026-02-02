"use client";

import { useState, useEffect, useRef } from "react";

interface Exercise {
  name: string;
  supported: boolean;
  description: string;
  key_points?: string[];
}

interface PoseStats {
  system_status: string;
  opencv_installed: boolean;
  mediapipe_installed: boolean;
  opencv_version: string;
  mediapipe_version: string;
  supported_exercises: string[];
  features: {
    rep_counting: boolean;
    form_scoring: boolean;
    real_time_feedback: boolean;
    angle_calculation: boolean;
    body_alignment_check: boolean;
  };
  installation_command: string;
  demo_script: string;
}

interface AnalysisResult {
  exercise: string;
  rep_count: number;
  form_score: number;
  feedback: string[];
  status: string;
}

export default function PoseDetectionPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<PoseStats | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>("squat");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<string[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchExercises();
    fetchStats();
  }, []);

  const fetchExercises = async () => {
    try {
      const apiUrl = (() => {
        const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
        if (hostport) return `https://${hostport}`
        const host = process.env.NEXT_PUBLIC_API_HOST
        if (host) return `https://${host}`
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      })()
      const response = await fetch(`${apiUrl}/api/pose/exercises`);
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const apiUrl = (() => {
        const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
        if (hostport) return `https://${hostport}`
        const host = process.env.NEXT_PUBLIC_API_HOST
        if (host) return `https://${host}`
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      })()
      const response = await fetch(`${apiUrl}/api/pose/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const analyzeExercise = async () => {
    setLoading(true);
    try {
      const apiUrl = (() => {
        const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
        if (hostport) return `https://${hostport}`
        const host = process.env.NEXT_PUBLIC_API_HOST
        if (host) return `https://${host}`
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      })()
      const response = await fetch(`${apiUrl}/api/pose/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exercise_type: selectedExercise,
        }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Error analyzing pose:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "ready") return "text-green-400";
    return "text-yellow-400";
  };

  const getFormScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setRepCount(0);
        setFormScore(0);
        
        // Connect to WebSocket
        const apiUrl = (() => {
          const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
          if (hostport) return `https://${hostport}`
          const host = process.env.NEXT_PUBLIC_API_HOST
          if (host) return `https://${host}`
          return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
        })()
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/pose';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log("WebSocket connected");
          setProcessingActive(true);
          startFrameCapture();
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === "analysis") {
            setRepCount(data.rep_count || 0);
            setFormScore(data.form_score || 0);
            setCurrentFeedback(data.feedback || []);
            
            // Don't display processed frame - keep smooth video
          } else if (data.error) {
            console.error("WebSocket error:", data.error);
            alert(data.error);
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setProcessingActive(false);
        };
        
        ws.onclose = () => {
          console.log("WebSocket closed");
          setProcessingActive(false);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please grant camera permissions.");
    }
  };

  const startFrameCapture = () => {
    if (intervalRef.current) return;
    
    // Create a temporary canvas for capturing frames
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    intervalRef.current = window.setInterval(() => {
      if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN && tempCtx) {
        const video = videoRef.current;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas size to match video
          tempCanvas.width = video.videoWidth;
          tempCanvas.height = video.videoHeight;
          
          // Draw current frame
          tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // Convert to base64
          const imageData = tempCanvas.toDataURL('image/jpeg', 0.5);
          
          // Send to WebSocket
          wsRef.current.send(JSON.stringify({
            type: "frame",
            image: imageData,
            exercise: selectedExercise
          }));
        }
      }
    }, 300); // Send frame every 300ms (3 FPS) for analysis only
  };

  const stopCamera = () => {
    // Save workout data before stopping
    if (repCount > 0) {
      saveWorkoutSession();
    }
    
    // Stop frame capture
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop camera stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setProcessingActive(false);
    setRepCount(0);
    setFormScore(0);
    setCurrentFeedback([]);
  };

  const saveWorkoutSession = async () => {
    try {
      // Calculate duration (rough estimate based on reps)
      const estimatedDuration = Math.max(5, repCount * 2); // 2 mins per rep average
      
      // Calculate calories based on exercise type and reps
      const caloriesPerRep = selectedExercise === 'squat' ? 8 : 
                            selectedExercise === 'pushup' ? 6 : 5;
      const calories = repCount * caloriesPerRep;
      
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        exercise_type: selectedExercise,
        duration_minutes: estimatedDuration,
        calories_burned: calories,
        intensity: Math.round(formScore / 10), // Convert 0-100 to 1-10
        reps: repCount,
        sets: Math.ceil(repCount / 10) // Assume 10 reps per set
      };

      const apiUrl = (() => {
        const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
        if (hostport) return `https://${hostport}`
        const host = process.env.NEXT_PUBLIC_API_HOST
        if (host) return `https://${host}`
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      })()
      const response = await fetch(`${apiUrl}/api/analytics/log-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });

      if (response.ok) {
        console.log('✅ Workout saved successfully!');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const resetCounter = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
    }
    setRepCount(0);
    setFormScore(0);
  };

  const changeExercise = (exercise: string) => {
    setSelectedExercise(exercise);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: "change_exercise", 
        exercise: exercise 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Pose Detection
          </h1>
          <p className="text-gray-300 text-lg">
            Real-time exercise form analysis with automatic rep counting
          </p>
        </div>

        {/* System Status */}
        {stats && (
          <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span>🔧</span> System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Status</p>
                <p className={`text-xl font-bold ${getStatusColor(stats.system_status)}`}>
                  {stats.system_status === "ready" ? "✅ Ready" : "🟡 Demo Mode"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">MediaPipe</p>
                <p className={`text-xl font-bold ${stats.mediapipe_installed ? "text-green-400" : "text-red-400"}`}>
                  {stats.mediapipe_installed ? `✅ ${stats.mediapipe_version}` : "❌ Not Installed"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">OpenCV</p>
                <p className={`text-xl font-bold ${stats.opencv_installed ? "text-green-400" : "text-red-400"}`}>
                  {stats.opencv_installed ? `✅ ${stats.opencv_version}` : "❌ Not Installed"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Supported Exercises</p>
                <p className="text-xl font-bold text-purple-400">
                  {stats.supported_exercises?.length || 0}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.features && Object.entries(stats.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center gap-2">
                    <span>{enabled ? "✅" : "❌"}</span>
                    <span className="text-sm text-gray-300">
                      {feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supported Exercises */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>💪</span> Supported Exercises
            </h2>
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.name}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedExercise === exercise.name
                      ? "bg-purple-900/30 border-purple-500"
                      : "bg-gray-700/30 border-gray-600 hover:border-purple-500/50"
                  } ${!exercise.supported && "opacity-50"}`}
                  onClick={() => {
                    if (exercise.supported) {
                      changeExercise(exercise.name);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold capitalize">{exercise.name}</h3>
                    {exercise.supported ? (
                      <span className="text-green-400 text-sm">✅ Ready</span>
                    ) : (
                      <span className="text-yellow-400 text-sm">🚧 Coming Soon</span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{exercise.description}</p>
                  {exercise.key_points && exercise.key_points.length > 0 && (
                    <div className="space-y-1">
                      {exercise.key_points.map((point, idx) => (
                        <p key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {point}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Quick Analysis */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span>🎯</span> Quick Analysis
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Selected Exercise</label>
                  <p className="text-xl font-bold text-purple-400 capitalize">{selectedExercise}</p>
                </div>
                <button
                  onClick={analyzeExercise}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {loading ? "Analyzing..." : "Get Form Guidance"}
                </button>
              </div>

              {analysis && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-400">Form Score</span>
                    <span className={`text-2xl font-bold ${getFormScoreColor(analysis.form_score)}`}>
                      {analysis.form_score}%
                    </span>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <h3 className="font-semibold mb-3 text-purple-400">Form Tips</h3>
                    <ul className="space-y-2">
                      {analysis.feedback.map((tip, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {analysis.status === "demo_mode" && (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-300">
                        ℹ️ This is demo mode. For live pose detection, use the webcam demo below.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Demo Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span>📹</span> Live Webcam Feed
              </h2>
              
              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-gray-300 mb-4">Camera not active</p>
                      <button
                        onClick={startCamera}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        Start Camera
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats Overlay */}
                {cameraActive && (
                  <div className="absolute top-4 left-4 right-4 space-y-2">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 inline-block">
                      <div className="text-sm text-gray-400">Exercise</div>
                      <div className="text-2xl font-bold text-purple-400 capitalize">{selectedExercise}</div>
                      {processingActive && (
                        <div className="text-xs text-green-400 mt-1">🟢 AI Detecting...</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-sm text-gray-400">Reps</div>
                        <div className="text-3xl font-bold text-green-400">{repCount}</div>
                      </div>
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-sm text-gray-400">Form Score</div>
                        <div className={`text-3xl font-bold ${getFormScoreColor(formScore)}`}>
                          {formScore}%
                        </div>
                      </div>
                    </div>
                    {currentFeedback.length > 0 && (
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Feedback</div>
                        {currentFeedback.slice(0, 2).map((tip, idx) => (
                          <div key={idx} className="text-xs text-yellow-300">• {tip}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-3">
                {cameraActive ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={resetCounter}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Reset Counter
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Stop Camera
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                  >
                    Start Live Detection
                  </button>
                )}

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-400">How to use</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Select your exercise from the left panel</li>
                    <li>• Click "Start Camera" to begin</li>
                    <li>• Stand 2 meters back so full body is visible</li>
                    <li>• Perform the exercise and watch reps count automatically</li>
                    <li>• Form score updates in real-time</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="font-semibold mb-2 text-purple-400">Live Pose Detection</h3>
                  <p className="text-sm text-gray-300">
                    This uses real MediaPipe AI to track your body movements! The skeleton overlay 
                    shows 33 body landmarks, and the system automatically counts reps when you perform 
                    exercises correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
