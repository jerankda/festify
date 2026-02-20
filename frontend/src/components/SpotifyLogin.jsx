import { API } from '../api'

const features = [
  {
    icon: '🎪',
    title: 'Festival poster',
    desc: 'Upload any lineup poster. AI reads the artists and builds your playlist instantly.',
  },
  {
    icon: '🔍',
    title: 'Artist search',
    desc: 'Search any artist, pick how many tracks, add multiple to one playlist.',
  },
  {
    icon: '🎵',
    title: 'Top tracks',
    desc: 'Choose top 5, 10, or 20 tracks per artist — ranked by popularity.',
  },
]

export default function SpotifyLogin() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-green-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold text-green-500 tracking-tight">festify</span>
        <a
          href={`${API}/auth/login`}
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          Sign in →
        </a>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-10 pb-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          AI-powered playlist builder
        </div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-5 max-w-2xl -mt-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Turn any festival lineup
            <br />
            <span className="text-green-500">into a Spotify playlist</span>
          </h1>
          <p className="text-lg text-white/40 max-w-sm">
            Upload a poster or search artists — Festify builds the playlist in seconds.
          </p>
        </div>

        {/* CTA */}
        <a
          href={`${API}/auth/login`}
          className="flex items-center gap-3 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold px-8 py-4 rounded-full transition-all text-base shadow-lg shadow-green-500/25"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect with Spotify
        </a>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          {features.map(f => (
            <div
              key={f.title}
              className="flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-white/15 text-xs">
        festify · open source
      </footer>

    </div>
  )
}
