import { WorldBoardComponent } from './ui/WorldBoard.jsx'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Settlement Chess</h1>
        <p>A 4X strategy game inspired by chess</p>
      </header>
      <main className="app-main">
        <WorldBoardComponent />
      </main>
    </div>
  )
}

export default App
