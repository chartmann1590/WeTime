'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-5 w-5" />
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    )
  }

  const getLabel = () => {
    if (theme === 'system') {
      return 'System'
    }
    return theme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={`Current theme: ${getLabel()}. Click to cycle.`}
      aria-label={`Switch theme. Current: ${getLabel()}`}
    >
      {getIcon()}
    </Button>
  )
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Theme</label>
      <div className="flex gap-2">
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('light')}
          className="flex-1"
        >
          <Sun className="h-4 w-4 mr-2" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="flex-1"
        >
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('system')}
          className="flex-1"
        >
          <Monitor className="h-4 w-4 mr-2" />
          System
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {theme === 'system'
          ? 'Theme follows your system preference'
          : `Using ${theme} theme`}
      </p>
    </div>
  )
}


