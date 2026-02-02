import { useEffect } from 'react'
import {
  Canvas,
  Minimap,
  WhiteboardProvider,
  useWhiteboardStore,
  LIGHT_THEME,
  DARK_THEME,
} from '@ozdemircibaris/react-whiteboard'
import type { ThemeColors } from '@ozdemircibaris/react-whiteboard'
import { useTheme } from './hooks/useTheme'
import { FloatingToolbar } from './components/FloatingToolbar'
import { TopBar } from './components/TopBar'
import { ZoomControls } from './components/ZoomControls'
import { ThemeToggle } from './components/ThemeToggle'
import { TextPropertiesPanel } from './components/TextPropertiesPanel'
import { ShapePropertiesPanel } from './components/ShapePropertiesPanel'
import { KeyboardShortcutsPanel } from './components/KeyboardShortcutsPanel'

/** Sync default text color when theme changes */
function useTextColorSync(theme: ThemeColors) {
  const setCurrentTextProps = useWhiteboardStore((s) => s.setCurrentTextProps)
  useEffect(() => {
    setCurrentTextProps({ color: theme.defaultTextColor })
  }, [theme.defaultTextColor, setCurrentTextProps])
}

function WhiteboardApp() {
  const { resolved, toggle } = useTheme()
  const libraryTheme = resolved === 'dark' ? DARK_THEME : LIGHT_THEME
  useTextColorSync(libraryTheme)

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas
        showGrid={true}
        gridSize={20}
        backgroundColor={libraryTheme.canvasBackground}
        theme={libraryTheme}
      />

      {/* Floating UI */}
      <TopBar />
      <ThemeToggle resolved={resolved} toggle={toggle} />
      <TextPropertiesPanel isDark={resolved === 'dark'} />
      <ShapePropertiesPanel />
      <FloatingToolbar />

      {/* Bottom-right stack: zoom + minimap */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        <ZoomControls />
        <Minimap width={200} height={150} theme={libraryTheme} />
      </div>

      <KeyboardShortcutsPanel />
    </div>
  )
}

export default function App() {
  return (
    <WhiteboardProvider>
      <WhiteboardApp />
    </WhiteboardProvider>
  )
}
