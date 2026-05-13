'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'

type Condominio = {
  id: string
  slug: string
  nome: string
  endereco: string
  horario_limite: string
  regras: string | null
  localizacoes?: { nome: string } | null
}

type Unidade = {
  id: string
  numero: string
}

type Reserva = {
  id: string
  data: string
  unidade_id: string
  nome_morador: string
  unidades_guardasol: { numero: string } | null
}

export default function ReservaMorador() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const [condo, setCondo] = useState<Condominio | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Estado da tela 1 (entrada)
  const [autenticado, setAutenticado] = useState(false)
  const [aptoSelecionado, setAptoSelecionado] = useState('')
  const [nomeMorador, setNomeMorador] = useState('')
  const [unidadeAtual, setUnidadeAtual] = useState<Unidade | null>(null)

  // Estado da tela 2 (calendário)
  const [mesAtual] = useState(() => {
    const hoje = new Date()
    const mes = hoje.getMonth() === 11 ? 0 : hoje.getMonth() + 1
    const ano = hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear()
    return { ano, mes }
  })
  const [reservasMes, setReservasMes] = useState<Reserva[]>([])
  const [processando, setProcessando] = useState<string | null>(null)
  const [finalizado, setFinalizado] = useState(false)

  // Carrega condomínio e unidades
  useEffect(() => {
    async function carregar() {
      const { data: localizacao } = await supabase
        .from('localizacoes')
        .select('id')
        .eq('slug', localizacaoSlug)
        .single()

      if (!localizacao) {
        setErro('Condomínio não encontrado.')
        setCarregando(false)
        return
      }

      const { data: condoData } = await supabase
        .from('condominios_guardasol')
        .select('*, localizacoes(nome)')
        .eq('slug', condominioSlug)
        .eq('localizacao_id', localizacao.id)
        .single()

      if (!condoData) {
        setErro('Condomínio não encontrado.')
        setCarregando(false)
        return
      }

      setCondo(condoData as Condominio)

      const { data: unidadesData } = await supabase
        .from('unidades_guardasol')
        .select('id, numero')
        .eq('condominio_id', condoData.id)
        .order('numero', { ascending: true })

      setUnidades((unidadesData as Unidade[]) || [])
      setCarregando(false)
    }

    carregar()
  }, [localizacaoSlug, condominioSlug])

  // Carrega reservas do mês quando entra na tela do calendário ou muda mês
  useEffect(() => {
    if (!autenticado || !condo) return
    carregarReservasMes()
  }, [autenticado, mesAtual, condo])

  async function carregarReservasMes() {
    if (!condo) return

    const primeiroDia = new Date(mesAtual.ano, mesAtual.mes, 1).toISOString().split('T')[0]
    const ultimoDia = new Date(mesAtual.ano, mesAtual.mes + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('reservas_guardasol')
      .select('*, unidades_guardasol(numero)')
      .eq('condominio_id', condo.id)
      .gte('data', primeiroDia)
      .lte('data', ultimoDia)

    setReservasMes((data as Reserva[]) || [])
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const unidade = unidades.find(u => u.numero === aptoSelecionado.trim())
    if (!unidade) {
      setErro(`Apto ${aptoSelecionado} não encontrado neste condomínio.`)
      return
    }

    if (!nomeMorador.trim()) {
      setErro('Informe seu nome.')
      return
    }

    setUnidadeAtual(unidade)
    setAutenticado(true)
  }

  function sairConta() {
    setAutenticado(false)
    setAptoSelecionado('')
    setNomeMorador('')
    setUnidadeAtual(null)
  }

  // Verifica se passou do horário limite hoje
  function passouHorarioLimite(): boolean {
    if (!condo?.horario_limite) return false
    const agora = new Date()
    const [hora, min] = condo.horario_limite.split(':').map(Number)
    const limite = new Date()
    limite.setHours(hora, min, 0, 0)
    return agora >= limite
  }

  function isDataPassada(dataStr: string): boolean {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const data = new Date(dataStr + 'T00:00:00')
    return data < hoje
  }

  function isHoje(dataStr: string): boolean {
    const hoje = new Date().toISOString().split('T')[0]
    return dataStr === hoje
  }

  function isForaMesProximo(dataStr: string): boolean {
    const hoje = new Date()
    const mesProximo = hoje.getMonth() === 11 ? 0 : hoje.getMonth() + 1
    const anoProximo = hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear()
    const data = new Date(dataStr + 'T00:00:00')
    return !(data.getMonth() === mesProximo && data.getFullYear() === anoProximo)
  }

  function reservaDoDia(dataStr: string): Reserva | null {
    if (!unidadeAtual) return null
    return reservasMes.find(r => r.data === dataStr && r.unidade_id === unidadeAtual.id) || null
  }

  function outrosAptosNoDia(dataStr: string): Reserva[] {
    if (!unidadeAtual) return []
    return reservasMes.filter(r => r.data === dataStr && r.unidade_id !== unidadeAtual.id)
  }

  async function toggleReserva(dataStr: string) {
    if (!condo || !unidadeAtual) return
    if (processando) return

    // Validações
    if (isDataPassada(dataStr)) return
    if (isHoje(dataStr) && passouHorarioLimite()) {
      alert(`Já passou do horário limite (${condo.horario_limite?.slice(0, 5)}). Para hoje não é mais possível solicitar.`)
      return
    }

    setProcessando(dataStr)
    const reservaExistente = reservaDoDia(dataStr)

    if (reservaExistente) {
      // Cancelar
      const { error } = await supabase
        .from('reservas_guardasol')
        .delete()
        .eq('id', reservaExistente.id)

      if (error) {
        alert('Erro ao cancelar: ' + error.message)
      }
    } else {
      // Criar
      const { error } = await supabase
        .from('reservas_guardasol')
        .insert({
          condominio_id: condo.id,
          unidade_id: unidadeAtual.id,
          data: dataStr,
          nome_morador: nomeMorador.trim(),
        })

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          alert('Esta unidade já tem uma reserva para este dia.')
        } else {
          alert('Erro ao reservar: ' + error.message)
        }
      }
    }

    await carregarReservasMes()
    setProcessando(null)
  }

  function mudarMes(delta: number) {
    setMesAtual(prev => {
      const novoMes = prev.mes + delta
      if (novoMes < 0) return { ano: prev.ano - 1, mes: 11 }
      if (novoMes > 11) return { ano: prev.ano + 1, mes: 0 }
      return { ano: prev.ano, mes: novoMes }
    })
  }

  function gerarGrid(): (string | null)[] {
    const primeiroDia = new Date(mesAtual.ano, mesAtual.mes, 1)
    const ultimoDia = new Date(mesAtual.ano, mesAtual.mes + 1, 0)
    const diaSemanaInicio = primeiroDia.getDay() // 0 = domingo

    const grid: (string | null)[] = []
    // Espaços vazios antes do dia 1
    for (let i = 0; i < diaSemanaInicio; i++) {
      grid.push(null)
    }
    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const dataStr = `${mesAtual.ano}-${String(mesAtual.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      grid.push(dataStr)
    }
    return grid
  }

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const nomesDiasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Loading
  if (carregando) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555' }}>Carregando...</div>
      </main>
    )
  }

  // Erro / condomínio não encontrado
  if (erro && !condo) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
          </a>
        </header>
        <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, color: '#00210D', marginBottom: 12 }}>Condomínio não encontrado</h1>
            <p style={{ color: '#555', marginBottom: 20 }}>O link que você acessou não existe ou foi removido.</p>
            <a href="/" style={{ color: '#00210D', textDecoration: 'underline' }}>Voltar para o início</a>
          </div>
        </section>
      </main>
    )
  }

  // TELA 1 — Entrada (apto + nome)
  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
          </a>
        </header>

        <section style={{ flex: 1, padding: '40px 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {condo?.localizacoes?.nome}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#00210D', marginBottom: 6 }}>{condo?.nome}</h1>
            <p style={{ fontSize: 14, color: '#555' }}>
              Reserve seu kit de praia para os dias desejados
            </p>
          </div>

          <div className="card-form">
            <form onSubmit={entrar}>
              <div style={{ marginBottom: 16 }}>
                <label>Número do apto *</label>
                <input
                  value={aptoSelecionado}
                  onChange={e => setAptoSelecionado(e.target.value)}
                  placeholder="Ex: 101"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label>Seu nome *</label>
                <input
                  value={nomeMorador}
                  onChange={e => setNomeMorador(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              {erro && (
                <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}
              >
                Continuar
              </button>
            </form>
          </div>

          {condo?.regras && (
            <div style={{ marginTop: 20, padding: '14px 18px', backgroundColor: '#FAF6EE', borderRadius: 10, fontSize: 13, color: '#555' }}>
              <div style={{ fontWeight: 600, color: '#00210D', marginBottom: 6 }}>📌 Regras do condomínio</div>
              {condo.regras}
            </div>
          )}
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

  // TELA FINALIZADO
  if (finalizado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
          </a>
        </header>
        <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌴</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 12 }}>Obrigado por contribuir!</h1>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{condo?.nome} · Apto {unidadeAtual?.numero}</p>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Suas reservas foram registradas para {nomesMeses[mesAtual.mes]}.</p>
            <button
              onClick={() => setFinalizado(false)}
              style={{ backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', fontWeight: 600, padding: '12px 32px', borderRadius: 999, cursor: 'pointer', fontSize: 14 }}
            >
              Voltar e editar
            </button>
          </div>
        </section>
        <footer style={{ backgroundColor: '#00210D', padding: '24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Guarda-Sol na Praia · {new Date().getFullYear()}</div>
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

  // TELA 2 — Calendário
  const grid = gerarGrid()
  const totalReservasMorador = reservasMes.filter(r => r.unidade_id === unidadeAtual?.id).length

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
        </a>
        <button
          onClick={sairConta}
          style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}
        >
          Sair
        </button>
      </header>

      <section style={{ flex: 1, padding: '32px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
            {condo?.nome} · Apto {unidadeAtual?.numero}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#00210D' }}>
            Olá, {nomeMorador.split(' ')[0]}! 🌴
          </h1>
          <p style={{ fontSize: 14, color: '#555', marginTop: 6 }}>
            Marque os dias que você quer kit de praia montado.
          </p>
        </div>

        {/* Resumo */}
        <div className="card-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#555' }}>Suas reservas neste mês</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#00210D', lineHeight: 1.2, marginTop: 2 }}>
              {totalReservasMorador}
            </div>
          </div>
          {condo?.horario_limite && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Horário limite</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#00210D', marginTop: 2 }}>
                {condo.horario_limite.slice(0, 5)}
              </div>
            </div>
          )}
        </div>

        {/* Navegação do mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button
            onClick={() => mudarMes(-1)}
            style={{ backgroundColor: 'transparent', border: '1px solid #E8E4DC', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#00210D', fontSize: 14 }}
          >
            ← Anterior
          </button>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#00210D' }}>
            {nomesMeses[mesAtual.mes]} {mesAtual.ano}
          </div>
          <button
            onClick={() => mudarMes(1)}
            style={{ backgroundColor: 'transparent', border: '1px solid #E8E4DC', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#00210D', fontSize: 14 }}
          >
            Próximo →
          </button>
        </div>

        {/* Calendário */}
        <div className="card-form" style={{ padding: 16 }}>
          {/* Cabeçalho dos dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {nomesDiasSemana.map(dia => (
              <div key={dia} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '6px 0', textTransform: 'uppercase' }}>
                {dia}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {grid.map((dataStr, idx) => {
              if (!dataStr) return <div key={`empty-${idx}`} />

              const dia = parseInt(dataStr.split('-')[2])
              const eHoje = isHoje(dataStr)
              const passada = isDataPassada(dataStr)
              const minhaReserva = reservaDoDia(dataStr)
              const outras = outrosAptosNoDia(dataStr)
              const bloqueadoHoje = eHoje && passouHorarioLimite()
              const foraMesProximo = isForaMesProximo(dataStr)
              const desabilitado = passada || bloqueadoHoje || foraMesProximo

              let bgColor = 'white'
              let color = '#00210D'
              let borderColor = '#E8E4DC'

              if (minhaReserva) {
                bgColor = '#00210D'
                color = 'white'
                borderColor = '#00210D'
              } else if (desabilitado) {
                bgColor = '#F5F5F5'
                color = '#BBB'
                borderColor = '#EEE'
              }

              return (
                <button
                  key={dataStr}
                  onClick={() => toggleReserva(dataStr)}
                  disabled={desabilitado || processando === dataStr}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: bgColor,
                    color: color,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    cursor: desabilitado ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: minhaReserva ? 600 : 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: 4,
                    transition: 'all 0.15s',
                  }}
                  title={
                    minhaReserva
                      ? 'Sua reserva (clique para cancelar)'
                      : outras.length > 0
                      ? `${outras.length} outro(s) apto(s) já reservaram`
                      : passada
                      ? 'Data passada'
                      : bloqueadoHoje
                      ? `Passou do horário limite (${condo?.horario_limite?.slice(0, 5)})`
                      : 'Clique para reservar'
                  }
                >
                  <div style={{ fontSize: eHoje ? 15 : 14, fontWeight: eHoje ? 700 : (minhaReserva ? 600 : 400) }}>
                    {dia}
                  </div>
                  {outras.length > 0 && !minhaReserva && (
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
                      {outras.length} {outras.length === 1 ? 'apto' : 'aptos'}
                    </div>
                  )}
                  {minhaReserva && (
                    <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>✓</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legenda */}
        <div style={{ marginTop: 16, padding: '14px 18px', backgroundColor: '#FAF6EE', borderRadius: 10, fontSize: 12, color: '#555' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, backgroundColor: '#00210D', borderRadius: 4 }} />
              <span>Sua reserva</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, backgroundColor: 'white', border: '1px solid #E8E4DC', borderRadius: 4 }} />
              <span>Disponível</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, backgroundColor: '#F5F5F5', border: '1px solid #EEE', borderRadius: 4 }} />
              <span>Indisponível</span>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
            Clique em qualquer dia disponível para reservar ou cancelar.
          </div>
        </div>

        {/* Botão Finalizar */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => setFinalizado(true)}
            style={{ backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '14px 40px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15 }}
          >
            Finalizar
          </button>
        </div>

      </section>

      <footer style={{ backgroundColor: '#00210D', padding: '24px', marginTop: 32 }}>
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
