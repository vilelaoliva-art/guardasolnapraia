'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Localizacao = { id: string; nome: string; slug: string }
type Condominio = { id: string; nome: string; slug: string; status: string }
type Perfil = 'sindico' | 'portaria'

const WHATSAPP_SUPORTE = '5513996655551'

export default function Login() {
  const router = useRouter()

  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])

  const [buscaLoc, setBuscaLoc] = useState('')
  const [locSelecionada, setLocSelecionada] = useState<Localizacao | null>(null)
  const [mostrarSugLoc, setMostrarSugLoc] = useState(false)

  const [buscaCondo, setBuscaCondo] = useState('')
  const [condoSelecionado, setCondoSelecionado] = useState<Condominio | null>(null)
  const [mostrarSugCondo, setMostrarSugCondo] = useState(false)

  const [perfil, setPerfil] = useState<Perfil | ''>('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const refLoc = useRef<HTMLDivElement>(null)
  const refCondo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('localizacoes').select('id, nome, slug').order('nome')
      setLocalizacoes((data as Localizacao[]) || [])
    }
    carregar()
  }, [])

  useEffect(() => {
    async function carregar() {
      if (!locSelecionada) { setCondominios([]); return }
      const { data } = await supabase
        .from('condominios_guardasol')
        .select('id, nome, slug, status')
        .eq('localizacao_id', locSelecionada.id)
        .eq('status', 'ativo')
        .order('nome')
      setCondominios((data as Condominio[]) || [])
    }
    carregar()
    setBuscaCondo('')
    setCondoSelecionado(null)
    setPerfil('')
    setSenha('')
  }, [locSelecionada])

  useEffect(() => {
    setPerfil('')
    setSenha('')
  }, [condoSelecionado])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (refLoc.current && !refLoc.current.contains(e.target as Node)) setMostrarSugLoc(false)
      if (refCondo.current && !refCondo.current.contains(e.target as Node)) setMostrarSugCondo(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function normalizar(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const sugestoesLoc = buscaLoc.trim().length > 0
    ? localizacoes.filter(l => normalizar(l.nome).includes(normalizar(buscaLoc))).slice(0, 8)
    : []

  const sugestoesCondo = buscaCondo.trim().length > 0
    ? condominios.filter(c => normalizar(c.nome).includes(normalizar(buscaCondo))).slice(0, 8)
    : []

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (!locSelecionada || !condoSelecionado || !perfil || !senha) {
      setErro('Preencha todos os campos.')
      setCarregando(false)
      return
    }

    const { data } = await supabase
      .from('condominios_guardasol')
      .select(`slug, localizacoes(slug)`)
      .eq('id', condoSelecionado.id)
      .single()

    if (!data) {
      setErro('Condomínio não encontrado.')
      setCarregando(false)
      return
    }

    const rpcName = perfil === 'sindico' ? 'verificar_senha_sindico' : 'verificar_senha_portaria'
    const { data: senhaOk, error: erroRpc } = await supabase.rpc(rpcName, {
      p_condominio_id: condoSelecionado.id,
      p_senha: senha,
    })

    if (erroRpc || !senhaOk) {
      setErro('Senha incorreta.')
      setCarregando(false)
      return
    }

    const locSlug = (data.localizacoes as unknown as { slug: string } | null)?.slug
    const condoSlug = (data as unknown as { slug: string }).slug

    if (perfil === 'sindico') {
      sessionStorage.setItem('sindico_auth_' + condoSelecionado.id, 'true')
      router.push(`/${locSlug}/${condoSlug}/sindico`)
    } else {
      sessionStorage.setItem('portaria_auth_' + condoSelecionado.id, 'true')
      router.push(`/${locSlug}/${condoSlug}/portaria`)
    }
  }

  const labelSenha = perfil === 'portaria' ? 'Senha da portaria *' : 'Senha do síndico *'

  const estiloSugestoes: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #E8E4DC',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    maxHeight: 240,
    overflowY: 'auto',
    zIndex: 10,
    textAlign: 'left',
  }

  const estiloItem: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 14,
    color: '#00210D',
    cursor: 'pointer',
    borderBottom: '1px solid #F5F2EC',
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
        </a>
      </header>

      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <a href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← Voltar</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#00210D', marginBottom: 8 }}>Fazer login</h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Acesso ao painel do síndico ou da portaria.</p>

        <form onSubmit={fazerLogin}>
          <div className="card-form">
            <div ref={refLoc} style={{ position: 'relative', marginBottom: 16 }}>
              <label>Localização *</label>
              <input
                type="text"
                placeholder="Digite a localização"
                value={buscaLoc}
                onChange={e => {
                  setBuscaLoc(e.target.value)
                  setLocSelecionada(null)
                  setMostrarSugLoc(true)
                }}
                onFocus={() => setMostrarSugLoc(true)}
                required
              />
              {mostrarSugLoc && sugestoesLoc.length > 0 && (
                <div style={estiloSugestoes}>
                  {sugestoesLoc.map(l => (
                    <div
                      key={l.id}
                      onClick={() => {
                        setLocSelecionada(l)
                        setBuscaLoc(l.nome)
                        setMostrarSugLoc(false)
                      }}
                      style={estiloItem}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAF6EE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                    >
                      {l.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {locSelecionada && (
              <div ref={refCondo} style={{ position: 'relative', marginBottom: 16 }}>
                <label>Condomínio *</label>
                <input
                  type="text"
                  placeholder="Digite o condomínio"
                  value={buscaCondo}
                  onChange={e => {
                    setBuscaCondo(e.target.value)
                    setCondoSelecionado(null)
                    setMostrarSugCondo(true)
                  }}
                  onFocus={() => setMostrarSugCondo(true)}
                  required
                />
                {mostrarSugCondo && sugestoesCondo.length > 0 && (
                  <div style={estiloSugestoes}>
                    {sugestoesCondo.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCondoSelecionado(c)
                          setBuscaCondo(c.nome)
                          setMostrarSugCondo(false)
                        }}
                        style={estiloItem}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAF6EE')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        {c.nome}
                      </div>
                    ))}
                  </div>
                )}
                {buscaCondo.trim().length > 0 && sugestoesCondo.length === 0 && condominios.length === 0 && (
                  <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
                    Nenhum condomínio ativo nesta localização.
                  </span>
                )}
              </div>
            )}

            {condoSelecionado && (
              <div style={{ marginBottom: 16 }}>
                <label>Entrar como *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPerfil('sindico')}
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #00210D',
                      backgroundColor: perfil === 'sindico' ? '#00210D' : 'white',
                      color: perfil === 'sindico' ? 'white' : '#00210D',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Síndico
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerfil('portaria')}
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #00210D',
                      backgroundColor: perfil === 'portaria' ? '#00210D' : 'white',
                      color: perfil === 'portaria' ? 'white' : '#00210D',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Portaria
                  </button>
                </div>
              </div>
            )}

            {condoSelecionado && perfil && (
              <div style={{ marginBottom: 16 }}>
                <label>{labelSenha}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    style={{ paddingRight: 80 }}
                  />
                  <button type="button" onClick={() => setVerSenha(!verSenha)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>
                    {verSenha ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
            )}

            {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>}

            <button type="submit" disabled={carregando} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
            <a href={`https://wa.me/${WHATSAPP_SUPORTE}?text=Ola! Esqueci minha senha do Guarda-Sol na Praia.`} target="_blank" rel="noopener noreferrer" style={{ color: '#00210D', textDecoration: 'underline' }}>Esqueci minha senha</a>
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#555' }}>
            Ainda não tem cadastro? <a href="/cadastro" style={{ color: '#00210D', fontWeight: 600 }}>Cadastrar agora</a>
          </p>
        </form>
      </section>
    </main>
  )
}