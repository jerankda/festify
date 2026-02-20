import { API } from '../api'

export default function SpotifyLogin() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
        <span className="text-lg font-bold text-green-500 tracking-tight">festify</span>
        <a
          href={`${API}/auth/login`}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-8 py-20 gap-12">

        <div className="flex flex-col gap-6">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Going to a festival?<br />
            <span className="text-green-500">Get the playlist sorted.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-md leading-relaxed">
            Snap a photo of the lineup poster — or search artists yourself. festify builds a Spotify playlist from their top tracks. Free, no sign-up, takes about 30 seconds.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href={`${API}/auth/login`}
            className="self-start flex items-center gap-3 bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-semibold px-7 py-3.5 rounded-full transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </a>
          <p className="text-white/25 text-xs pl-1">only asks for playlist permissions</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-white/[0.06]">
          {[
            ['Upload the poster', 'or search artists manually'],
            ['Toggle artists on/off', 'remove the ones you don\'t care about'],
            ['Pick 5, 10, or 20 tracks', 'per artist, or mix it up'],
            ['Hit create', 'playlist appears in your Spotify instantly'],
          ].map(([title, sub], i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-green-500/60 font-mono text-sm mt-0.5 flex-shrink-0">{i + 1}.</span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-white/35 text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-white/30">
        <div className="flex items-center gap-5">
          <span>made by{' '}
            <a href="https://jerankda.dev" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
              jerankda
            </a>
          </span>
          <a
            href="https://github.com/jerankda/festify"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-white/30 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            github
          </a>
        </div>
        <span>free &amp; open source</span>
      </footer>

    </div>
  )
}
