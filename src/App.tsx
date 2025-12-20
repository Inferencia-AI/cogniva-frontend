import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/login.tsx'
import Home from './pages/home.tsx'
import Register from './pages/register.tsx'
import KnowledgebaseHome from './pages/knowledgebase/home.tsx'
import KnowledgebaseDetail from './pages/knowledgebase/detail.tsx'
import KnowledgebaseForm from './pages/knowledgebase/create.tsx'
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout.tsx'

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route element={<Login />} path='/' />
    <Route element={<Home />} path='/home' />
    <Route element={<Register />} path='/register' />
    {/* Knowledgebase Routes - wrapped with AuthenticatedLayout */}
    <Route element={<AuthenticatedLayout><KnowledgebaseHome /></AuthenticatedLayout>} path='/knowledgebase/home' />
    <Route element={<AuthenticatedLayout><KnowledgebaseForm /></AuthenticatedLayout>} path='/knowledgebase/create' />
    <Route element={<AuthenticatedLayout><KnowledgebaseDetail /></AuthenticatedLayout>} path='/knowledgebase/:id' />
    <Route element={<AuthenticatedLayout><KnowledgebaseForm /></AuthenticatedLayout>} path='/knowledgebase/:id/edit' />
    </Routes>
    </BrowserRouter>
  )
}

export default App
