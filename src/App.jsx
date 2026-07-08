import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Sobre from "./pages/Sobre.jsx"
import TrabalheConosco from "./pages/TrabalheConosco.jsx"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />
        </Routes>
      </div>
    </div>
  )
}
