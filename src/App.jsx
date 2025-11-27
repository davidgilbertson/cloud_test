import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [userId, setUserId] = useState('')
  const [pingTimes, setPingTimes] = useState([])
  const [dbTimes, setDbTimes] = useState([])
  const [pingLoading, setPingLoading] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [hasAction, setHasAction] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const ensureUserId = () => {
      const existing = localStorage.getItem('userId')
      if (existing) return existing

      const id = crypto.randomUUID()

      localStorage.setItem('userId', id)
      return id
    }

    const id = ensureUserId()
    setUserId(id)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatElapsed = (ms) => {
    const safeMs = Math.max(0, ms)
    const totalSeconds = Math.floor(safeMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${hours}h:${pad(minutes)}m:${pad(seconds)}s`
  }

  const pingServer = async () => {
    const timestamp = Date.now()
    setNow(timestamp)
    setLastAction(timestamp)
    setHasAction(true)
    setPingLoading(true)
    const start = performance.now()

    try {
      const res = await fetch('/api/ping')
      await res.json()
      const duration = Math.round(performance.now() - start)
      setPingTimes((prev) => [`${duration} ms`, ...prev])
    } catch (error) {
      setPingTimes((prev) => [`Failed`, ...prev])
    }
    setPingLoading(false)
  }

  const pingServerAndDb = async () => {
    const timestamp = Date.now()
    setNow(timestamp)
    setLastAction(timestamp)
    setHasAction(true)
    setDbLoading(true)
    const start = performance.now()

    try {
      const dataRes = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      const data = await dataRes.json()
      const elapsed = Math.round(performance.now() - start)
      console.log('User data:', data)
      setDbTimes((prev) => [`${elapsed} ms`, ...prev])
    } catch (error) {
      setDbTimes((prev) => [`Failed`, ...prev])
    }
    setDbLoading(false)
  }

  const origin = document.location.origin
  if (origin.endsWith('.web.app')) {
    origin = 'Firebase'
  } else if (origin.endsWith('.workers.dev')) {
    origin = 'Cloudflare'
  }
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-start justify-center px-6 pt-24">
      <div className="space-y-6 w-full max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-center">
          Test backend response times
        </h1>
        <p className="text-center text-slate-600">Served from {origin}</p>
    
        <p className="text-center text-slate-600 min-h-[1.5rem]">
          {hasAction && lastAction !== null
            ? `Idle for: ${formatElapsed(now - lastAction)}`
            : '\u00a0'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <button
              onClick={pingServer}
              className="w-full px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition cursor-pointer"
              disabled={pingLoading}
            >
              {pingLoading ? '...' : 'Ping Server'}
            </button>
            <div className="text-slate-700 text-sm leading-6 min-h-[5rem]">
              {pingTimes.map((entry, idx) => (
                <span key={idx}>
                  {entry}
                  <br />
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={pingServerAndDb}
              className="w-full px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition cursor-pointer"
              disabled={dbLoading}
            >
              {dbLoading ? '...' : 'Ping Server + DB'}
            </button>
            <div className="text-slate-700 text-sm leading-6 min-h-[5rem]">
              {dbTimes.map((entry, idx) => (
                <span key={idx}>
                  {entry}
                  <br />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
