import { Sun, Moon } from 'lucide-react'
import { GlassPanel } from './GlassPanel'
import { IconButton } from './IconButton'

interface ThemeToggleProps {
  resolved: 'light' | 'dark'
  toggle: () => void
}

export function ThemeToggle({ resolved, toggle }: ThemeToggleProps) {
  return (
    <div className="absolute top-3 right-3 z-20">
      <GlassPanel className="p-1">
        <IconButton
          icon={resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          label={resolved === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          onClick={toggle}
        />
      </GlassPanel>
    </div>
  )
}
