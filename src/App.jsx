import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [userId, setUserId] = useState('')
  const [pingStatus, setPingStatus] = useState('')
  const [dataStatus, setDataStatus] = useState('')

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

  const pingServer = async () => {
    setPingStatus('...')
    const start = performance.now()

    try {
      const res = await fetch('/api/ping')
      await res.json()
      const duration = Math.round(performance.now() - start)
      setPingStatus(`${duration} ms`)
    } catch (error) {
      setPingStatus('Failed')
    }
  }

  const pingServerAndDb = async () => {
    setDataStatus('...')
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
      setDataStatus(`${elapsed} ms`)
    } catch (error) {
      setDataStatus('Failed')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
      <div className="space-y-6 w-full max-w-md">
        <h1 className="text-4xl font-semibold tracking-tight text-center">
          Test backend response times
        </h1>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={pingServer}
              className="px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 transition"
            >
              Ping Server
            </button>
            <span className="text-slate-600 text-lg">{pingStatus}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={pingServerAndDb}
              className="px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 transition"
            >
              Ping Server + DB
            </button>
            <span className="text-slate-600 text-lg">{dataStatus}</span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
