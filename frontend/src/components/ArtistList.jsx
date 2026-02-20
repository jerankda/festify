import { useState } from 'react'
import { API } from '../api'

const TRACK_OPTIONS = [
  { label: 'Top 5', value: 5 },
  { label: 'Top 10', value: 10 },
  { label: 'Top 20', value: 20 },
]

export default function ArtistList({ initialArtists, onReset, user }) {
  const [artists, setArtists] = useState(
    initialArtists.map(name => ({ name, tracks: 10, enabled: true }))
  )
  const [playlistName, setPlaylistName] = useState('Festival Playlist')
  const [globalCount, setGlobalCount] = useState(null)
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)

  function toggle(i) {
    setArtists(prev => prev.map((a, idx) => idx === i ? { ...a, enabled: !a.enabled } : a))
  }

  function setTracks(i, value) {
    setArtists(prev => prev.map((a, idx) => idx === i ? { ...a, tracks: value } : a))
  }

  function applyGlobal(count) {
    setGlobalCount(count)
    setArtists(prev => prev.map(a => ({ ...a, tracks: count })))
  }

  async function createPlaylist() {
    const active = artists.filter(a => a.enabled)
    if (!active.length) { setError('Select at least one artist.'); return }

    setCreating(true)
    setError(null)

    try {
      const r = await fetch(`${API}/playlist/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artists: active.map(a => ({ name: a.name })),
          track_count: globalCount ?? 10,
          per_artist_counts: Object.fromEntries(active.map(a => [a.name, a.tracks])),
          playlist_name: playlistName,
        }),
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      setDone(data)
    } catch {
      setError('Could not create playlist. Try again.')
    } finally {
      setCreating(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <p className="text-lg font-semibold">{done.playlist_name}</p>
        <p className="text-white/50 text-sm">{done.track_count} tracks added</p>
        <a
          href={done.url}
          target="_blank"
          rel="noreferrer"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2 rounded-full transition-colors text-sm"
        >
          Open in Spotify
        </a>
        <button onClick={onReset} className="text-white/40 hover:text-white text-sm transition-colors">
          Upload another poster
        </button>
      </div>
    )
  }

  const activeCount = artists.filter(a => a.enabled).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">{activeCount} of {artists.length} artists selected</p>
        <button onClick={onReset} className="text-white/30 hover:text-white text-xs transition-colors">
          ← upload different poster
        </button>
      </div>

      {/* Global track count */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/50 uppercase tracking-wider">Songs per artist (all)</p>
        <div className="flex gap-2">
          {TRACK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => applyGlobal(opt.value)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                globalCount === opt.value
                  ? 'bg-green-500 text-black font-semibold'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Artist list */}
      <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
        {artists.map((artist, i) => (
          <li
            key={i}
            className={`flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 transition-opacity ${
              !artist.enabled ? 'opacity-40' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(i)}
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  artist.enabled
                    ? 'bg-green-500 border-green-500 text-black'
                    : 'border-white/30'
                }`}
              >
                {artist.enabled && <span className="text-xs font-bold">✓</span>}
              </button>
              <span className="text-sm font-medium">{artist.name}</span>
            </div>
            {artist.enabled && (
              <div className="flex gap-1">
                {TRACK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTracks(i, opt.value)}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                      artist.tracks === opt.value
                        ? 'bg-green-500 text-black font-semibold'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Playlist name */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/50 uppercase tracking-wider">Playlist name</p>
        <input
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500 transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <p className="text-white/20 text-xs leading-relaxed">
        festify runs on Spotify's free development tier — occasional errors or missing tracks are normal, especially with large lineups. If something fails, just try again.
      </p>

      <button
        onClick={createPlaylist}
        disabled={creating || !activeCount || !playlistName.trim()}
        className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-full transition-colors"
      >
        {creating ? 'Creating playlist…' : `Create playlist · ${activeCount} artists`}
      </button>
    </div>
  )
}
