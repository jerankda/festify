export default function SpotifyLogin() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-4xl font-bold tracking-tight">
        <span className="text-green-500">festify</span>
      </h1>
      <p className="text-white/50 text-center max-w-sm">
        Build a Spotify playlist from any festival lineup in seconds.
      </p>
      <a
        href="/auth/login"
        className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors"
      >
        Connect with Spotify
      </a>
    </div>
  )
}
