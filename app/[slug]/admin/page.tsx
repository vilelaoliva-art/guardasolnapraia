'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'

export default function Admin() {
  const params = useParams()
  const slug = params.slug as string
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [condo, setCondo] = useState<any>(null)
  const [reservasHoje, setReservasHoje] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function autenticar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { data, error } = await supabase
      .from('condominios_guardasol')
      .select('*')
      .eq('slug', slug)
      .eq('senha_sindico', senha)
      .single()

    if (error || !data) {
      setErro('Senha incorreta.')
      setLoading(false)
      return
    }

    setCondo(data)
    setAutenticado(true)
    setLoading(false)
    carregarReservasHoje(data.id)
  }

  async function carregarReservasHoje(condoId: string) {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('reservas_guardasol')
      .select('*, unidades_guardasol(numero)')
      .eq('condominio_id', condoId)
      .eq('data', hoje)
      .order('criado_em', { ascending: true })

    setReservasHoje(data || [])
  }

  const linkProprietario = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : ''
  const linkPortaria = typeof window !== 'undefined' ? `${window.location.origin}/${slug}/portaria` : ''

  function copiar(texto: string, label: string) {
    navigator.clipboard.writeText(texto)
    alert(`${label} copiado!`)
  }

  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C0AB60' }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Painel do sindico</div>
          </div>
          <div className="card">
            <form onSubmit={autenticar}>
              <div style={{ marginBottom: 16 }}>
                <label>Senha do sindico</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite a senha" required autoFocus />
              </div>
              {erro && <div style={{ color: '#ff9090', fontSize: 13, marginBottom: 12 }}>{erro}</div>}
              <button type="submit" className="btn-dourado" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', padding: '32px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Painel do sindico</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C0AB60' }}>{condo.nome}</h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{condo.endereco} · {condo.cidade}</div>
        </div>

        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#C0AB60' }}>{reservasHoje.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Reservas hoje</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#C0AB60' }}>{condo.num_guardasois}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Guarda-sois disponiveis</div>
          </div>
        </div>

        {/* Links */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Links de acesso</h2>

          <div style={{ marginBottom: 16 }}>
            <label>Link dos proprietarios</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={linkProprietario} style={{ flex: 1, fontSize: 13 }} />
              <button className="btn-outline" style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 13 }} onClick={() => copiar(linkProprietario, 'Link')}>
                Copiar
              </button>
            </div>
          </div>

          <div>
            <label>Link da portaria</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={linkPortaria} style={{ flex: 1, fontSize: 13 }} />
              <button className="btn-outline" style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 13 }} onClick={() => copiar(linkPortaria, 'Link da portaria')}>
                Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Informacoes */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Configuracoes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Horario limite</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo.horario_limite?.slice(0, 5)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sindico responsavel</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo.sindico_nome}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Contato</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo.sindico_contato}</span>
            </div>
            {condo.regras && (
              <div style={{ fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Regras</span>
                <span style={{ color: 'white' }}>{condo.regras}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reservas hoje */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Reservas de hoje</h2>
          {reservasHoje.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma reserva para hoje ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reservasHoje.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(192,171,96,0.1)' }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>Apto {r.unidades_guardasol?.numero}</span>
                  <span style={{ fontSize: 12, backgroundColor: 'rgba(192,171,96,0.15)', color: '#C0AB60', padding: '4px 10px', borderRadius: 6 }}>Confirmado</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}