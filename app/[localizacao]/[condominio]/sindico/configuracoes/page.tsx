'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Condominio = {
  id: string
  nome: string
  slug: string
  endereco: string | null
  horario_limite: string | null
  regras: string | null
  sindico_nome: string | null
  sindico_contato: string | null
  sindico_email: string | null
  senha_sindico: string | null
  senha_portaria: string | null
  localizacoes?: { nome: string } | null
}

type Unidade = { id: string; numero: string }

export default function Configuracoes() {
  const params = useParams()
  const router = useRouter()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const [condo, setCondo] = useState<Condominio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  // Form de dados gerais
  const [form, setForm] = useState({
    sindico_nome: '',
    sindico_contato: '',
    sindico_email: '',
    endereco: '',
    horario_limite: '',
    regras: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // Form de troca de senha do síndico
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenhaSindico, setNovaSenhaSindico] = useState('')
  const [verSenhaAtual, setVerSenhaAtual] = useState(false)
  const [verNovaSenhaSindico, setVerNovaSenhaSindico] = useState(false)
  const [salvandoSenhaSindico, setSalvandoSenhaSindico] = useState(false)
  const [msgSenhaSindico, setMsgSenhaSindico] = useState('')

  // Form de troca de senha da portaria
  const [novaSenhaPortaria, setNovaSenhaPortaria] = useState('')
  const [verNovaSenhaPortaria, setVerNovaSenhaPortaria] = useState(false)
  const [salvandoSenhaPortaria, setSalvandoSenhaPortaria] = useState(false)
  const [msgSenhaPortaria, setMsgSenhaPortaria] = useState('')

  // Unidades
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [novaUnidade, setNovaUnidade] = useState('')
  const [salvandoUnidade, setSalvandoUnidade] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: localizacao } = await supabase
        .from('localizacoes')
        .select('id')
        .eq('slug', localizacaoSlug)
        .single()
      if (!localizacao) { setCarregando(false); return }

      const { data: condoData } = await supabase
        .from('condominios_guardasol')
        .select('*, localizacoes(nome)')
        .eq('slug', condominioSlug)
        .eq('localizacao_id', localizacao.id)
        .single()
      if (!condoData) { setCarregando(false); return }

      const auth = sessionStorage.getItem('sindico_auth_' + condoData.id) === 'true'
      if (!auth) {
        window.location.href = '/login'
        return
      }
      setAutorizado(true)
      setCondo(condoData as Condominio)
      setForm({
        sindico_nome: condoData.sindico_nome || '',
        sindico_contato: condoData.sindico_contato || '',
        sindico_email: condoData.sindico_email || '',
        endereco: condoData.endereco || '',
        horario_limite: condoData.horario_limite ? condoData.horario_limite.slice(0, 5) : '',
        regras: condoData.regras || '',
      })

      const { data: unidadesData } = await supabase
        .from('unidades_guardasol')
        .select('id, numero')
        .eq('condominio_id', condoData.id)
        .order('numero')
      setUnidades((unidadesData as Unidade[]) || [])

      setCarregando(false)
    }
    carregar()
  }, [localizacaoSlug, condominioSlug])

  async function salvarDados(e: React.FormEvent) {
    e.preventDefault()
    if (!condo) return
    setSalvando(true)
    setMensagem('')
    const { error } = await supabase
      .from('condominios_guardasol')
      .update(form)
      .eq('id', condo.id)
    if (error) {
      setMensagem('Erro ao salvar: ' + error.message)
    } else {
      setMensagem('Dados atualizados com sucesso!')
      setTimeout(() => setMensagem(''), 3000)
    }
    setSalvando(false)
  }

  async function trocarSenhaSindico(e: React.FormEvent) {
    e.preventDefault()
    if (!condo) return
    setMsgSenhaSindico('')
    if (senhaAtual !== condo.senha_sindico) {
      setMsgSenhaSindico('Senha atual incorreta.')
      return
    }
    if (novaSenhaSindico.length < 4) {
      setMsgSenhaSindico('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }
    setSalvandoSenhaSindico(true)
    const { error } = await supabase
      .from('condominios_guardasol')
      .update({ senha_sindico: novaSenhaSindico })
      .eq('id', condo.id)
    if (error) {
      setMsgSenhaSindico('Erro: ' + error.message)
    } else {
      setMsgSenhaSindico('Senha do síndico atualizada!')
      setSenhaAtual('')
      setNovaSenhaSindico('')
      setCondo({ ...condo, senha_sindico: novaSenhaSindico })
      setTimeout(() => setMsgSenhaSindico(''), 3000)
    }
    setSalvandoSenhaSindico(false)
  }

  async function trocarSenhaPortaria(e: React.FormEvent) {
    e.preventDefault()
    if (!condo) return
    setMsgSenhaPortaria('')
    if (novaSenhaPortaria.length < 4) {
      setMsgSenhaPortaria('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }
    setSalvandoSenhaPortaria(true)
    const { error } = await supabase
      .from('condominios_guardasol')
      .update({ senha_portaria: novaSenhaPortaria })
      .eq('id', condo.id)
    if (error) {
      setMsgSenhaPortaria('Erro: ' + error.message)
    } else {
      setMsgSenhaPortaria('Senha da portaria atualizada!')
      setNovaSenhaPortaria('')
      setTimeout(() => setMsgSenhaPortaria(''), 3000)
    }
    setSalvandoSenhaPortaria(false)
  }

  async function adicionarUnidade(e: React.FormEvent) {
    e.preventDefault()
    if (!condo || !novaUnidade.trim()) return
    setSalvandoUnidade(true)
    const { data, error } = await supabase
      .from('unidades_guardasol')
      .insert({ condominio_id: condo.id, numero: novaUnidade.trim() })
      .select()
      .single()
    if (error) {
      alert('Erro ao adicionar: ' + error.message)
    } else if (data) {
      setUnidades([...unidades, data as Unidade].sort((a, b) => a.numero.localeCompare(b.numero, 'pt', { numeric: true })))
      setNovaUnidade('')
    }
    setSalvandoUnidade(false)
  }

  async function removerUnidade(id: string, numero: string) {
    const { count } = await supabase
      .from('reservas_guardasol')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', id)
    if ((count || 0) > 0) {
      alert(`Não é possível remover o apto ${numero} pois tem histórico de reservas.`)
      return
    }
    if (!confirm(`Remover o apto ${numero}?`)) return
    const { error } = await supabase.from('unidades_guardasol').delete().eq('id', id)
    if (error) {
      alert('Erro ao remover: ' + error.message)
    } else {
      setUnidades(unidades.filter(u => u.id !== id))
    }
  }

  if (carregando) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555' }}>Carregando...</div>
      </main>
    )
  }

  if (!autorizado || !condo) return null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
        </a>
        <button onClick={() => router.back()} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>← Voltar</button>
      </header>

      <section style={{ flex: 1, padding: '32px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#00210D', marginBottom: 6 }}>Configurações</h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>{condo.nome}</p>

        {/* Dados do síndico e condomínio */}
        <form onSubmit={salvarDados}>
          <div className="card-form">
            <h2>Dados do síndico</h2>
            <div style={{ marginBottom: 14 }}>
              <label>Nome</label>
              <input value={form.sindico_nome} onChange={e => setForm({ ...form, sindico_nome: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Telefone</label>
              <input value={form.sindico_contato} onChange={e => setForm({ ...form, sindico_contato: e.target.value })} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.sindico_email} onChange={e => setForm({ ...form, sindico_email: e.target.value })} />
            </div>
          </div>

          <div className="card-form">
            <h2>Condomínio</h2>
            <div style={{ marginBottom: 14 }}>
              <label>Nome do condomínio</label>
              <input value={condo.nome} disabled style={{ backgroundColor: '#F5F5F5', cursor: 'not-allowed' }} />
              <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>Só o admin pode alterar o nome do condomínio.</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Endereço</label>
              <input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Horário limite</label>
              <input type="time" value={form.horario_limite} onChange={e => setForm({ ...form, horario_limite: e.target.value })} />
              <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>Proprietário deve solicitar antes desse horário no mesmo dia.</span>
            </div>
            <div>
              <label>Regras (opcional)</label>
              <textarea value={form.regras} onChange={e => setForm({ ...form, regras: e.target.value })} rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {mensagem && (
            <div style={{ backgroundColor: mensagem.includes('Erro') ? '#FEE2E2' : '#D1FAE5', border: `1px solid ${mensagem.includes('Erro') ? '#FCA5A5' : '#6EE7B7'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: mensagem.includes('Erro') ? '#B91C1C' : '#065F46' }}>{mensagem}</div>
          )}

          <button type="submit" disabled={salvando} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 32 }}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>

        {/* Trocar senha do síndico */}
        <form onSubmit={trocarSenhaSindico}>
          <div className="card-form">
            <h2>Trocar senha do síndico</h2>
            <div style={{ marginBottom: 14 }}>
              <label>Senha atual *</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenhaAtual ? 'text' : 'password'} value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required style={{ paddingRight: 80 }} />
                <button type="button" onClick={() => setVerSenhaAtual(!verSenhaAtual)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>{verSenhaAtual ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </div>
            <div>
              <label>Nova senha *</label>
              <div style={{ position: 'relative' }}>
                <input type={verNovaSenhaSindico ? 'text' : 'password'} value={novaSenhaSindico} onChange={e => setNovaSenhaSindico(e.target.value)} required style={{ paddingRight: 80 }} />
                <button type="button" onClick={() => setVerNovaSenhaSindico(!verNovaSenhaSindico)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>{verNovaSenhaSindico ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </div>

            {msgSenhaSindico && (
              <div style={{ backgroundColor: msgSenhaSindico.includes('atualizada') ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${msgSenhaSindico.includes('atualizada') ? '#6EE7B7' : '#FCA5A5'}`, borderRadius: 8, padding: '10px 14px', marginTop: 14, fontSize: 13, color: msgSenhaSindico.includes('atualizada') ? '#065F46' : '#B91C1C' }}>{msgSenhaSindico}</div>
            )}

            <button type="submit" disabled={salvandoSenhaSindico} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, marginTop: 16 }}>
              {salvandoSenhaSindico ? 'Salvando...' : 'Trocar senha do síndico'}
            </button>
          </div>
        </form>

        {/* Trocar senha da portaria */}
        <form onSubmit={trocarSenhaPortaria}>
          <div className="card-form">
            <h2>Trocar senha da portaria</h2>
            <div>
              <label>Nova senha *</label>
              <div style={{ position: 'relative' }}>
                <input type={verNovaSenhaPortaria ? 'text' : 'password'} value={novaSenhaPortaria} onChange={e => setNovaSenhaPortaria(e.target.value)} required style={{ paddingRight: 80 }} />
                <button type="button" onClick={() => setVerNovaSenhaPortaria(!verNovaSenhaPortaria)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#00210D', fontWeight: 600, padding: '4px 8px', textDecoration: 'underline' }}>{verNovaSenhaPortaria ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </div>

            {msgSenhaPortaria && (
              <div style={{ backgroundColor: msgSenhaPortaria.includes('atualizada') ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${msgSenhaPortaria.includes('atualizada') ? '#6EE7B7' : '#FCA5A5'}`, borderRadius: 8, padding: '10px 14px', marginTop: 14, fontSize: 13, color: msgSenhaPortaria.includes('atualizada') ? '#065F46' : '#B91C1C' }}>{msgSenhaPortaria}</div>
            )}

            <button type="submit" disabled={salvandoSenhaPortaria} style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, marginTop: 16 }}>
              {salvandoSenhaPortaria ? 'Salvando...' : 'Trocar senha da portaria'}
            </button>
          </div>
        </form>

        {/* Unidades */}
        <div className="card-form">
          <h2>Unidades cadastradas ({unidades.length})</h2>

          <form onSubmit={adicionarUnidade} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={novaUnidade} onChange={e => setNovaUnidade(e.target.value)} placeholder="Ex: 101, 202B" style={{ flex: 1 }} />
            <button type="submit" disabled={salvandoUnidade || !novaUnidade.trim()} style={{ padding: '10px 20px', backgroundColor: '#00210D', color: 'white', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
              {salvandoUnidade ? '...' : 'Adicionar'}
            </button>
          </form>

          {unidades.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888' }}>Nenhuma unidade cadastrada.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {unidades.map(u => (
                <div key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 12px', backgroundColor: '#FAF6EE', border: '1px solid #E8E4DC', borderRadius: 999, fontSize: 13, color: '#00210D' }}>
                  <span>{u.numero}</span>
                  <button onClick={() => removerUnidade(u.id, u.numero)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 700, fontSize: 14, padding: '0 4px', lineHeight: 1 }} title="Remover">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </main>
  )
}