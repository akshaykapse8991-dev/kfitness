import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { playShortBeep } from '../../utils/audioChime';

interface PatternPadProps {
  onComplete: (pattern: number[]) => void;
  isError?: boolean;
  disabled?: boolean;
  minPoints?: number;
}

const GRID_SIZE = 3;
const SVG_SIZE = 280;
const NODE_COORDINATES: { x: number; y: number }[] = [];

for (let r = 0; r < GRID_SIZE; r++) {
  for (let c = 0; c < GRID_SIZE; c++) {
    NODE_COORDINATES.push({
      x: 50 + c * 90,
      y: 50 + r * 90,
    });
  }
}

export const PatternPad: React.FC<PatternPadProps> = ({
  onComplete,
  isError = false,
  disabled = false,
  minPoints = 4,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getNodeAtPoint = useCallback((clientX: number, clientY: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (let i = 0; i < NODE_COORDINATES.length; i++) {
      const node = NODE_COORDINATES[i];
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < 32) {
        return i;
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDrawing(true);
    const node = getNodeAtPoint(e.clientX, e.clientY);
    if (node !== null) {
      setSelectedNodes([node]);
      playShortBeep(600 + node * 40, 0.05);
    } else {
      setSelectedNodes([]);
    }
    updatePointerCoords(e.clientX, e.clientY);
  };

  const updatePointerCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    setCurrentPointer({
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || disabled) return;
    updatePointerCoords(e.clientX, e.clientY);

    const node = getNodeAtPoint(e.clientX, e.clientY);
    if (node !== null && !selectedNodes.includes(node)) {
      setSelectedNodes((prev) => {
        const next = [...prev, node];
        playShortBeep(600 + node * 40, 0.05);
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPointer(null);

    if (selectedNodes.length >= minPoints) {
      onComplete(selectedNodes);
    } else if (selectedNodes.length > 0) {
      // Too short
      setSelectedNodes([]);
    }
  };

  // Click-to-connect fallback for accessibility
  const handleNodeClick = (nodeIndex: number) => {
    if (disabled || isDrawing) return;
    if (!selectedNodes.includes(nodeIndex)) {
      const next = [...selectedNodes, nodeIndex];
      setSelectedNodes(next);
      playShortBeep(600 + nodeIndex * 40, 0.05);
      if (next.length >= minPoints) {
        // Can complete with button or auto after 4+
      }
    }
  };

  const handleReset = () => {
    setSelectedNodes([]);
    setCurrentPointer(null);
  };

  // Reset when error changes
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        setSelectedNodes([]);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  return (
    <div className="flex flex-col items-center select-none space-y-3">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-72 h-72 touch-none rounded-3xl bg-slate-950/80 border ${
          isError
            ? 'border-rose-500 shadow-lg shadow-rose-500/20 animate-shake'
            : selectedNodes.length > 0
            ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'border-slate-800'
        } p-2 flex items-center justify-center cursor-crosshair`}
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-full pointer-events-none"
        >
          {/* Connecting Lines */}
          {selectedNodes.map((nodeIdx, i) => {
            if (i === 0) return null;
            const prev = NODE_COORDINATES[selectedNodes[i - 1]];
            const curr = NODE_COORDINATES[nodeIdx];
            return (
              <line
                key={`line-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke={isError ? '#f43f5e' : '#10b981'}
                strokeWidth="5"
                strokeLinecap="round"
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Active Line from last node to current pointer position */}
          {isDrawing && currentPointer && selectedNodes.length > 0 && (
            <line
              x1={NODE_COORDINATES[selectedNodes[selectedNodes.length - 1]].x}
              y1={NODE_COORDINATES[selectedNodes[selectedNodes.length - 1]].y}
              x2={currentPointer.x}
              y2={currentPointer.y}
              stroke={isError ? '#f43f5e' : '#34d399'}
              strokeWidth="4"
              strokeDasharray="4,4"
              strokeLinecap="round"
            />
          )}

          {/* Nodes */}
          {NODE_COORDINATES.map((coords, idx) => {
            const isSelected = selectedNodes.includes(idx);
            const isLast = selectedNodes[selectedNodes.length - 1] === idx;

            return (
              <g key={`node-${idx}`}>
                {/* Outer Ring */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="26"
                  fill={
                    isSelected
                      ? isError
                        ? 'rgba(244, 63, 94, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(30, 41, 59, 0.4)'
                  }
                  stroke={
                    isSelected
                      ? isError
                        ? '#f43f5e'
                        : '#10b981'
                      : 'rgba(71, 85, 105, 0.5)'
                  }
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all duration-150"
                />

                {/* Inner Dot */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? '8' : '5'}
                  fill={
                    isSelected
                      ? isError
                        ? '#f43f5e'
                        : '#10b981'
                      : '#94a3b8'
                  }
                  className={`transition-all duration-150 ${isLast ? 'animate-pulse' : ''}`}
                />
              </g>
            );
          })}
        </svg>

        {/* Clickable transparent buttons over nodes for touch/click ease */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-4">
          {NODE_COORDINATES.map((_, idx) => (
            <button
              key={`btn-${idx}`}
              type="button"
              onClick={() => handleNodeClick(idx)}
              className="w-full h-full rounded-full cursor-pointer focus:outline-none"
              aria-label={`Node ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between w-72 text-xs text-slate-400">
        <span>
          {selectedNodes.length === 0
            ? `Connect at least ${minPoints} dots`
            : `${selectedNodes.length} dots connected`}
        </span>
        {selectedNodes.length > 0 && (
          <div className="flex items-center gap-2">
            {!isDrawing && selectedNodes.length >= minPoints && (
              <button
                type="button"
                onClick={() => onComplete(selectedNodes)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
              >
                Confirm
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
