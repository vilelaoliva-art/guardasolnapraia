'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Localizacao = { id: string; nome: string; slug: string }
type Condominio = { id: string; nome: string; slug: string; status: string }
type Perfil = 'sindico' | 'portaria'

const WHATSAPP_SUPORTE = '5513996655551'

export default function Login() {
  const router = useRouter()

  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [localizacaoId, setLocalizacaoId] = useState('')
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [condominioId, setCondominioId] = useState('')
  const [perfil, setPerfil] = useState<Perfil | ''>('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

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
    setPerfil('')
    setSenha('')
  }, [localizacaoId])

  // quando troca o condomínio, reseta perfil e senha
  useEffect(() => {
    setPerfil('')
    setSenha('')
  }, [condominioId])

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (!localizacaoId || !condominioId || !perfil || !senha) {
      setErro('Preencha todos os campos.')
      setCarregando(false)
      return
    }

    const colunaSenha = perfil === 'sindico' ? 'senha_sindico' : 'senha_portaria'

    const { data } = await supabase
      .from('condominios_guardasol')
      .select(`${colunaSenha}, slug, localizacoes(slug)`)
      .eq('id', condominioId)
      .single()

    const senhaCorreta = (data as Record<string, unknown> | null)?.[colunaSenha] as string | undefined

    if (!data || senhaCorreta !== senha) {
      setErro('Senha incorreta.')
      setCarregando(false)
      return
    }

    const locSlug = (data.localizacoes as unknown as { slug: string } | null)?.slug
    const condoSlug = (data as unknown as { slug: string }).slug

    if (perfil === 'sindico') {
      sessionStorage.setItem('sindico_auth_' + condominioId, 'true')
      router.push(`/${locSlug}/${condoSlug}/sindico`)
    } else {
      sessionStorage.setItem('portaria_auth_' + condominioId, 'true')
      router.push(`/${locSlug}/${condoSlug}/portaria`)
    }
  }

  const labelSenha = perfil === 'portaria' ? 'Senha da portaria *' : 'Senha do síndico *'

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
            <div style={{ marginBottom: 16 }}>
              <label>Localização *</label>
              <select value={localizacaoId} onChange={e => setLocalizacaoId(e.target.value)} required>
                <option value="">Selecione...</option>
                {localizacoes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>

            {localizacaoId && (
              <div style={{ marginBottom: 16 }}>
                <label>Condomínio *</label>
                <select value={condominioId} onChange={e => setCondominioId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {condominios.length === 0 && (
                  <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
                    Nenhum condomínio ativo nesta localização.
                  </span>
                )}
              </div>
            )}

            {condominioId && (
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

            {condominioId && perfil && (
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