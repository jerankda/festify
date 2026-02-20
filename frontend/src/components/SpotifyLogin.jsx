import { API } from '../api'

export default function SpotifyLogin() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <div className="max-w-md w-full flex flex-col gap-8">

        {/* Logo */}
        <div>
          <h1 className="text-3xl font-bold text-green-500 tracking-tight">festify</h1>
        </div>

        {/* Main text */}
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-semibold leading-snug">
            Going to a festival? Get the playlist ready.
          </p>
          <p className="text-white/50 leading-relaxed">
            Upload the lineup poster or search artists yourself — festify pulls their top tracks into a Spotify playlist for you. Completely free, no account needed beyond Spotify.
          </p>
        </div>

        {/* How it works — casual, not card-y */}
        <ul className="flex flex-col gap-2 text-sm text-white/40">
          <li>→ Upload a poster and it'll read the artists automatically</li>
          <li>→ Or search and add artists one by one</li>
          <li>→ Pick top 5, 10, or 20 tracks per artist</li>
          <li>→ Playlist gets saved straight to your Spotify</li>
        </ul>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <a
            href={`${API}/auth/login`}
            className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-semibold px-6 py-3.5 rounded-full transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </a>
          <p className="text-center text-white/20 text-xs">
            only asks for playlist permissions · open source
          </p>
        </div>

      </div>
    </div>
  )
}
