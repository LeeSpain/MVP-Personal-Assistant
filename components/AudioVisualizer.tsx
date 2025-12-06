import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isActive: boolean;
    color?: string;
}

export default function AudioVisualizer({ stream, isActive, color = '#8b5cf6' }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(null);
    const audioContextRef = useRef<AudioContext>(null);
    const analyserRef = useRef<AnalyserNode>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode>(null);

    useEffect(() => {
        if (!stream || !isActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Init Audio Context
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;

        // Init Analyser
        if (!analyserRef.current) {
            analyserRef.current = audioCtx.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        const analyser = analyserRef.current;

        // Connect Source
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        sourceRef.current = audioCtx.createMediaStreamSource(stream);
        sourceRef.current.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isActive) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Circle Visualizer
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 50;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#1e1b4b'; // Dark violet bg for the orb
            ctx.fill();

            // Bars around circle
            const bars = 60;
            const step = (Math.PI * 2) / bars;

            for (let i = 0; i < bars; i++) {
                // Map bar index to frequency index (approx)
                const dataIndex = Math.floor((i / bars) * (bufferLength / 2));
                const value = dataArray[dataIndex];
                const barHeight = (value / 255) * 60; // Max height 60px

                const angle = i * step;

                // Start point (on circle edge)
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;

                // End point (outwards)
                const x2 = centerX + Math.cos(angle) * (radius + barHeight + 5); // +5 base
                const y2 = centerY + Math.sin(angle) * (radius + barHeight + 5);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // Inner Glow Pulse
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.1 + (average / 255) * 0.5; // Pulse opacity
            ctx.fill();
            ctx.globalAlpha = 1.0;
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [stream, isActive, color]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-full h-full max-w-[300px] max-h-[300px]"
        />
    );
}
