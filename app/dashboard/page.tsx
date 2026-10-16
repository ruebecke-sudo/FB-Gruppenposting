'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Organization = { id: string; name: string }
type Campaign = { id: string; name: string; created_at: string; posts: { id: string }[] }
const button = { border: 0, borderRadius: 6, background: '#ea725b', color: '#fff', padding: '11px 14px', cursor: 'pointer', fontWeight: 700 } as const

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null), [userId, setUserId] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<Organization[]>([]), [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [orgName, setOrgName] = useState(''), [campaignName, setCampaignName] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const supabase = createClient()
  async function loadWorkspace() {
    const { data, error } = await supabase.from('organizations').select('id,name').order('created_at')
    if (error) return setMessage(error.message)
    const organizations = (data ?? []) as Organization[]; setOrgs(organizations)
    if (!organizations.length) return setCampaigns([])
    const { data: campaignData, error: campaignError } = await supabase.from('campaigns').select('id,name,created_at,posts(id)').eq('organization_id', organizations[0].id).order('created_at', { ascending: false })
    if (campaignError) return setMessage(campaignError.message)
    setCampaigns((campaignData ?? []) as Campaign[])
  }
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) return location.replace('/login'); setEmail(data.user.email ?? 'MDW Nutzer:in'); setUserId(data.user.id); loadWorkspace() }) }, [])
  async function createOrganization(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); const { error } = await supabase.from('organizations').insert({ name: orgName }); setBusy(false); if (error) return setMessage(error.message); setOrgName(''); await loadWorkspace() }
  async function createCampaign(event: FormEvent) { event.preventDefault(); if (!orgs[0] || !userId) return; setBusy(true); setMessage(''); const { error } = await supabase.from('campaigns').insert({ organization_id: orgs[0].id, name: campaignName, created_by: userId }); setBusy(false); if (error) return setMessage(error.message); setCampaignName(''); await loadWorkspace() }
  async function signOut() { await supabase.auth.signOut(); location.assign('/') }
  if (!email) return <main style={{ padding: 48, fontFamily: 'sans-serif' }}>Workspace wird geladen …</main>
  return <main style={{ minHeight: '100vh', padding: '28px 48px', background: '#fbfafb', fontFamily: 'DM Sans, sans-serif', color: '#292639' }}><header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}><div style={{ display: 'flex', gap: 18, alignItems: 'center' }}><img src="/mdw-logo.jpg" alt="MDW – My Digital World" style={{ width: 115, borderRadius: 5, boxShadow: '0 5px 18px #28203730' }}/><div><p style={{ color: '#847e8a', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>MDW PUBLISH / SICHERER WORKSPACE</p><h1 style={{ fontFamily: 'Playfair Display, serif', margin: 0 }}>Willkommen, {email}.</h1></div></div><button onClick={signOut} style={{ ...button, background: '#fff', color: '#5f5866', border: '1px solid #ddd7e1' }}>Abmelden</button></header>{message && <p style={{ background: '#f6eef8', color: '#664f8e', padding: 12, borderRadius: 6 }}>{message}</p>}{!orgs.length ? <section style={{ maxWidth: 520, marginTop: 46, padding: 25, border: '1px solid #e8e3e9', background: '#fff', borderRadius: 10 }}><p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#8f8896' }}>ERSTER SCHRITT</p><h2 style={{ fontFamily: 'Playfair Display, serif' }}>Erstelle deinen Workspace.</h2><p style={{ color: '#746d79', lineHeight: 1.55 }}>Deine Daten werden danach ausschließlich in diesem Bereich gespeichert.</p><form onSubmit={createOrganization}><input required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="z. B. My Digital World" style={{ width: '100%', padding: 11, border: '1px solid #ddd7e1', borderRadius: 6, margin: '8px 0 12px' }}/><button disabled={busy} style={button}>{busy ? 'Wird erstellt …' : 'Workspace erstellen →'}</button></form></section> : <section style={{ marginTop: 38, maxWidth: 840 }}><p style={{ color: '#847e8a', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ORGANISATION / {orgs[0].name.toUpperCase()}</p><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}><h2 style={{ fontFamily: 'Playfair Display, serif', margin: '4px 0 20px' }}>Kampagnen</h2><form onSubmit={createCampaign} style={{ display: 'flex', gap: 8 }}><input required value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Neue Kampagne" style={{ padding: 10, border: '1px solid #ddd7e1', borderRadius: 6 }}/><button disabled={busy} style={button}>+ Erstellen</button></form></div>{campaigns.length ? <div style={{ display: 'grid', gap: 10 }}>{campaigns.map(campaign => <a href={`/dashboard/campaign/${campaign.id}`} key={campaign.id} style={{ padding: 16, border: '1px solid #e8e3e9', background: '#fff', borderRadius: 8, color: '#292639', textDecoration: 'none', cursor: 'pointer' }}><b>{campaign.name}</b><small style={{ display: 'block', color: '#8b8491', marginTop: 5 }}>{campaign.posts.length} Beitrag/Beiträge · Zum Editor öffnen →</small></a>)}</div> : <p style={{ color: '#746d79' }}>Noch keine Kampagnen angelegt.</p>}</section>}</main>
}
