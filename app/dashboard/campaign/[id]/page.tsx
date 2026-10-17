'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'

type Post = { id: string; body: string; status: string; scheduled_for: string | null }
type FacebookGroup = { id: string; name: string; facebook_url: string }
const primary = { border: 0, borderRadius: 6, background: '#ea725b', color: '#fff', padding: '11px 15px', cursor: 'pointer', fontWeight: 700 } as const

export default function CampaignEditor() {
  const params = useParams<{ id: string }>(), campaignId = params.id
  const [name, setName] = useState('Kampagne'), [text, setText] = useState(''), [date, setDate] = useState(''), [time, setTime] = useState(''), [posts, setPosts] = useState<Post[]>([]), [groups, setGroups] = useState<FacebookGroup[]>([]), [selectedGroups, setSelectedGroups] = useState<string[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data, error } = await supabase.from('campaigns').select('name,organization_id,posts(id,body,status,scheduled_for)').eq('id', campaignId).single()
    if (error) return setMessage(error.message)
    setName(data.name); setPosts((data.posts ?? []) as Post[])
    const [{ data: groupData, error: groupError }, { data: targetData, error: targetError }] = await Promise.all([
      supabase.from('facebook_groups').select('id,name,facebook_url').eq('organization_id', data.organization_id).eq('is_active', true).order('name'),
      supabase.from('campaign_group_targets').select('facebook_group_id').eq('campaign_id', campaignId)
    ])
    if (groupError || targetError) return setMessage('Die Gruppenlisten-Datenbank ist noch nicht aktiviert. Bitte führe die Datei facebook-groups-workflow.sql in Supabase aus.')
    setGroups((groupData ?? []) as FacebookGroup[])
    setSelectedGroups((targetData ?? []).map(target => target.facebook_group_id))
  }

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) location.replace('/login'); else load() }) }, [])
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); const scheduled_for = date && time ? new Date(`${date}T${time}`).toISOString() : null; const status = scheduled_for ? 'scheduled' : 'draft'; const { error } = await supabase.from('posts').insert({ campaign_id: campaignId, body: text, status, scheduled_for }); setBusy(false); if (error) return setMessage(error.message); setText(''); setDate(''); setTime(''); setMessage('Beitrag gespeichert.'); load() }

  async function toggleGroup(groupId: string) {
    const selected = selectedGroups.includes(groupId)
    if (!selected && selectedGroups.length >= 9) return setMessage('Du kannst maximal 9 Gruppen für den Facebook-Übergabeschritt auswählen.')
    setBusy(true); setMessage('')
    const { error } = selected ? await supabase.from('campaign_group_targets').delete().eq('campaign_id', campaignId).eq('facebook_group_id', groupId) : await supabase.from('campaign_group_targets').insert({ campaign_id: campaignId, facebook_group_id: groupId })
    setBusy(false)
    if (error) return setMessage(error.message)
    setSelectedGroups(current => selected ? current.filter(id => id !== groupId) : [...current, groupId])
  }

  async function copyForFacebook() { if (!text.trim()) return setMessage('Bitte schreibe zuerst einen Beitragstext.'); await navigator.clipboard.writeText(text); setMessage('Beitragstext kopiert. Wähle jetzt in Facebook deine Gruppen aus und füge ihn dort ein.') }
  function openFacebook() { if (!selectedGroups.length) return setMessage('Wähle zuerst mindestens eine Gruppe aus.'); window.open('https://www.facebook.com/', '_blank', 'noopener,noreferrer'); setMessage(`${selectedGroups.length} Gruppe${selectedGroups.length === 1 ? '' : 'n'} vorbereitet. Bitte veröffentliche jetzt im offiziellen Facebook-Dialog.`) }

  return <main style={{ minHeight: '100vh', padding: '28px 48px', background: '#fbfafb', fontFamily: 'DM Sans, sans-serif', color: '#292639' }}><header style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 38 }}><a href="/dashboard"><img src="/mdw-logo.jpg" alt="MDW – My Digital World" style={{ width: 112, borderRadius: 5 }}/></a><div><a href="/dashboard" style={{ color: '#7156a0', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>← Kampagnen</a><h1 style={{ fontFamily: 'Playfair Display, serif', margin: '7px 0 0' }}>{name}</h1></div></header><section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,650px) minmax(260px,380px)', gap: 25, alignItems: 'start' }}><form onSubmit={save} style={{ padding: 25, background: '#fff', border: '1px solid #e7e2e8', borderRadius: 10 }}><p style={{ color: '#8a8391', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>NEUER BEITRAG</p><label style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>Beitragstext<textarea required maxLength={500} value={text} onChange={event => setText(event.target.value)} placeholder="Was möchtest du veröffentlichen?" style={{ width: '100%', height: 145, display: 'block', marginTop: 8, border: '1px solid #dcd6e1', borderRadius: 6, padding: 11, font: '14px DM Sans' }}/><small style={{ color: '#8a8391' }}>{text.length}/500 Zeichen</small></label><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}><label style={{ fontSize: 12, fontWeight: 700 }}>Datum (optional)<input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 7, padding: 9, border: '1px solid #dcd6e1', borderRadius: 6 }}/></label><label style={{ fontSize: 12, fontWeight: 700 }}>Uhrzeit (optional)<input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 7, padding: 9, border: '1px solid #dcd6e1', borderRadius: 6 }}/></label></div><p style={{ margin: '18px 0 0', padding: 12, borderRadius: 7, background: '#f7f4fa', color: '#645b6e', fontSize: 12 }}>Für die manuelle Veröffentlichung hinterlegst du deine autorisierten Gruppen einmal in der <a href="/dashboard/groups" style={{ color: '#7156a0', fontWeight: 700 }}>Gruppenliste</a>.</p>{message && <p style={{ background: '#eff8f3', color: '#428469', padding: 10, borderRadius: 6, fontSize: 12 }}>{message}</p>}<button disabled={busy} style={{ ...primary, marginTop: 20 }}>{busy ? 'Speichert …' : date && time ? 'Beitrag einplanen →' : 'Als Entwurf speichern →'}</button></form><aside style={{ padding: 22, background: '#fff', border: '1px solid #e7e2e8', borderRadius: 10 }}><p style={{ color: '#8a8391', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>BEITRÄGE</p>{posts.length ? posts.map(post => <article key={post.id} style={{ padding: '12px 0', borderBottom: '1px solid #eeeaf0' }}><b style={{ display: 'block', fontSize: 13 }}>{post.body.slice(0, 80)}{post.body.length > 80 ? '…' : ''}</b><small style={{ color: '#7f7885' }}>{post.status === 'scheduled' && post.scheduled_for ? `Geplant: ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(post.scheduled_for))}` : 'Entwurf'}</small></article>) : <p style={{ color: '#7f7885', fontSize: 13 }}>Noch keine Beiträge.</p>}</aside><section style={{ padding: 25, background: '#fff', border: '1px solid #e7e2e8', borderRadius: 10 }}><p style={{ color: '#8a8391', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>FACEBOOK-ÜBERGABE</p><h2 style={{ marginTop: 0 }}>Bis zu 9 Gruppen vorbereiten</h2><p style={{ fontSize: 13, lineHeight: 1.5 }}>Wähle deine Zielgruppen. Der Text wird kopiert und Facebook wird geöffnet; die eigentliche Veröffentlichung erfolgt ausschließlich im offiziellen Facebook-Dialog.</p>{groups.length ? <div style={{ display: 'grid', gap: 8 }}>{groups.map(group => <label key={group.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #eeeaf0', fontSize: 13 }}><input type="checkbox" checked={selectedGroups.includes(group.id)} disabled={busy || (!selectedGroups.includes(group.id) && selectedGroups.length >= 9)} onChange={() => toggleGroup(group.id)}/><span>{group.name}</span></label>)}</div> : <p style={{ fontSize: 13 }}>Noch keine Gruppen vorhanden. Lege sie zuerst in der <a href="/dashboard/groups">Gruppenliste</a> an.</p>}<p style={{ fontSize: 12, fontWeight: 700 }}>{selectedGroups.length}/9 Gruppen ausgewählt</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><button type="button" onClick={copyForFacebook} style={primary}>Text kopieren</button><button type="button" onClick={openFacebook} style={primary}>Facebook öffnen ↗</button></div></section></section></main>
}
