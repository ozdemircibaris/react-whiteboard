# React Whiteboard

A modern, modular whiteboard library built with TypeScript and Rough.js for creating hand-drawn style interactive whiteboards.

## Features

- 🎨 **Hand-drawn aesthetics** powered by Rough.js
- 🧩 **Modular architecture** for easy feature extension
- 📱 **TypeScript-first** with strict typing
- ⚡ **Performance optimized** canvas operations
- 🔧 **Clean API design** for easy integration
- 🖱️ **Interactive drawing tools**: pen, line, rectangle, circle, ellipse, polygon, text
- 👆 **Selection mode** with visual feedback
- 🎛️ **Built-in toolbar** with all drawing tools

## Installation

```bash
npm install react-whiteboard
```

## Quick Start

### As a React Component (Recommended)

```tsx
import { Whiteboard } from 'react-whiteboard';

function App() {
  return (
    <div>
      <h1>My Whiteboard</h1>
      <Whiteboard
        width={800}
        height={600}
        backgroundColor="#f0f0f0"
        showToolbar={true} // Toolbar is included by default
        onReady={whiteboard => {
          console.log('Whiteboard ready!', whiteboard);
        }}
      />
    </div>
  );
}

// Custom Toolbar (optional)
import { Whiteboard, Toolbar } from 'react-whiteboard';

function CustomApp() {
  const [activeTool, setActiveTool] = useState('pen');

  return (
    <div>
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onClear={() => {
          /* custom clear logic */
        }}
      />
      <Whiteboard
        width={800}
        height={600}
        showToolbar={false} // Hide default toolbar
        onReady={whiteboard => {
          whiteboard.setActiveTool(activeTool);
        }}
      />
    </div>
  );
}
```

### As a Vanilla JavaScript Library

```typescript
import { Whiteboard } from 'react-whiteboard';

// Create a whiteboard instance
const whiteboard = new Whiteboard('#canvas-container');

// The whiteboard is now ready for drawing tools and features
```

## Development

This library is built incrementally, feature by feature. Current implementation includes:

- ✅ Basic canvas setup
- ✅ Rough.js integration
- ✅ Modular architecture foundation

## Building

```bash
npm install
npm run build
```

## Development Mode

```bash
npm run dev
```

## License

MIT
