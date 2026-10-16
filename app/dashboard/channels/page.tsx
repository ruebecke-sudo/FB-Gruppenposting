'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Channel = { name: string; icon: string; detail: string; scope: string; color: string }
const channels: Channel[] = [
  { name: 'Instagram', icon: '◎', detail: 'Posts, Reels und Business-Profile', scope: 'Meta OAuth', color: '#d94684' },
  { name: 'Facebook', icon: 'f', detail: 'Seiten und autorisierte Gruppen', scope: 'Meta OAuth', color: '#1877f2' },
  { name: 'X', icon: '𝕏', detail: 'Posts und Medien', scope: 'X OAuth 2.0', color: '#111111' },
  { name: 'TikTok', icon: '♪', detail: 'Videos und Creator-Accounts', scope: 'TikTok OAuth', color: '#111111' },
  { name: 'Pinterest', icon: 'P', detail: 'Pins und Boards', scope: 'Pinterest OAuth', color: '#bd081c' },
  { name: 'Bluesky', icon: '☁', detail: 'Beiträge und Bilder', scope: 'AT Protocol', color: '#1185fe' },
  { name: 'LinkedIn', icon: 'in', detail: 'Unternehmensseiten und Beiträge', scope: 'LinkedIn OAuth', color: '#0a66c2' },
  { name: 'WhatsApp', icon: '◔', detail: 'Business-Templates und Kanäle', scope: 'WhatsApp Business', color: '#25d366' },
  { name: 'YouTube', icon: '▶', detail: 'Videos, Shorts und Community', scope: 'Google OAuth', color: '#ff0033' },
]

export default function ChannelsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const supabase = createClient()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) location.replace('/login'); else setEmail(data.user.email ?? 'MDW Nutzer:in') }) }, [])
  if (!email) return <main style={{ padding: 48, fontFamily: 'sans-serif' }}>Kanäle werden geladen …</main>
  return <main style={{ minHeight: '100vh', padding: '28px 48px', background: '#fbfafb', color: '#292639', fontFamily: 'DM Sans, sans-serif' }}><header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}><a href="/dashboard"><img src="/mdw-logo.jpg" alt="MDW – My Digital World" style={{ width: 112, borderRadius: 5 }}/></a><div><a href="/dashboard" style={{ color: '#7156a0', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>← Zur Übersicht</a><h1 style={{ margin: '7px 0 0', fontFamily: 'Playfair Display, serif' }}>Deine Social-Kanäle</h1></div></header><section style={{ maxWidth: 1040 }}><p style={{ color: '#746d79', maxWidth: 700, lineHeight: 1.55 }}>Verbinde nur Konten, für die du die Veröffentlichungsrechte besitzt. Der Zugriff wird je Plattform über deren offizielle Anmeldung autorisiert; Zugangsdaten werden nicht in MDW Publish eingegeben.</p>{notice && <p style={{ background: '#f2ecfa', color: '#60488c', padding: 12, borderRadius: 7 }}>{notice}</p>}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14, marginTop: 24 }}>{channels.map(channel => <article key={channel.name} style={{ background: '#fff', border: '1px solid #e7e2e8', borderRadius: 10, padding: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ background: channel.color, color: '#fff', minWidth: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 800 }}>{channel.icon}</span><div><b>{channel.name}</b><small style={{ display: 'block', color: '#857d8a', marginTop: 3 }}>Noch nicht verbunden</small></div></div><p style={{ minHeight: 38, color: '#625b68', fontSize: 13 }}>{channel.detail}</p><small style={{ display: 'block', color: '#938c99', marginBottom: 13 }}>Autorisierung: {channel.scope}</small><button onClick={() => setNotice(`${channel.name} ist vorbereitet. Für die Live-Verbindung werden noch die offiziellen OAuth-Zugangsdaten dieses Kanals im sicheren Server-Backend hinterlegt.`)} style={{ border: 0, background: '#292639', color: '#fff', borderRadius: 6, padding: '9px 12px', cursor: 'pointer', fontWeight: 700 }}>Verbindung vorbereiten</button></article>)}</div><p style={{ marginTop: 26, color: '#817a87', fontSize: 12 }}>Hinweis: Für WhatsApp sind ausschließlich WhatsApp-Business-Funktionen vorgesehen. Private Chats werden nicht automatisiert versendet.</p></section></main>
}
