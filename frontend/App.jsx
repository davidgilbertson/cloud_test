import { useEffect } from 'react'
import './index.css'

function App() {
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/fast')
        const data = await res.json()
        console.log('API /api/fast response:', data)
      } catch (error) {
        console.error('API /api/fast error:', error)
      }
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Hello, World!</h1>
      </div>
    </main>
  )
}

export default App
