import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [status, setStatus] = useState('Loading response...')

  useEffect(() => {
    const load = async () => {
      const start = performance.now()

      try {
        const res = await fetch('/api/ping')
        await res.json()
        const duration = Math.round(performance.now() - start)

        setStatus(`Response from server in ${duration} ms`)
      } catch (error) {
        setStatus('Failed to reach server')
      }
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Hello, World!</h1>
        <p className="text-lg text-slate-600">{status}</p>
      </div>
    </main>
  )
}

export default App
