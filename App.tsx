import React, { useState, useEffect, useRef } from 'react';
import ControlBar from './components/ControlBar';
import Visualizer from './components/Visualizer';
import { fetchStreamMetadata } from './services/radioService';
import { StreamMetadata } from './types';
import { useSchedule } from './components/useSchedule';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);
  const [isVisualizerEnabled, setIsVisualizerEnabled] = useState(true);
  
  // State to track the height of the bottom UI obstruction
  const [bottomObstruction, setBottomObstruction] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const { schedule, loading: scheduleLoading, error: scheduleError } = useSchedule();

  // Initialize Audio Context and Analyzer
  const initAudio = () => {
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // Higher resolution for smoother wave

      // Create source from the audio element
      if (audioRef.current) {
        // Important: CORS must be handled on the audio tag for this to work without tainting
        const source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        sourceNodeRef.current = source;
        analyserRef.current = analyser;
        audioContextRef.current = audioCtx;
      }
    } catch (e) {
      console.error("Web Audio API not supported or initialization failed", e);
    }
  };

  // Measure bottom obstruction (schedule overlay)
  useEffect(() => {
    const updateLayout = () => {
      if (scheduleRef.current) {
        const rect = scheduleRef.current.getBoundingClientRect();
        // Calculate distance from bottom of screen to top of schedule element
        // We use Math.max to avoid negative values if off-screen
        const fromBottom = Math.max(0, window.innerHeight - rect.top);
        setBottomObstruction(fromBottom);
      } else {
        setBottomObstruction(0);
      }
    };

    updateLayout();
    
    // Update on resize
    window.addEventListener('resize', updateLayout);
    
    // Also update when schedule lines change as height changes
    return () => window.removeEventListener('resize', updateLayout);
  }, [schedule, scheduleLoading, scheduleError]);

  // Metadata Fetching Loop
  useEffect(() => {
    const getMeta = async () => {
      const data = await fetchStreamMetadata();
      setMetadata(data);
    };

    getMeta(); // Initial fetch
    const interval = setInterval(getMeta, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Play/Pause Handler
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Initialize audio context on first user interaction to comply with browser autoplay policies
      if (!audioContextRef.current) {
        initAudio();
      }
      
      // Resume context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Playback failed:", err);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(to bottom, darkblue, fuchsia)' }}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous" // Essential for Web Audio API to work with external source
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
            console.error("Audio error", e);
            setIsPlaying(false);
        }}
      >
        <source src="https://radio.spaz.org:8060/radio.ogg?type=.ogg" type="audio/ogg" />
        <source src="https://radio.spaz.org:8060/radio" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <ControlBar 
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        metadata={metadata}
        isVisualizerEnabled={isVisualizerEnabled}
        onToggleVisualizer={() => setIsVisualizerEnabled(!isVisualizerEnabled)}
      />

      <Visualizer 
        analyser={analyserRef.current}
        isEnabled={isVisualizerEnabled}
        topMargin={80} // Height of ControlBar
        bottomMargin={bottomObstruction} // Height of Schedule overlay + padding
      />

      {/* Background/Fallback UI when visualizer is off or initializing */}
      <div className={`absolute inset-0 flex items-center justify-center -z-10 transition-opacity duration-500 ${isVisualizerEnabled ? 'opacity-20' : 'opacity-100'}`}>
        <div className="text-center p-8">
           <h1 className="text-6xl md:text-9xl font-black text-white/10 tracking-tighter select-none">SPAZ</h1>
           <p className="mt-4 text-white/20 font-mono tracking-widest text-sm md:text-xl">RADIO STREAM</p>
        </div>
      </div>

      {/* Schedule Overlay */}
      <div 
        ref={scheduleRef}
        className="absolute bottom-0 left-0 w-full md:w-auto md:min-w-[500px] md:max-w-3xl md:bottom-6 md:left-1/2 md:-translate-x-1/2 z-40 p-4 rounded-t-xl md:rounded-xl bg-slate-950/80 border-t md:border border-[#DFFF00] backdrop-blur-md shadow-2xl pointer-events-auto"
      >
        {scheduleLoading && (
          <div className="text-[10px] font-mono text-cyan-500/50 animate-pulse text-center">Loading schedule...</div>
        )}
        
        {!scheduleLoading && !scheduleError && schedule.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <h3 className="text-[10px] font-bold text-[#DFFF00] uppercase tracking-widest text-left mb-1 border-b border-slate-800/50 pb-2">Upcoming Shows</h3>
            {schedule.map((item, i) => (
              <div key={i} className="text-[10px] md:text-xs font-mono leading-tight border-b border-slate-800/30 last:border-0 pb-1 last:pb-0 text-left">
                <span className="text-[#00FF00] mr-2">{item.datePart}</span>
                <span className="text-[#FF00FF] opacity-90">{item.startTime}</span>
                <span className="text-[#DFFF00] px-1">–</span>
                <span className="text-[#FF00FF] opacity-90">{item.endTime}</span>
                <span className="text-[#DFFF00] mx-2">—</span>
                <span className="text-[#00FF00]">{item.showName}</span>
              </div>
            ))}
          </div>
        )}
        
        {!scheduleLoading && !scheduleError && schedule.length === 0 && (
           <div className="text-[10px] font-mono text-slate-500 text-center">No upcoming shows found.</div>
        )}
        
        {scheduleError && (
          <div className="text-[10px] font-mono text-red-400/50 text-center">Schedule unavailable</div>
        )}
      </div>
    </div>
  );
};

export default App;