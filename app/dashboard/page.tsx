'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => { const supabase = createClient(); supabase.auth.getUser().then(({ data }) => { if (!data.user) location.replace('/login'); else setEmail(data.user.email ?? 'MDW Nutzer:in') }) }, [])
  async function signOut() { await createClient().auth.signOut(); location.assign('/') }
  if (!email) return <main style={{ padding: 48, fontFamily: 'sans-serif' }}>Workspace wird geladen …</main>
  return <main style={{ minHeight: '100vh', padding: '48px', background: '#fbfafb', fontFamily: 'DM Sans, sans-serif', color: '#292639' }}><p style={{ color: '#847e8a', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>MDW PUBLISH / SICHERER WORKSPACE</p><h1 style={{ fontFamily: 'Playfair Display, serif' }}>Willkommen, {email}.</h1><p style={{ color: '#706a77', maxWidth: 560, lineHeight: 1.6 }}>Dein Konto ist angemeldet. Sobald das Supabase-Schema aktiviert ist, erscheinen hier deine Organisation, Kampagnen und Freigaben.</p><button onClick={signOut} style={{ border: '1px solid #ddd7e1', background: '#fff', borderRadius: 6, padding: '10px 13px', cursor: 'pointer' }}>Abmelden</button></main>
}
