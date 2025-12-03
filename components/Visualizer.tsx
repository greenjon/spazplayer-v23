import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isEnabled: boolean;
  topMargin?: number;
  bottomMargin?: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  analyser, 
  isEnabled, 
  topMargin = 0, 
  bottomMargin = 0 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isEnabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer setup
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Request next frame
      animationRef.current = requestAnimationFrame(draw);

      // Get data
      analyser.getByteTimeDomainData(dataArray);

      // Canvas setup
      const width = canvas.width;
      const height = canvas.height;

      // Clear with fade effect for trail using destination-out to handle transparent background
      // This allows the CSS gradient behind the canvas to show through
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00FF00'; // Lime Green
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      
      // Calculate drawing area dimensions
      const drawAreaHeight = Math.max(0, height - topMargin - bottomMargin);
      const centerY = topMargin + (drawAreaHeight / 2);
      // Scale amplitude to fit the available height, with a safety factor
      const amplitudeScale = drawAreaHeight / 2; 

      for (let i = 0; i < bufferLength; i++) {
        // v is normalized 0..2 (1 is center/silence)
        const v = dataArray[i] / 128.0; 
        
        // Map v to the calculated drawing area
        // (v - 1) makes it -1..1
        // * amplitudeScale scales it to half height
        // + centerY moves it to the center of the available area
        const yPos = (v - 1) * amplitudeScale + centerY;
        
        const xPos = i * sliceWidth;

        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
      }

      // Finish line at center right
      ctx.lineTo(width, centerY);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isEnabled, topMargin, bottomMargin]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default Visualizer;