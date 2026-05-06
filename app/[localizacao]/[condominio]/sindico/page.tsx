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

    // Busca o condomínio pelo slug + localização
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

    // Verifica se tem reservas associadas
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

  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C0AB60' }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Painel do síndico</div>
          </div>
          <div className="card">
            <form onSubmit={autenticar}>
              <div style={{ marginBottom: 16 }}>
                <label>Senha do síndico</label>
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
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Painel do síndico</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C0AB60' }}>{condo?.nome}</h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {condo?.endereco} · {condo?.localizacoes?.nome}
          </div>
        </div>

        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#C0AB60' }}>{reservasHoje.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Reservas hoje</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#C0AB60' }}>{totalUnidades}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Unidades cadastradas</div>
          </div>
        </div>

        {/* Links */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Links de acesso</h2>

          <div style={{ marginBottom: 16 }}>
            <label>Link dos proprietários</label>
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

        {/* Configurações */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Configurações</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Horário limite</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo?.horario_limite?.slice(0, 5)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Síndico responsável</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo?.sindico_nome}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Contato</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{condo?.sindico_contato}</span>
            </div>
            {condo?.regras && (
              <div style={{ fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Regras</span>
                <span style={{ color: 'white' }}>{condo.regras}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unidades cadastradas */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>Unidades cadastradas</h2>

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
              className="btn-dourado"
              style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}
              disabled={loadingUnidade || !novaUnidade.trim()}
            >
              {loadingUnidade ? '...' : '+ Adicionar'}
            </button>
          </form>

          {unidades.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unidades.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(192,171,96,0.1)' }}>
                  <span style={{ fontSize: 15 }}>Apto {u.numero}</span>
                  <button
                    onClick={() => removerUnidade(u.id, u.numero)}
                    style={{ backgroundColor: 'transparent', color: 'rgba(255,144,144,0.8)', border: '1px solid rgba(255,144,144,0.3)', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
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
              {reservasHoje.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(192,171,96,0.1)' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>Apto {r.unidades_guardasol?.numero}</div>
                    {r.nome_morador && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{r.nome_morador}</div>
                    )}
                  </div>
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