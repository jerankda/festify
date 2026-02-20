import { useState, useEffect } from 'react'
import SpotifyLogin from './components/SpotifyLogin'
import ArtistSearch from './components/ArtistSearch'
import PosterUpload from './components/PosterUpload'
import { API } from './api'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('search') // 'search' | 'poster'

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <SpotifyLogin />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-green-500">festify</span>
        </h1>
        <div className="flex items-center gap-3">
          {user.image && (
            <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-white/60">{user.display_name}</span>
          <a
            href={`${API}/auth/logout`}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            log out
          </a>
        </div>
      </header>

      {/* Spotify lockout banner */}
      <div className="bg-yellow-400/10 border-b border-yellow-400/20 px-6 py-3 text-center">
        <p className="text-yellow-300 text-sm leading-snug">
          <span className="font-bold">Spotify blocked public access for independent developers.</span>
          {' '}As of May 2025, only companies with 250,000+ users can get extended API access.{' '}
          <a
            href="https://github.com/jerankda/festify"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-yellow-100 transition-colors"
          >
            Self-host it with your own credentials
          </a>
          {' '}if you want to share this with others.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center mt-8 mb-10">
        <div className="flex bg-white/5 rounded-full p-1 gap-1">
          <button
            onClick={() => setMode('search')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'search'
                ? 'bg-green-500 text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Artist search
          </button>
          <button
            onClick={() => setMode('poster')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'poster'
                ? 'bg-green-500 text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Festival poster
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4">
        {mode === 'search' ? <ArtistSearch /> : <PosterUpload user={user} />}
      </main>
    </div>
  )
}
