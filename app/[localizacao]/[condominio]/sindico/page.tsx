'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

type Condominio = {
  id: string
  slug: string
  nome: string
  endereco: string
  horario_limite: string
  regras: string | null
  sindico_nome: string
  sindico_contato: string
  senha_sindico: string
  senha_portaria: string
  localizacao_id: string
  localizacoes?: { nome: string; slug: string } | null
}

type Reserva = {
  id: string
  data: string
  nome_morador: string
  criado_em: string
  unidades_guardasol: { numero: string } | null
}

type Unidade = {
  id: string
  numero: string
}

export default function PainelSindico() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [condo, setCondo] = useState<Condominio | null>(null)
  const [reservasHoje, setReservasHoje] = useState<Reserva[]>([])
  const [totalUnidades, setTotalUnidades] = useState(0)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [novaUnidade, setNovaUnidade] = useState('')
  const [loadingUnidade, setLoadingUnidade] = useState(false)
  const [loading, setLoading] = useState(false)

  async function autenticar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { data: localizacao } = await supabase
      .from('localizacoes')
      .select('id')
      .eq('slug', localizacaoSlug)
      .single()

    if (!localizacao) {
      setErro('Localização não encontrada.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('condominios_guardasol')
      .select('*, localizacoes(nome, slug)')
      .eq('slug', condominioSlug)
      .eq('localizacao_id', localizacao.id)
      .eq('senha_sindico', senha)
      .single()

    if (error || !data) {
      setErro('Senha incorreta.')
      setLoading(false)
      return
    }

    setCondo(data as Condominio)
    setAutenticado(true)
    setLoading(false)
    carregarReservasHoje(data.id)
    carregarTotalUnidades(data.id)
    carregarUnidades(data.id)
  }

  async function carregarReservasHoje(condoId: string) {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('reservas_guardasol')
      .select('*, unidades_guardasol(numero)')
      .eq('condominio_id', condoId)
      .eq('data', hoje)
      .order('criado_em', { ascending: true })

    setReservasHoje((data as Reserva[]) || [])
  }

  async function carregarTotalUnidades(condoId: string) {
    const { count } = await supabase
      .from('unidades_guardasol')
      .select('*', { count: 'exact', head: true })
      .eq('condominio_id', condoId)

    setTotalUnidades(count || 0)
  }

  async function carregarUnidades(condoId: string) {
    const { data } = await supabase
      .from('unidades_guardasol')
      .select('id, numero')
      .eq('condominio_id', condoId)
      .order('numero', { ascending: true })

    setUnidades((data as Unidade[]) || [])
  }

  async function adicionarUnidade(e: React.FormEvent) {
    e.preventDefault()
    if (!novaUnidade.trim() || !condo) return
    setLoadingUnidade(true)

    const { error } = await supabase
      .from('unidades_guardasol')
      .insert({ condominio_id: condo.id, numero: novaUnidade.trim() })

    if (error) {
      alert('Erro ao adicionar unidade: ' + error.message)
      setLoadingUnidade(false)
      return
    }

    setNovaUnidade('')
    await carregarUnidades(condo.id)
    await carregarTotalUnidades(condo.id)
    setLoadingUnidade(false)
  }

  async function removerUnidade(unidadeId: string, numero: string) {
    if (!condo) return

    const { count } = await supabase
      .from('reservas_guardasol')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', unidadeId)

    if (count && count > 0) {
      alert(`Não é possível remover o apto ${numero}. Existem ${count} reserva(s) registrada(s) no histórico desta unidade.`)
      return
    }

    if (!confirm(`Remover o apto ${numero}?`)) return

    const { error } = await supabase
      .from('unidades_guardasol')
      .delete()
      .eq('id', unidadeId)

    if (error) {
      alert('Erro ao remover unidade: ' + error.message)
      return
    }

    await carregarUnidades(condo.id)
    await carregarTotalUnidades(condo.id)
  }

  const linkProprietario = typeof window !== 'undefined'
    ? `${window.location.origin}/${localizacaoSlug}/${condominioSlug}`
    : ''
  const linkPortaria = typeof window !== 'undefined'
    ? `${window.location.origin}/${localizacaoSlug}/${condominioSlug}/portaria`
    : ''

  function copiar(texto: string, label: string) {
    navigator.clipboard.writeText(texto)
    alert(`${label} copiado!`)
  }

  // Tela de login
  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
              GUARDA-SOL NA PRAIA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              by SS Condo
            </div>
          </a>
        </header>

        <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 6 }}>Painel do síndico</h1>
              <p style={{ fontSize: 14, color: '#555' }}>Entre com sua senha para gerenciar o condomínio</p>
            </div>
            <div className="card-form">
              <form onSubmit={autenticar}>
                <div style={{ marginBottom: 16 }}>
                  <label>Senha do síndico</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite a senha" required autoFocus />
                </div>
                {erro && (
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>
                    {erro}
                  </div>
                )}
                <button
                  type="submit"
                  style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer style={{ backgroundColor: '#00210D', padding: '24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Guarda-Sol na Praia · {new Date().getFullYear()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>powered by</span>
              <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <img src="/sscondo-logo.jpg" alt="SS Condo" style={{ height: 32, borderRadius: 4 }} />
                <div style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>Safe Season</div>
              </a>
            </div>
          </div>
        </footer>
      </main>
    )
  }

  // Tela principal
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>

      <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            GUARDA-SOL NA PRAIA
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
            by SS Condo
          </div>
        </a>
      </header>

      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Painel do síndico
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#00210D' }}>{condo?.nome}</h1>
          <div style={{ fontSize: 14, color: '#555', marginTop: 6 }}>
            {condo?.endereco} · {condo?.localizacoes?.nome}
          </div>
        </div>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="card-form" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D' }}>{reservasHoje.length}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Reservas hoje</div>
          </div>
          <div className="card-form" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D' }}>{totalUnidades}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Unidades cadastradas</div>
          </div>
        </div>

        {/* Links */}
        <div className="card-form">
          <h2>Links de acesso</h2>

          <div style={{ marginBottom: 16 }}>
            <label>Link dos proprietários</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={linkProprietario} style={{ flex: 1, fontSize: 13 }} />
              <button
                type="button"
                onClick={() => copiar(linkProprietario, 'Link')}
                style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Copiar
              </button>
            </div>
          </div>

          <div>
            <label>Link da portaria</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={linkPortaria} style={{ flex: 1, fontSize: 13 }} />
              <button
                type="button"
                onClick={() => copiar(linkPortaria, 'Link da portaria')}
                style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="card-form">
          <h2>Configurações</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#555' }}>Horário limite</span>
              <span style={{ color: '#00210D', fontWeight: 500 }}>{condo?.horario_limite?.slice(0, 5)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#555' }}>Síndico responsável</span>
              <span style={{ color: '#00210D', fontWeight: 500 }}>{condo?.sindico_nome}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#555' }}>Contato</span>
              <span style={{ color: '#00210D', fontWeight: 500 }}>{condo?.sindico_contato}</span>
            </div>
            {condo?.regras && (
              <div style={{ fontSize: 14, marginTop: 6 }}>
                <div style={{ color: '#555', marginBottom: 4 }}>Regras</div>
                <div style={{ color: '#00210D' }}>{condo.regras}</div>
              </div>
            )}
          </div>
        </div>

        {/* Unidades */}
        <div className="card-form">
          <h2>Unidades cadastradas</h2>

          <form onSubmit={adicionarUnidade} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={novaUnidade}
              onChange={e => setNovaUnidade(e.target.value)}
              placeholder="Ex: 101"
              style={{ flex: 1 }}
              disabled={loadingUnidade}
            />
            <button
              type="submit"
              style={{ padding: '10px 16px', backgroundColor: '#00210D', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              disabled={loadingUnidade || !novaUnidade.trim()}
            >
              {loadingUnidade ? '...' : '+ Adicionar'}
            </button>
          </form>

          {unidades.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unidades.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8E4DC' }}>
                  <span style={{ fontSize: 15, color: '#00210D' }}>Apto {u.numero}</span>
                  <button
                    onClick={() => removerUnidade(u.id, u.numero)}
                    style={{ backgroundColor: 'transparent', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reservas hoje */}
        <div className="card-form" style={{ marginBottom: 32 }}>
          <h2>Reservas de hoje</h2>
          {reservasHoje.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma reserva para hoje ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reservasHoje.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8E4DC' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#00210D' }}>Apto {r.unidades_guardasol?.numero}</div>
                    {r.nome_morador && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.nome_morador}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, backgroundColor: 'rgba(192,171,96,0.15)', color: '#8a7a44', padding: '4px 10px', borderRadius: 6 }}>Confirmado</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

      <footer style={{ backgroundColor: '#00210D', padding: '24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Guarda-Sol na Praia · {new Date().getFullYear()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>powered by</span>
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/sscondo-logo.jpg" alt="SS Condo" style={{ height: 32, borderRadius: 4 }} />
              <div style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>Safe Season</div>
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}