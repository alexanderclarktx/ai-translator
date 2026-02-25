import { createRoot } from "react-dom/client"

const App = () => {
  return (
    <main>
      <h1>AI Translator</h1>
    </main>
  )
}

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing root div with id 'root'")
}

createRoot(rootElement).render(<App />)
