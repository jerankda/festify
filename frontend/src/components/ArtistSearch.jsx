import { useState } from 'react'
import { API } from '../api'

const TRACK_OPTIONS = [
  { label: 'Top 5', value: 5 },
  { label: 'Top 10', value: 10 },
  { label: 'Top 20', value: 20 },
  { label: 'Full discography', value: 'discography' },
]

export default function ArtistSearch({ user }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)       // chosen artist
  const [trackCount, setTrackCount] = useState(10)
  const [playlistName, setPlaylistName] = useState('')
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setSelected(null)
    setError(null)
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      if (!r.ok) throw new Error('Search failed')
      const data = await r.json()
      setResults(data.artists)
    } catch {
      setError('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  function pick(artist) {
    setSelected(artist)
    setResults([])
    setPlaylistName(`${artist.name}`)
    setDone(null)
    setError(null)
  }

  async function createPlaylist() {
    setCreating(true)
    setError(null)
    try {
      const r = await fetch(`${API}/playlist/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artists: [{ id: selected.id, name: selected.name }],
          track_count: trackCount,
          playlist_name: playlistName,
        }),
      })
      if (!r.ok) throw new Error('Failed to create playlist')
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
        <button
          onClick={() => { setDone(null); setSelected(null); setQuery('') }}
          className="text-white/40 hover:text-white text-sm transition-colors"
        >
          Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for an artist…"
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-green-500 transition-colors placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-5 py-3 rounded-full transition-colors text-sm"
        >
          {searching ? '…' : 'Search'}
        </button>
      </form>

      {/* Search results */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map(artist => (
            <li key={artist.id}>
              <button
                onClick={() => pick(artist)}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors text-left"
              >
                {artist.image
                  ? <img src={artist.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-xs">?</div>
                }
                <div>
                  <p className="font-medium text-sm">{artist.name}</p>
                  {artist.genres?.length > 0 && (
                    <p className="text-white/40 text-xs">{artist.genres.slice(0, 2).join(', ')}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Selected artist — config */}
      {selected && (
        <div className="flex flex-col gap-5 bg-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            {selected.image
              ? <img src={selected.image} alt="" className="w-12 h-12 rounded-full object-cover" />
              : <div className="w-12 h-12 rounded-full bg-white/10" />
            }
            <div>
              <p className="font-semibold">{selected.name}</p>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-xs transition-colors">
                change
              </button>
            </div>
          </div>

          {/* Track count */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/50 uppercase tracking-wider">Songs to add</p>
            <div className="flex gap-2 flex-wrap">
              {TRACK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTrackCount(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    trackCount === opt.value
                      ? 'bg-green-500 text-black font-semibold'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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

          <button
            onClick={createPlaylist}
            disabled={creating || !playlistName.trim()}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-full transition-colors"
          >
            {creating ? 'Creating…' : 'Create playlist'}
          </button>
        </div>
      )}

      {error && !selected && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
