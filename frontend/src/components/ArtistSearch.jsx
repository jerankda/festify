import { useState } from 'react'
import { API } from '../api'

const TRACK_OPTIONS = [
  { label: 'Top 5',  short: '5',  value: 5 },
  { label: 'Top 10', short: '10', value: 10 },
  { label: 'Top 20', short: '20', value: 20 },
]

export default function ArtistSearch() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [staged, setStaged]     = useState(null)   // { artist, tracks }
  const [cart, setCart]         = useState([])
  const [playlistName, setPlaylistName] = useState('My Playlist')
  const [creating, setCreating] = useState(false)
  const [done, setDone]         = useState(null)
  const [error, setError]       = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setStaged(null)
    setError(null)
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      if (!r.ok) throw new Error()
      const data = await r.json()
      setResults(data.artists)
    } catch {
      setError('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  function pick(artist) {
    setStaged({ artist, tracks: 10 })
    setResults([])
  }

  function addToCart() {
    if (!staged) return
    if (!cart.find(a => a.id === staged.artist.id)) {
      setCart(prev => [...prev, { ...staged.artist, tracks: staged.tracks }])
    }
    setStaged(null)
    setQuery('')
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(a => a.id !== id))
  }

  function setCartTracks(id, tracks) {
    setCart(prev => prev.map(a => a.id === id ? { ...a, tracks } : a))
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
          artists: cart.map(a => ({ id: a.id, name: a.name })),
          track_count: 10,
          per_artist_counts: Object.fromEntries(cart.map(a => [a.name, a.tracks])),
          playlist_name: playlistName,
        }),
      })
      if (!r.ok) throw new Error()
      setDone(await r.json())
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
          onClick={() => { setDone(null); setCart([]); setQuery(''); setPlaylistName('My Playlist') }}
          className="text-white/40 hover:text-white text-sm transition-colors"
        >
          Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

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
                  ? <img src={artist.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                }
                <div>
                  <p className="font-medium text-sm">{artist.name}</p>
                  {artist.genres?.length > 0 && (
                    <p className="text-white/40 text-xs">{artist.genres.slice(0, 2).join(', ')}</p>
                  )}
                </div>
                {cart.find(a => a.id === artist.id) && (
                  <span className="ml-auto text-green-500 text-xs font-medium">added</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Staged: configure tracks then add */}
      {staged && (
        <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            {staged.artist.image
              ? <img src={staged.artist.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{staged.artist.name}</p>
              {staged.artist.genres?.length > 0 && (
                <p className="text-white/40 text-xs">{staged.artist.genres.slice(0, 2).join(', ')}</p>
              )}
            </div>
            <button onClick={() => setStaged(null)} className="text-white/30 hover:text-white transition-colors text-sm">✕</button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/50 uppercase tracking-wider">Songs to include</p>
            <div className="flex gap-2 flex-wrap">
              {TRACK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStaged(prev => ({ ...prev, tracks: opt.value }))}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    staged.tracks === opt.value
                      ? 'bg-green-500 text-black font-semibold'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addToCart}
            className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-full transition-colors text-sm"
          >
            + Add to playlist
          </button>
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-wider pt-1">
            {cart.length} artist{cart.length !== 1 ? 's' : ''} in playlist
          </p>

          <ul className="flex flex-col gap-2">
            {cart.map(artist => (
              <li key={artist.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                {artist.image
                  ? <img src={artist.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                }
                <span className="text-sm font-medium flex-1 truncate">{artist.name}</span>
                <div className="flex gap-1">
                  {TRACK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCartTracks(artist.id, opt.value)}
                      className={`px-2 py-1 rounded-full text-xs transition-all ${
                        artist.tracks === opt.value
                          ? 'bg-green-500 text-black font-semibold'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => removeFromCart(artist.id)}
                  className="ml-1 text-white/30 hover:text-red-400 transition-colors text-sm"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {/* Create panel */}
          <div className="flex flex-col gap-3 mt-1 pt-4 border-t border-white/10">
            <input
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value)}
              placeholder="Playlist name…"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={createPlaylist}
              disabled={creating || !playlistName.trim()}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-full transition-colors"
            >
              {creating ? 'Creating…' : `Create playlist · ${cart.length} artist${cart.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {error && !staged && !cart.length && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

    </div>
  )
}
