import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Performers from './pages/Performers'
import PerformerDetail from './pages/PerformerDetail'
import ContentDetail from './pages/ContentDetail'
import Search from './pages/Search'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="performers" element={<Performers />} />
        <Route path="performers/:id" element={<PerformerDetail />} />
        <Route path="content/:id" element={<ContentDetail />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  )
}

export default App
