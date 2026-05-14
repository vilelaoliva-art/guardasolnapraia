'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Condominio = {
  id: string
  nome: string
  slug: string
  endereco: string | null
  sindico_nome: string | null
  sindico_contato: string | null
  sindico_email: string | null
  status: string
  criado_em: string
  aprovado_em: string | null
  localizacoes: { nome: string; slug: string } | null
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [senhaInput, setSenhaInput] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erroLogin, setErroLogin] = useState('')

  const [aba, setAba] = useState<'pendentes' | 'todos'>('pendentes')
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState({ total: 0, ativos: 0, aguardando: 0, pendentes: 0 })
  const [busca, setBusca] = useState('')

  const [editando, setEditando] = useState<Condominio | null>(null)
  const [formEdit, setFormEdit] = useState({
    nome: '', endereco: '', sindico_nome: '', sindico_contato: '', sindico_email: ''
  })

  function tentarLogin(e: React.FormEvent) {
    e.preventDefault()
    setErroLogin('')
    if (senhaInput === process.env.NEXT_PUBLIC_ADMIN_SENHA) {
      setAutenticado(true)
    } else {
      setErroLogin('Senha incorreta.')
    }
  }

  async function carregar() {
    setCarregando(true)
    let query = supabase
      .from('condominios_guardasol')
      .select('id, nome, slug, endereco, sindico_nome, sindico_contato, sindico_email, status, criado_em, aprovado_em, localizacoes(nome, slug)')
      .order('criado_em', { ascending: false })

    if (aba === 'pendentes') {
      query = query.eq('status', 'aguardando_aprovacao')
    }

    const { data } = await query
    setCondominios((data as unknown as Condominio[]) || [])
    setCarregando(false)
  }

  useEffect(() => {
    if (autenticado) carregar()
  }, [autenticado, aba])

  useEffect(() => {
    async function carregarEstatisticas() {
      if (!autenticado) return
      const { data } = await supabase
        .from('condominios_guardasol')
        .select('status')
      const todos = data || []
      setEstatisticas({
        total: todos.length,
        ativos: todos.filter(c => c.status === 'ativo').length,
        aguardando: todos.filter(c => c.status === 'aguardando_aprovacao').length,
        pendentes: todos.filter(c => c.status === 'pendente').length,
      })
    }
    carregarEstatisticas()
  }, [autenticado, condominios])

  async function aprovar(id: string) {
    if (!confirm('Aprovar este condomínio?')) return
    setProcessando(id)
    const { error } = await supabase
      .from('condominios_guardasol')
      .update({ status: 'ativo', aprovado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) alert('Erro: ' + error.message)
    await carregar()
    setProcessando(null)
  }

  function abrirEdicao(c: Condominio) {
    setEditando(c)
    setFormEdit({
      nome: c.nome || '',
      endereco: c.endereco || '',
      sindico_nome: c.sindico_nome || '',
      sindico_contato: c.sindico_contato || '',
      sindico_email: c.sindico_email || '',
    })
  }

  async function salvarEdicao() {
    if (!editando) return
    setProcessando(editando.id)
    const { error } = await supabase
      .from('condominios_guardasol')
      .update(formEdit)
      .eq('id', editando.id)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setEditando(null)
      await carregar()
    }
    setProcessando(null)
  }

  function exportarCSV() {
    const filtrados = condominios.filter(c => {
      if (!busca.trim()) return true
      const termo = busca.toLowerCase()
      return (c.nome?.toLowerCase().includes(termo) || c.sindico_nome?.toLowerCase().includes(termo) || c.sindico_email?.toLowerCase().includes(termo))
    })

    const cabecalho = ['Condomínio', 'Localização', 'Status', 'Síndico', 'Telefone', 'Email', 'Endereço', 'Cadastrado em', 'Aprovado em']
    const linhas = filtrados.map(c => [
      c.nome || '',
      c.localizacoes?.nome || '',
      c.status === 'ativo' ? 'Ativo' : c.status === 'aguardando_aprovacao' ? 'Aguardando' : 'Pendente',
      c.sindico_nome || '',
      c.sindico_contato || '',
      c.sindico_email || '',
      c.endereco || '',
      c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '',
      c.aprovado_em ? new Date(c.aprovado_em).toLocaleDateString('pt-BR') : '',
    ])

    const csv = [cabecalho, ...linhas]
      .map(linha => linha.map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `guardasol-condominios-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function alterarStatus(id: string, novoStatus: string) {
    setProcessando(id)
    const update: { status: string; aprovado_em?: string | null } = { status: novoStatus }
    if (novoStatus === 'ativo') update.aprovado_em = new Date().toISOString()
    if (novoStatus === 'pendente') update.aprovado_em = null
    const { error } = await supabase
      .from('condominios_guardasol')
      .update(update)
      .eq('id', id)
    if (error) alert('Erro: ' + error.message)
    await carregar()
    setProcessando(null)
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Tem certeza que quer EXCLUIR o condomínio "${nome}"? Esta ação não pode ser desfeita.`)) return
    setProcessando(id)
    const { error } = await supabase
      .from('condominios_guardasol')
      .delete()
      .eq('id', id)
    if (error) alert('Erro: ' + error.message)
    await carregar()
    setProcessando(null)
  }

  // TELA DE LOGIN ADMIN
  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#00210D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 380, width: '100%' }}>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Painel Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>Guarda-Sol na Praia</p>

          <form onSubmit={tentarLogin} style={{ backgroundColor: 'white', padding: 24, borderRadius: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Senha admin *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  value={senhaInput}
                  onChange={e => setSenhaInput(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 80px 10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setVerSenha(!verSenha)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>
                  {verSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {erroLogin && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>
                {erroLogin}
              </div>
            )}

            <button type="submit" style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>
              Entrar
            </button>
          </form>
        </div>
      </main>
    )
  }

  // MODAL DE EDIÇÃO
  if (editando) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#FAF6EE' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>EDITAR CONDOMÍNIO</div>
        </header>

        <section style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
          <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Voltar</button>

          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 20 }}>{editando.nome}</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Nome do condomínio</label>
              <input value={formEdit.nome} onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Endereço</label>
              <input value={formEdit.endereco} onChange={e => setFormEdit({ ...formEdit, endereco: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Nome do síndico</label>
              <input value={formEdit.sindico_nome} onChange={e => setFormEdit({ ...formEdit, sindico_nome: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Telefone</label>
              <input value={formEdit.sindico_contato} onChange={e => setFormEdit({ ...formEdit, sindico_contato: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Email</label>
              <input type="email" value={formEdit.sindico_email} onChange={e => setFormEdit({ ...formEdit, sindico_email: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvarEdicao} disabled={processando === editando.id} style={{ flex: 1, backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {processando === editando.id ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setEditando(null)} style={{ flex: 1, backgroundColor: 'transparent', color: '#00210D', fontWeight: 600, padding: '12px', borderRadius: 999, border: '1px solid #00210D', cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // PAINEL
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF6EE' }}>
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PAINEL ADMIN</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Guarda-Sol na Praia</div>
        </div>
        <button onClick={() => setAutenticado(false)} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ backgroundColor: 'white', border: '1px solid #E8E4DC', padding: '16px 18px', borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#00210D' }}>{estatisticas.total}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Total</div>
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid #E8E4DC', padding: '16px 18px', borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#065F46' }}>{estatisticas.ativos}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Ativos</div>
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid #E8E4DC', padding: '16px 18px', borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#92400E' }}>{estatisticas.aguardando}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Aguardando</div>
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid #E8E4DC', padding: '16px 18px', borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#6B7280' }}>{estatisticas.pendentes}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Pendentes</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #E8E4DC' }}>
          <button onClick={() => setAba('pendentes')} style={{ background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: aba === 'pendentes' ? 700 : 500, color: aba === 'pendentes' ? '#00210D' : '#888', borderBottom: aba === 'pendentes' ? '2px solid #00210D' : '2px solid transparent', marginBottom: -1 }}>
            Aguardando aprovação
          </button>
          <button onClick={() => setAba('todos')} style={{ background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: aba === 'todos' ? 700 : 500, color: aba === 'todos' ? '#00210D' : '#888', borderBottom: aba === 'todos' ? '2px solid #00210D' : '2px solid transparent', marginBottom: -1 }}>
            Todos
          </button>
        </div>

        {carregando && <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Carregando...</div>}

        {aba === 'todos' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por condomínio, síndico ou email..."
              style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, backgroundColor: 'white', boxSizing: 'border-box' }}
            />
            <button onClick={exportarCSV} style={{ padding: '10px 18px', backgroundColor: '#00210D', color: 'white', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Exportar CSV
            </button>
          </div>
        )}

        {!carregando && condominios.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#555' }}>
            {aba === 'pendentes' ? 'Nenhum cadastro aguardando aprovação.' : 'Nenhum condomínio cadastrado.'}
          </div>
        )}

        {!carregando && condominios.filter(c => {
          if (!busca.trim()) return true
          const termo = busca.toLowerCase()
          return (c.nome?.toLowerCase().includes(termo) || c.sindico_nome?.toLowerCase().includes(termo) || c.sindico_email?.toLowerCase().includes(termo))
        }).map(c => (
          <div key={c.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 12, border: '1px solid #E8E4DC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#00210D', margin: 0 }}>{c.nome}</h3>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    backgroundColor: c.status === 'ativo' ? '#D1FAE5' : c.status === 'aguardando_aprovacao' ? '#FEF3C7' : '#F3F4F6',
                    color: c.status === 'ativo' ? '#065F46' : c.status === 'aguardando_aprovacao' ? '#92400E' : '#6B7280',
                  }}>
                    {c.status === 'ativo' ? 'Ativo' : c.status === 'aguardando_aprovacao' ? 'Aguardando' : 'Pendente'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{c.localizacoes?.nome || '—'}</div>

                {c.endereco && <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Endereço:</strong> {c.endereco}</div>}
                {c.sindico_nome && <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Síndico:</strong> {c.sindico_nome}</div>}
                {c.sindico_contato && <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Telefone:</strong> {c.sindico_contato}</div>}
                {c.sindico_email && <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><strong>Email:</strong> {c.sindico_email}</div>}

                <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                  Cadastrado em: {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  {c.aprovado_em && ` · Aprovado em: ${new Date(c.aprovado_em).toLocaleDateString('pt-BR')}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.status === 'aguardando_aprovacao' && (
                  <button onClick={() => aprovar(c.id)} disabled={processando === c.id}
                    style={{ backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                    Aprovar
                  </button>
                )}
                <select
                  value={c.status}
                  onChange={e => { if (confirm(`Alterar status para "${e.target.value}"?`)) alterarStatus(c.id, e.target.value) }}
                  disabled={processando === c.id}
                  style={{ padding: '8px 12px', backgroundColor: 'white', color: '#00210D', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value="pendente">Pendente</option>
                  <option value="aguardando_aprovacao">Aguardando</option>
                  <option value="ativo">Ativo</option>
                </select>
                
                <button onClick={() => abrirEdicao(c)} disabled={processando === c.id}
                  style={{ backgroundColor: 'transparent', color: '#00210D', fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: '1px solid #00210D', cursor: 'pointer', fontSize: 13 }}>
                  Editar
                </button>
                <button onClick={() => excluir(c.id, c.nome)} disabled={processando === c.id}
                  style={{ backgroundColor: 'transparent', color: '#B91C1C', fontWeight: 600, padding: '8px 16px', borderRadius: 8, border: '1px solid #FCA5A5', cursor: 'pointer', fontSize: 13 }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}