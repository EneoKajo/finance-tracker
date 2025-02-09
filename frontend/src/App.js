import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/register'
import HomePage from './pages/Home';
import ProtectedRoute from './componenets/ProtectedRoutes';
import Navbar from './componenets/Navbar';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navbar/>
              <HomePage />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Navbar/>
              <Transactions />
            </ProtectedRoute>
          } 
        />

         <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Navbar/>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
        path="/goals" 
        element={
          <ProtectedRoute>
            <Navbar/>
            <Goals />
          </ProtectedRoute>
        } 
      />
        {/* Add other protected routes similarly */}
      </Routes>
    </BrowserRouter>
  );
}

export default App