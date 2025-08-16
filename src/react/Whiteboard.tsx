import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { Whiteboard as WhiteboardCore } from '../core/Whiteboard';
import type { WhiteboardConfig, WhiteboardInstance } from '../types';
import type { DrawingTool } from '../types/drawing';
import { Toolbar } from './Toolbar';

export interface WhiteboardProps extends WhiteboardConfig {
  className?: string;
  style?: React.CSSProperties;
  showToolbar?: boolean;
  onReady?: (whiteboard: WhiteboardInstance) => void;
  onError?: (error: Error) => void;
}

export interface WhiteboardRef {
  whiteboard: WhiteboardInstance | null;
  resize: (width?: number, height?: number) => void;
  clear: () => void;
  updateConfig: (config: Partial<WhiteboardConfig>) => void;
  destroy: () => void;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  (
    { className, style, showToolbar = true, onReady, onError, ...config },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const whiteboardRef = useRef<WhiteboardInstance | null>(null);

    const [activeTool, setActiveTool] = useState<DrawingTool>('pen');

    // Initialize whiteboard
    useEffect(() => {
      if (!containerRef.current) return;

      try {
        const whiteboard = new WhiteboardCore(containerRef.current, config);
        whiteboardRef.current = whiteboard;

        // Set initial tool
        whiteboard.setActiveTool(activeTool);

        if (onReady) {
          onReady(whiteboard);
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Failed to initialize whiteboard:', error);
        }
      }

      // Cleanup on unmount
      return () => {
        if (whiteboardRef.current) {
          whiteboardRef.current.destroy();
          whiteboardRef.current = null;
        }
      };
    }, []); // Only run once on mount

    // Update tool when activeTool changes
    useEffect(() => {
      if (whiteboardRef.current) {
        whiteboardRef.current.setActiveTool(activeTool);
      }
    }, [activeTool]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        get whiteboard() {
          return whiteboardRef.current;
        },
        resize: (width?: number, height?: number) => {
          whiteboardRef.current?.resize(width, height);
        },
        clear: () => {
          whiteboardRef.current?.clear();
        },
        updateConfig: (newConfig: Partial<WhiteboardConfig>) => {
          whiteboardRef.current?.updateConfig(newConfig);
        },
        destroy: () => {
          whiteboardRef.current?.destroy();
          whiteboardRef.current = null;
        },
      }),
      []
    );

    const handleClear = () => {
      if (whiteboardRef.current) {
        whiteboardRef.current.clearShapes();
      }
    };

    return (
      <div className={className} style={style}>
        {showToolbar && (
          <Toolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClear={handleClear}
          />
        )}
        <div ref={containerRef} />
      </div>
    );
  }
);

Whiteboard.displayName = 'Whiteboard';
