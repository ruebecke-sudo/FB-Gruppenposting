'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Organization = { id: string; name: string }
type Campaign = { id: string; name: string; posts: { id: string }[] }

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<Organization[]>([]), [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [orgName, setOrgName] = useState(''), [campaignName, setCampaignName] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [showCreate, setShowCreate] = useState(false)
  const supabase = createClient()

  async function loadWorkspace() {
    const { data, error } = await supabase.from('organizations').select('id,name').order('created_at')
    if (error) return setMessage(error.message)
    const organizations = (data ?? []) as Organization[]
    setOrgs(organizations)
    if (!organizations.length) return setCampaigns([])
    const { data: campaignData, error: campaignError } = await supabase.from('campaigns').select('id,name,posts(id)').eq('organization_id', organizations[0].id).order('created_at', { ascending: false })
    if (campaignError) return setMessage(campaignError.message)
    setCampaigns((campaignData ?? []) as Campaign[])
  }

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) return location.replace('/login'); setEmail(data.user.email ?? 'MDW Nutzer:in'); setUserId(data.user.id); loadWorkspace() }) }, [])
  async function createOrganization(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); const { error } = await supabase.from('organizations').insert({ name: orgName }); setBusy(false); if (error) return setMessage(error.message); setOrgName(''); await loadWorkspace() }
  async function createCampaign(event: FormEvent) { event.preventDefault(); if (!orgs[0] || !userId) return; setBusy(true); setMessage(''); const { error } = await supabase.from('campaigns').insert({ organization_id: orgs[0].id, name: campaignName, created_by: userId }); setBusy(false); if (error) return setMessage(error.message); setCampaignName(''); setShowCreate(false); await loadWorkspace() }
  async function deleteCampaign(campaign: Campaign) { if (!window.confirm(`Kampagne „${campaign.name}“ wirklich löschen? Zugehörige Beiträge werden ebenfalls gelöscht.`)) return; setBusy(true); setMessage(''); const { error } = await supabase.from('campaigns').delete().eq('id', campaign.id); setBusy(false); if (error) return setMessage(error.message); await loadWorkspace() }
  async function signOut() { await supabase.auth.signOut(); location.assign('/') }

  if (!email) return <main className="mdw-page"><div className="mdw-content">Workspace wird geladen …</div></main>
  return <main className="mdw-page"><header className="mdw-header"><div className="mdw-brand"><img src="/mdw-logo.jpg" alt="MDW – My Digital World"/><div><p className="mdw-kicker">MDW PUBLISH / CREATOR WORKSPACE</p><h1 className="mdw-title">Hallo, {email}.</h1></div></div><nav className="mdw-topnav"><a className="mdw-linkbutton mdw-button--quiet" href="/dashboard/groups">Gruppenlisten</a><a className="mdw-linkbutton mdw-button--quiet" href="/dashboard/channels">Kanäle</a><button className="mdw-button mdw-button--quiet" onClick={signOut}>Abmelden</button></nav></header><section className="mdw-content">
    {message && <div className="mdw-modal"><div className="mdw-modal__card"><h2>Hinweis</h2><p>{message}</p><button className="mdw-button" onClick={() => setMessage('')}>Verstanden</button></div></div>}
    {!orgs.length ? <section className="glass-card" style={{ maxWidth: 540, padding: 28 }}><p className="mdw-kicker">ERSTER SCHRITT</p><h2 className="mdw-section-title">Deinen kreativen Workspace anlegen.</h2><p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>Kampagnen, Gruppen und Planungen werden anschließend ausschließlich in deinem Bereich geführt.</p><form onSubmit={createOrganization}><label className="mdw-form-label">Name deines Workspaces<input className="mdw-input" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="z. B. My Digital World"/></label><button disabled={busy} className="mdw-button">{busy ? 'Wird erstellt …' : 'Workspace erstellen →'}</button></form></section> : <><div className="glass-card" style={{ padding: '22px 24px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center' }}><div><p className="mdw-kicker">ORGANISATION / {orgs[0].name.toUpperCase()}</p><h2 className="mdw-section-title">Deine Kampagnen. Klar geplant.</h2><p style={{ color: 'var(--muted)', marginBottom: 0 }}>Inhalte entwickeln, planen und bewusst in deine Gruppen weitergeben.</p></div><button className="mdw-button" onClick={() => setShowCreate(true)}>+ Neue Kampagne</button></div><div className="mdw-section-head"><div><p className="mdw-kicker">KAMPAGNEN-STUDIO</p><h2 className="mdw-section-title">Aktive Projekte</h2></div><span className="mdw-badge">✦ {campaigns.length} Kampagne{campaigns.length === 1 ? '' : 'n'}</span></div>{campaigns.length ? <div className="mdw-grid">{campaigns.map(campaign => <div className="glass-card mdw-campaign" key={campaign.id}><a className="mdw-campaign__main" href={`/dashboard/campaign/${campaign.id}`}><div><b>{campaign.name}</b><small>{campaign.posts.length} Beitrag/Beiträge · Editor und Planung öffnen</small></div><span className="mdw-badge">Öffnen →</span></a><button type="button" className="mdw-delete" disabled={busy} onClick={() => deleteCampaign(campaign)}>Löschen</button></div>)}</div> : <div className="glass-card mdw-empty">Noch keine Kampagne angelegt. Starte mit deiner ersten Content-Idee.</div>}{showCreate && <div className="mdw-modal"><form className="mdw-modal__card" onSubmit={createCampaign}><p className="mdw-kicker">NEUE KAMPAGNE</p><h2>Was möchtest du sichtbar machen?</h2><p>Lege zunächst einen Namen fest. Texte, Medien und Planung folgen im Editor.</p><label className="mdw-form-label">Kampagnenname<input className="mdw-input" required autoFocus value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="z. B. Herbstaktion 2026"/></label><div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button disabled={busy} className="mdw-button">{busy ? 'Erstellt …' : 'Kampagne erstellen'}</button><button type="button" className="mdw-button mdw-button--quiet" onClick={() => setShowCreate(false)}>Abbrechen</button></div></form></div>}</>}</section></main>
}
