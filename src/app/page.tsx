"use client"

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to the static HTML version
    window.location.href = '/index.html'
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Redirecting to Climate Risk Analysis Platform...</h1>
        <p>If you are not redirected, <a href="/index.html">click here</a></p>
      </div>
    </div>
  )
}