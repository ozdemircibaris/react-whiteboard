import React from 'react';
import type { DrawingTool } from '../types/drawing';

export interface ToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  onClear,
  className,
  style,
}) => {
  const tools: { tool: DrawingTool; icon: string; label: string }[] = [
    { tool: 'select', icon: '👆', label: 'Select' },
    { tool: 'pen', icon: '✏️', label: 'Pen' },
    { tool: 'line', icon: '📏', label: 'Line' },
    { tool: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { tool: 'circle', icon: '⭕', label: 'Circle' },
    { tool: 'ellipse', icon: '🔵', label: 'Ellipse' },
    { tool: 'polygon', icon: '🔷', label: 'Polygon' },
    { tool: 'text', icon: 'T', label: 'Text' },
  ];

  return (
    <div
      className={`whiteboard-toolbar ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '16px',
        ...style,
      }}
    >
      {/* Drawing Tools */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {tools.map(({ tool, icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              border:
                activeTool === tool ? '2px solid #007bff' : '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: activeTool === tool ? '#e3f2fd' : 'white',
              cursor: 'pointer',
              fontSize: '16px',
              minWidth: '60px',
              transition: 'all 0.2s',
            }}
            title={label}
          >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span style={{ fontSize: '12px', color: '#6c757d' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <button
          onClick={onClear}
          style={{
            padding: '8px 16px',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            backgroundColor: '#dc3545',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};
