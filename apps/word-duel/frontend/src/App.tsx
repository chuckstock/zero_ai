import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './components/Home/Home'
import Lobby from './components/Lobby/Lobby'
import Game from './components/Game/Game'
import Results from './components/Results/Results'
import Leaderboard from './components/Leaderboard/Leaderboard'
import Layout from './components/shared/Layout'
import { useSettingsStore } from './stores/settingsStore'

export default function App() {
  const { soundEnabled } = useSettingsStore()

  useEffect(() => {
    // Preload sounds if enabled
    if (soundEnabled) {
      const sounds = ['correct', 'present', 'absent', 'win', 'lose', 'tick']
      sounds.forEach(sound => {
        const audio = new Audio(`/sounds/${sound}.mp3`)
        audio.preload = 'auto'
      })
    }
  }, [soundEnabled])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/results/:gameId" element={<Results />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Layout>
  )
}
