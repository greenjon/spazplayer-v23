import React from 'react';
import { StreamMetadata } from '../types';

interface ControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  metadata: StreamMetadata | null;
  isVisualizerEnabled: boolean;
  onToggleVisualizer: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onTogglePlay,
  metadata,
  isVisualizerEnabled,
  onToggleVisualizer,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 z-50 flex items-center justify-between px-4 md:px-8 shadow-lg">
      
      {/* Left: Play/Pause */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onTogglePlay}
          className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 border-2 ${
            isPlaying 
              ? 'bg-[#DFFF00]/20 border-[#DFFF00] text-[#DFFF00] hover:bg-[#DFFF00]/30' 
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-[#DFFF00] hover:text-[#DFFF00]'
          }`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Metadata Display */}
        <div className="flex flex-col justify-center min-w-0 pr-4">
          <span className="text-sm md:text-base font-medium text-[#00FF00] leading-tight line-clamp-2 break-words">
            {metadata?.title || 'Loading...'}
          </span>
          {metadata?.artist && (
             <span className="text-xs text-slate-400 leading-tight line-clamp-1 break-words mt-0.5">{metadata.artist}</span>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onToggleVisualizer}
          className={`px-3 py-1.5 rounded text-xs md:text-sm font-semibold border transition-colors ${
            isVisualizerEnabled
              ? 'border-[#DFFF00] text-[#DFFF00] bg-[#DFFF00]/20'
              : 'border-slate-600 text-slate-400 hover:text-[#DFFF00] hover:border-[#DFFF00]'
          }`}
        >
          {isVisualizerEnabled ? 'VIS ON' : 'VIS OFF'}
        </button>
      </div>
    </div>
  );
};

export default ControlBar;