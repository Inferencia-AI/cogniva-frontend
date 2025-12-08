import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/login.tsx'
import Home from './pages/home.tsx'
import Register from './pages/register.tsx'

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route element={<Login />} path='/' />
    <Route element={<Home />} path='/home' />
    <Route element={<Register />} path='/register' />
    </Routes>
    </BrowserRouter>
  )
}

export default App
