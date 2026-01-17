import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { Toaster } from "@/components/ui/toaster"
import Login from "./pages/Login"
import Sidebar from "./pages/Sidebar"

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <Sidebar /> : <Navigate to="/login" replace />}
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
