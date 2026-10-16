'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import styles from './auth.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    const supabase = createClient()
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/dashboard` } })
    setBusy(false)
    if (result.error) return setMessage(result.error.message)
    if (mode === 'signup' && !result.data.session) return setMessage('Fast geschafft: Bitte bestätige deine E-Mail-Adresse.')
    location.assign('/dashboard')
  }

  return <main className={styles.page}><section className={styles.card}><img src="/mdw-logo.jpg" alt="MDW – My Digital World" style={{ width: 142, borderRadius: 6, boxShadow: '0 6px 20px #241a3530', marginBottom: 24 }}/><a href="/" className={styles.back}>← Zurück zu MDW Publish</a><p className={styles.eyebrow}>MDW PUBLISH</p><h1>{mode === 'login' ? 'Willkommen zurück.' : 'Workspace erstellen.'}</h1><p className={styles.intro}>{mode === 'login' ? 'Melde dich an, um deine Kampagnen zu verwalten.' : 'Starte mit einem sicheren MDW-Publish-Konto.'}</p><form onSubmit={submit}><label>E-Mail-Adresse<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label>Passwort<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>{message && <p className={styles.message}>{message}</p>}<button disabled={busy}>{busy ? 'Bitte warten …' : mode === 'login' ? 'Anmelden →' : 'Konto erstellen →'}</button></form><p className={styles.switch}>{mode === 'login' ? 'Noch kein Konto?' : 'Bereits registriert?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Registrieren' : 'Anmelden'}</button></p></section></main>
}
