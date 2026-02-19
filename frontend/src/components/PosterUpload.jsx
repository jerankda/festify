import { useState, useRef } from 'react'
import ArtistList from './ArtistList'

export default function PosterUpload({ user }) {
  const [scanning, setScanning] = useState(false)
  const [artists, setArtists] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.')
      return
    }

    setScanning(true)
    setError(null)
    setArtists(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const r = await fetch('/scan-poster', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      if (!data.artists?.length) {
        setError("Couldn't find any artist names in that image. Try a clearer photo.")
        return
      }
      setArtists(data.artists)
    } catch {
      setError('Scan failed. Make sure the image is a readable festival poster.')
    } finally {
      setScanning(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  if (artists) {
    return <ArtistList initialArtists={artists} onReset={() => setArtists(null)} user={user} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 py-20 cursor-pointer transition-colors ${
          dragOver ? 'border-green-500 bg-green-500/5' : 'border-white/20 hover:border-white/40'
        }`}
      >
        {scanning ? (
          <>
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Scanning poster…</p>
          </>
        ) : (
          <>
            <p className="text-3xl">🎪</p>
            <p className="text-white/70 font-medium">Drop your festival poster here</p>
            <p className="text-white/30 text-sm">or click to browse · JPG, PNG · max 10MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  )
}
