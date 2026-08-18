import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user || user.role === "client") {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRedirect = user.role === "barber" ? "/agenda-barbeiros" : "/dashboard"
    return <Navigate to={defaultRedirect} replace />
  }

  return children
}
