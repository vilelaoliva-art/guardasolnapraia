'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

type Localizacao = { id: string; nome: string; slug: string }
type Condominio = { id: string; nome: string; slug: string; status: string }

export default function LocalizadorCondominio() {
  const router = useRouter()

  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [localizacaoId, setLocalizacaoId] = useState('')
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [condominioId, setCondominioId] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('localizacoes').select('id, nome, slug').order('nome')
      setLocalizacoes((data as Localizacao[]) || [])
    }
    carregar()
  }, [])

  useEffect(() => {
    async function carregar() {
      if (!localizacaoId) { setCondominios([]); return }
      const { data } = await supabase
        .from('condominios_guardasol')
        .select('id, nome, slug, status')
        .eq('localizacao_id', localizacaoId)
        .eq('status', 'ativo')
        .order('nome')
      setCondominios((data as Condominio[]) || [])
    }
    carregar()
    setCondominioId('')
  }, [localizacaoId])

  function acessar() {
    setErro('')
    if (!localizacaoId || !condominioId) {
      setErro('Selecione a localização e o condomínio.')
      return
    }
    const loc = localizacoes.find(l => l.id === localizacaoId)
    const cond = condominios.find(c => c.id === condominioId)
    if (!loc || !cond) return
    router.push(`/${loc.slug}/${cond.slug}`)
  }

  return (
    <section style={{ backgroundColor: 'white', padding: '56px 20px', borderTop: '1px solid #E8E4DC' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, color: '#00210D', marginBottom: 8 }}>
          Seu condomínio já é cadastrado?
        </h2>
        <p style={{ fontSize: 15, color: '#555', marginBottom: 28 }}>
          Localize aqui.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <select value={localizacaoId} onChange={e => setLocalizacaoId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, backgroundColor: 'white', color: '#00210D' }}>
            <option value="">Localização</option>
            {localizacoes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>

          <select value={condominioId} onChange={e => setCondominioId(e.target.value)} disabled={!localizacaoId} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, backgroundColor: 'white', color: '#00210D' }}>
            <option value="">Condomínio</option>
            {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>}

        <button onClick={acessar} style={{ backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '14px 40px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15 }}>
          Acessar
        </button>
      </div>
    </section>
  )
}