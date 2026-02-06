import { X, Volume2, VolumeX, Music, Eye, Zap } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    soundEnabled,
    musicEnabled,
    hardMode,
    highContrast,
    toggleSound,
    toggleMusic,
    toggleHardMode,
    toggleHighContrast,
  } = useSettingsStore()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tile-border">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-6 space-y-4">
          {/* Sound Effects */}
          <SettingToggle
            icon={soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            title="Sound Effects"
            description="Play sounds during gameplay"
            enabled={soundEnabled}
            onToggle={toggleSound}
          />

          {/* Music */}
          <SettingToggle
            icon={<Music size={20} />}
            title="Background Music"
            description="Play music during games"
            enabled={musicEnabled}
            onToggle={toggleMusic}
          />

          {/* Hard Mode */}
          <SettingToggle
            icon={<Zap size={20} />}
            title="Hard Mode"
            description="Any revealed hints must be used in subsequent guesses"
            enabled={hardMode}
            onToggle={toggleHardMode}
          />

          {/* High Contrast */}
          <SettingToggle
            icon={<Eye size={20} />}
            title="High Contrast"
            description="Improved color accessibility"
            enabled={highContrast}
            onToggle={toggleHighContrast}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900/50 border-t border-tile-border">
          <p className="text-sm text-gray-500 text-center">
            Word Duel v1.0.0 • Built on Base
          </p>
        </div>
      </div>
    </div>
  )
}

interface SettingToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function SettingToggle({ icon, title, description, enabled, onToggle }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div>
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? 'bg-tile-correct' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
