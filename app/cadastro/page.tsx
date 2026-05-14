'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Localizacao = { id: string; nome: string; slug: string }
type Condominio = { id: string; nome: string; slug: string; status: string }

const WHATSAPP_SUPORTE = '5513996655551'

export default function Login() {
  const router = useRouter()

  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [localizacaoId, setLocalizacaoId] = useState('')
  const [outraLocalizacao, setOutraLocalizacao] = useState(false)
  const [novaLocalizacaoNome, setNovaLocalizacaoNome] = useState('')

  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [condominioSelecionado, setCondominioSelecionado] = useState<Condominio | null>(null)
  const [outroCondominio, setOutroCondominio] = useState(false)
  const [novoCondominioNome, setNovoCondominioNome] = useState('')

  const [etapa, setEtapa] = useState<'selecao' | 'login' | 'ativacao' | 'cadastro_novo' | 'sucesso'>('selecao')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  const [senhaLogin, setSenhaLogin] = useState('')
  const [verSenhaLogin, setVerSenhaLogin] = useState(false)

  const [form, setForm] = useState({
    sindico_nome: '',
    sindico_contato: '',
    sindico_email: '',
    endereco: '',
    senha_sindico: '',
    senha_portaria: '',
  })
  const [verSenhaSindico, setVerSenhaSindico] = useState(false)
  const [verSenhaPortaria, setVerSenhaPortaria] = useState(false)

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
        .order('nome')
      setCondominios((data as Condominio[]) || [])
    }
    carregar()
  }, [localizacaoId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function gerarSlug(nome: string) {
    return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function continuar() {
    setErro('')

    if (outraLocalizacao || outroCondominio) {
      if (outraLocalizacao && !novaLocalizacaoNome.trim()) {
        setErro('Informe o nome da localização.')
        return
      }
      if (outroCondominio && !novoCondominioNome.trim()) {
        setErro('Informe o nome do condomínio.')
        return
      }
      setEtapa('cadastro_novo')
      return
    }

    if (!localizacaoId || !condominioSelecionado) {
      setErro('Selecione a localização e o condomínio.')
      return
    }

    if (condominioSelecionado.status === 'ativo') {
      setEtapa('login')
    } else if (condominioSelecionado.status === 'aguardando_aprovacao') {
      setErro('Este condomínio já foi cadastrado e está aguardando aprovação.')
    } else {
      setEtapa('ativacao')
    }
  }

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!condominioSelecionado) return

    const { data } = await supabase
      .from('condominios_guardasol')
      .select('senha_sindico, slug, localizacoes(slug)')
      .eq('id', condominioSelecionado.id)
      .single()

    if (!data || data.senha_sindico !== senhaLogin) {
      setErro('Senha incorreta.')
      return
    }

    const locSlug = (data.localizacoes as unknown as { slug: string } | null)?.slug
    router.push(`/${locSlug}/${data.slug}/sindico`)
  }

  async function ativarCondominio(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (!condominioSelecionado) { setCarregando(false); return }

    const { error } = await supabase
      .from('condominios_guardasol')
      .update({
        ...form,
        status: 'ativo',
        aprovado_em: new Date().toISOString(),
      })
      .eq('id', condominioSelecionado.id)

    if (error) {
      setErro('Erro ao ativar: ' + error.message)
      setCarregando(false)
      return
    }

    setMensagemSucesso('Condomínio ativado com sucesso! Você já pode entrar.')
    setEtapa('sucesso')
    setCarregando(false)
  }

  async function cadastrarNovo(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    let locId = localizacaoId

    if (outraLocalizacao) {
      const locSlug = gerarSlug(novaLocalizacaoNome)
      const { data: locExistente } = await supabase
        .from('localizacoes')
        .select('id')
        .eq('slug', locSlug)
        .maybeSingle()

      if (locExistente) {
        locId = locExistente.id
      } else {
        const { data: novaLoc, error: errLoc } = await supabase
          .from('localizacoes')
          .insert({ nome: novaLocalizacaoNome.trim(), slug: locSlug, cidade: novaLocalizacaoNome.trim(), estado: 'SP' })
          .select()
          .single()
        if (errLoc || !novaLoc) {
          setErro('Erro ao criar localização: ' + (errLoc?.message || ''))
          setCarregando(false)
          return
        }
        locId = novaLoc.id
      }
    }

    const condoSlug = gerarSlug(novoCondominioNome)
    const { error } = await supabase
      .from('condominios_guardasol')
      .insert({
        ...form,
        nome: novoCondominioNome.trim(),
        slug: condoSlug,
        localizacao_id: locId,
        status: 'aguardando_aprovacao',
      })

    if (error) {
      setErro('Erro ao cadastrar: ' + error.message)
      setCarregando(false)
      return
    }

    setMensagemSucesso('Cadastro enviado! Vamos analisar e em breve liberamos o acesso.')
    setEtapa('sucesso')
    setCarregando(false)
  }

  function Header() {
    return (
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
        </a>
      </header>
    )
  }

  if (etapa === 'sucesso') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <section style={{ flex: 1, padding: '40px 24px', maxWidth: 480, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌴</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 12 }}>Tudo certo!</h1>
          <p style={{ fontSize: 15, color: '#555', marginBottom: 28, lineHeight: 1.6 }}>{mensagemSucesso}</p>
          <a href="/" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '12px 32px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Voltar para o início</a>
        </section>
      </main>
    )
  }

  if (etapa === 'login') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <section style={{ flex: 1, padding: '40px 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <button onClick={() => setEtapa('selecao')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Voltar</button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 8 }}>Entrar</h1>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>{condominioSelecionado?.nome}</p>

          <form onSubmit={fazerLogin}>
            <div className="card-form">
              <div style={{ marginBottom: 16 }}>
                <label>Senha do síndico *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verSenhaLogin ? 'text' : 'password'}
                    value={senhaLogin}
                    onChange={e => setSenhaLogin(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    autoFocus
                    style={{ paddingRight: 80 }}
                  />
                  <button type="button" onClick={() => setVerSenhaLogin(!verSenhaLogin)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>
                    {verSenhaLogin ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>}

              <button type="submit" style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>Entrar</button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
              <a href={`https://wa.me/${WHATSAPP_SUPORTE}?text=Ola! Esqueci minha senha do Guarda-Sol na Praia.`} target="_blank" rel="noopener noreferrer" style={{ color: '#00210D', textDecoration: 'underline' }}>Esqueci minha senha</a>
            </p>
          </form>
        </section>
      </main>
    )
  }

  if (etapa === 'ativacao' || etapa === 'cadastro_novo') {
    const titulo = etapa === 'ativacao' ? 'Ativar condomínio' : 'Cadastrar novo condomínio'
    const nomeExibicao = etapa === 'ativacao' ? condominioSelecionado?.nome : novoCondominioNome
    const handler = etapa === 'ativacao' ? ativarCondominio : cadastrarNovo

    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <section style={{ flex: 1, padding: '40px 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <button onClick={() => setEtapa('selecao')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Voltar</button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 8 }}>{titulo}</h1>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>{nomeExibicao}</p>

          <form onSubmit={handler}>
            <div className="card-form">
              <h2>Dados do síndico</h2>
              <div style={{ marginBottom: 16 }}>
                <label>Nome do síndico *</label>
                <input name="sindico_nome" value={form.sindico_nome} onChange={handleChange} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Telefone *</label>
                <input name="sindico_contato" value={form.sindico_contato} onChange={handleChange} placeholder="(11) 99999-9999" required />
              </div>
              <div>
                <label>Email *</label>
                <input name="sindico_email" type="email" value={form.sindico_email} onChange={handleChange} placeholder="seu@email.com" required />
              </div>
            </div>

            <div className="card-form">
              <h2>Endereço</h2>
              <div>
                <label>Endereço do condomínio *</label>
                <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, número" required />
              </div>
            </div>

            <div className="card-form" style={{ marginBottom: 32 }}>
              <h2 style={{ marginBottom: 8 }}>Senhas de acesso</h2>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Guarde essas senhas. Você precisará delas para acessar o painel.</p>

              <div style={{ marginBottom: 16 }}>
                <label>Senha do síndico *</label>
                <div style={{ position: 'relative' }}>
                  <input name="senha_sindico" type={verSenhaSindico ? 'text' : 'password'} value={form.senha_sindico} onChange={handleChange} required style={{ paddingRight: 80 }} />
                  <button type="button" onClick={() => setVerSenhaSindico(!verSenhaSindico)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>{verSenhaSindico ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>

              <div>
                <label>Senha da portaria *</label>
                <div style={{ position: 'relative' }}>
                  <input name="senha_portaria" type={verSenhaPortaria ? 'text' : 'password'} value={form.senha_portaria} onChange={handleChange} required style={{ paddingRight: 80 }} />
                  <button type="button" onClick={() => setVerSenhaPortaria(!verSenhaPortaria)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>{verSenhaPortaria ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>
            </div>

            {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#B91C1C' }}>{erro}</div>}

            <button type="submit" disabled={carregando} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15 }}>
              {carregando ? 'Enviando...' : (etapa === 'ativacao' ? 'Ativar condomínio' : 'Solicitar cadastro')}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <a href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← Voltar</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#00210D', marginBottom: 8 }}>Acesso do síndico</h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Selecione a localização e o condomínio para continuar.</p>

        <div className="card-form">
          <div style={{ marginBottom: 16 }}>
            <label>Localização *</label>
            <select value={outraLocalizacao ? '__outra__' : localizacaoId} onChange={e => {
              if (e.target.value === '__outra__') {
                setOutraLocalizacao(true)
                setLocalizacaoId('')
                setCondominioSelecionado(null)
              } else {
                setOutraLocalizacao(false)
                setLocalizacaoId(e.target.value)
                setCondominioSelecionado(null)
                setOutroCondominio(false)
              }
            }} required>
              <option value="">Selecione...</option>
              {localizacoes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              <option value="__outra__">Outra (não está na lista)</option>
            </select>
          </div>

          {outraLocalizacao && (
            <div style={{ marginBottom: 16 }}>
              <label>Nome da localização *</label>
              <input 
                list="localizacoes-sugestoes"
                value={novaLocalizacaoNome} 
                onChange={e => setNovaLocalizacaoNome(e.target.value)} 
                placeholder="Ex: Maresias, Guarujá..." 
                required 
              />
              <datalist id="localizacoes-sugestoes">
                {localizacoes.map(l => <option key={l.id} value={l.nome} />)}
              </datalist>
            </div>
          )}

          {(localizacaoId || outraLocalizacao) && (
            <div style={{ marginBottom: 16 }}>
              <label>Condomínio *</label>
              {!outraLocalizacao && (
                <select value={outroCondominio ? '__outro__' : (condominioSelecionado?.id || '')} onChange={e => {
                  if (e.target.value === '__outro__') {
                    setOutroCondominio(true)
                    setCondominioSelecionado(null)
                  } else {
                    setOutroCondominio(false)
                    const cond = condominios.find(c => c.id === e.target.value) || null
                    setCondominioSelecionado(cond)
                  }
                }} required>
                  <option value="">Selecione...</option>
                  {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  <option value="__outro__">Outro (não está na lista)</option>
                </select>
              )}

              {(outroCondominio || outraLocalizacao) && (
                <input value={novoCondominioNome} onChange={e => setNovoCondominioNome(e.target.value)} placeholder="Nome do condomínio" required style={{ marginTop: outraLocalizacao ? 0 : 8 }} />
              )}
            </div>
          )}

          {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>}

          <button onClick={continuar} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>Continuar</button>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#555', textAlign: 'center', fontStyle: 'italic' }}>
          Primeiro acesso? Selecione seu condomínio para ativá-lo.
        </p>
      </section>
    </main>
  )
}