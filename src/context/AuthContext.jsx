/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

const AuthContext = createContext(null)

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "https://barbeariadovale.paulo-tech-nocode.workers.dev")

const getInactivityTimeoutMs = () => {
  const saved = Number(localStorage.getItem("inactivityMinutes"))
  if (saved && !isNaN(saved) && saved > 0) {
    return saved * 60 * 1000
  }
  return 5 * 60 * 1000 // Padrão 5 minutos
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("last_activity")
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          localStorage.setItem("last_activity", Date.now().toString())
        } else {
          // Token expirado ou inválido
          localStorage.removeItem("token")
          localStorage.removeItem("last_activity")
          setToken(null)
          setUser(null)
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [token])

  // Controle de logoff por inatividade (configurável)
  useEffect(() => {
    if (!user) return

    let timeoutId = null

    const handleInactivityLogout = () => {
      logout()
    }

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      localStorage.setItem("last_activity", Date.now().toString())
      const timeoutMs = getInactivityTimeoutMs()
      timeoutId = setTimeout(handleInactivityLogout, timeoutMs)
    }

    const checkLastActivity = () => {
      const lastActivity = Number(localStorage.getItem("last_activity"))
      const timeoutMs = getInactivityTimeoutMs()
      if (lastActivity && Date.now() - lastActivity >= timeoutMs) {
        handleInactivityLogout()
      } else {
        resetTimer()
      }
    }

    // Inicializar timestamp e timer
    checkLastActivity()

    // Eventos de interação do usuário
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]
    let lastEventTime = 0

    const onUserActivity = () => {
      const now = Date.now()
      if (now - lastEventTime > 1000) { // throttle de 1s para economizar processamento
        lastEventTime = now
        resetTimer()
      }
    }

    events.forEach((eventName) => {
      window.addEventListener(eventName, onUserActivity, { passive: true })
    })

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLastActivity()
      }
    }

    const onSettingsUpdated = () => {
      resetTimer()
    }

    // Intervalo periódico de checagem para tabs em segundo plano
    const intervalId = setInterval(() => {
      const lastActivity = Number(localStorage.getItem("last_activity"))
      const timeoutMs = getInactivityTimeoutMs()
      if (lastActivity && Date.now() - lastActivity >= timeoutMs) {
        handleInactivityLogout()
      }
    }, 10000)

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", checkLastActivity)
    window.addEventListener("storage_inactivity_updated", onSettingsUpdated)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      clearInterval(intervalId)
      events.forEach((eventName) => {
        window.removeEventListener(eventName, onUserActivity)
      })
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", checkLastActivity)
      window.removeEventListener("storage_inactivity_updated", onSettingsUpdated)
    }
  }, [user, logout])

  const login = async (loginKey, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ loginKey, password })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login.")
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("last_activity", Date.now().toString())
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, phone, email, password, role = "secretario") => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, phone, email, password, role })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Erro ao registrar conta.")
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("last_activity", Date.now().toString())
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const updateUserSession = (newUser, newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken)
      setToken(newToken)
    }
    if (newUser) {
      setUser(newUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

