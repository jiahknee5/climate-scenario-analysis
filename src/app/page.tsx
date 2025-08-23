"use client"

import { useEffect } from 'react'
import Link from 'next/link'

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
        <p>If you are not redirected, <Link href="/index.html">click here</Link></p>
      </div>
    </div>
  )
}