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
  const [loading, setLoading] = useState(false)
  const [mostrarPopupUnidades, setMostrarPopupUnidades] = useState(false)

  useEffect(() => {
    async function checarSessao() {
      const { data: localizacao } = await supabase
        .from('localizacoes')
        .select('id')
        .eq('slug', localizacaoSlug)
        .single()
      if (!localizacao) return

      const { data } = await supabase
        .from('condominios_guardasol')
        .select('*, localizacoes(nome, slug)')
        .eq('slug', condominioSlug)
        .eq('localizacao_id', localizacao.id)
        .single()
      if (!data) return

      const autorizado = sessionStorage.getItem('sindico_auth_' + data.id) === 'true'
      if (autorizado) {
        setCondo(data as Condominio)
        setAutenticado(true)
        carregarReservasHoje(data.id)
        carregarTotalUnidades(data.id)
      }
    }
    checarSessao()
  }, [localizacaoSlug, condominioSlug])

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
      .single()

    if (error || !data) {
      setErro('Condomínio não encontrado.')
      setLoading(false)
      return
    }

    const { data: senhaOk, error: erroRpc } = await supabase.rpc('verificar_senha_sindico', {
      p_condominio_id: data.id,
      p_senha: senha,
    })

    if (erroRpc || !senhaOk) {
      setErro('Senha incorreta.')
      setLoading(false)
      return
    }

    setCondo(data as Condominio)
    setAutenticado(true)
    sessionStorage.setItem('sindico_auth_' + data.id, 'true')
    setLoading(false)
    carregarReservasHoje(data.id)
    carregarTotalUnidades(data.id)
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

    const total = count || 0
    setTotalUnidades(total)
    if (total < 10) setMostrarPopupUnidades(true)
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
  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
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
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>
                )}
                <button type="submit" style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }} disabled={loading}>
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer style={{ backgroundColor: '#00210D', padding: '24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Guarda-Sol na Praia · {new Date().getFullYear()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>powered by</span>
              <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <span style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>SS Condo</span>
              </a>
            </div>
          </div>
        </footer>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>

      {mostrarPopupUnidades && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a7a44', backgroundColor: 'rgba(192,171,96,0.25)', padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-block', marginBottom: 12 }}>Atenção</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#00210D', marginBottom: 10 }}>Cadastre as unidades do condomínio</h3>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
              Seu condomínio tem <strong style={{ color: '#00210D' }}>{totalUnidades} {totalUnidades === 1 ? 'unidade cadastrada' : 'unidades cadastradas'}</strong>. Para que os moradores consigam reservar, todas as unidades do prédio precisam estar cadastradas.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setMostrarPopupUnidades(false)} style={{ padding: '12px', backgroundColor: 'white', color: '#00210D', border: '1px solid #00210D', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Mais tarde</button>
              <a href={`/${localizacaoSlug}/${condominioSlug}/sindico/configuracoes`} style={{ padding: '12px', backgroundColor: '#00210D', color: 'white', borderRadius: 999, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Cadastrar agora</a>
            </div>
          </div>
        </div>
      )}
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
        </a>
        <button onClick={() => { if (condo) sessionStorage.removeItem('sindico_auth_' + condo.id); window.location.href = '/'; }} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Sair</button>
      </header>

      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Painel do síndico</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#00210D' }}>{condo?.nome}</h1>
          <div style={{ fontSize: 14, color: '#555', marginTop: 6 }}>{condo?.endereco} · {condo?.localizacoes?.nome}</div>
        </div>

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

        <div style={{ marginBottom: 16, marginTop: 4 }}>
          <a href={`/${localizacaoSlug}/${condominioSlug}/sindico/relatorio`} style={{ display: "block", textAlign: "center", backgroundColor: "#00210D", color: "white", border: "1px solid #00210D", padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ver relatório do mês</a>
          <a href={`/${localizacaoSlug}/${condominioSlug}/sindico/configuracoes`} style={{ display: "block", textAlign: "center", backgroundColor: "#00210D", color: "white", border: "1px solid #00210D", padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", marginTop: 8 }}>Configurações</a>
        </div>

        <div className="card-form">
          <h2>Links de acesso</h2>

          <div style={{ marginBottom: 16 }}>
            <label>Link dos proprietários</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={linkProprietario} style={{ flex: 1, fontSize: 13 }} />
              <button type="button" onClick={() => copiar(linkProprietario, 'Link')} style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Copiar</button>
              <a href={`/${localizacaoSlug}/${condominioSlug}/qrcode`} style={{ padding: '10px 16px', backgroundColor: '#00210D', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>QR code</a>
            </div>
          </div>

          <div>
            <label>Link da portaria</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={linkPortaria} style={{ flex: 1, fontSize: 13 }} />
              <button type="button" onClick={() => copiar(linkPortaria, 'Link da portaria')} style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Copiar</button>
            </div>
          </div>
        </div>

        <div className="card-form" style={{ marginBottom: 32 }}>
          <h2>Reservas de hoje</h2>
          {reservasHoje.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '16px 0' }}>Nenhuma reserva para hoje ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reservasHoje.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8E4DC' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#00210D' }}>Apto {r.unidades_guardasol?.numero}</div>
                    {r.nome_morador && (<div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.nome_morador}</div>)}
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
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Guarda-Sol na Praia · {new Date().getFullYear()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>powered by</span>
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <span style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>SS Condo</span>
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}