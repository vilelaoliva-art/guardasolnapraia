'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Condominio = {
  id: string
  nome: string
  slug: string
  endereco: string | null
  localizacoes?: { nome: string } | null
}

type Reserva = {
  id: string
  data: string
  nome_morador: string
  unidade_id: string
  unidades_guardasol: { numero: string } | null
}

export default function Relatorio() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())

  const [condo, setCondo] = useState<Condominio | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [reservasMesAnterior, setReservasMesAnterior] = useState<Reserva[]>([])
  const [totalUnidades, setTotalUnidades] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  useEffect(() => {
    async function carregar() {
      // Busca o condomínio primeiro
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

      // Verifica sessão
      const auth = sessionStorage.getItem('sindico_auth_' + condoData.id) === 'true'
      if (!auth) {
        window.location.href = '/login'
        return
      }
      setAutorizado(true)
      setCondo(condoData as Condominio)

      // Total de unidades cadastradas
      const { count: unidCount } = await supabase
        .from('unidades_guardasol')
        .select('*', { count: 'exact', head: true })
        .eq('condominio_id', condoData.id)
      setTotalUnidades(unidCount || 0)

      // Reservas do mês selecionado
      const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
      const { data: reservasMes } = await supabase
        .from('reservas_guardasol')
        .select('id, data, nome_morador, unidade_id, unidades_guardasol(numero)')
        .eq('condominio_id', condoData.id)
        .gte('data', primeiroDia)
        .lte('data', ultimoDia)
      setReservas((reservasMes as unknown as Reserva[]) || [])

      // Reservas do mês anterior (pra comparação)
      const mesAnterior = mes === 0 ? 11 : mes - 1
      const anoMesAnterior = mes === 0 ? ano - 1 : ano
      const primDiaAnt = new Date(anoMesAnterior, mesAnterior, 1).toISOString().split('T')[0]
      const ultDiaAnt = new Date(anoMesAnterior, mesAnterior + 1, 0).toISOString().split('T')[0]
      const { data: reservasAnt } = await supabase
        .from('reservas_guardasol')
        .select('id, data')
        .eq('condominio_id', condoData.id)
        .gte('data', primDiaAnt)
        .lte('data', ultDiaAnt)
      setReservasMesAnterior((reservasAnt as Reserva[]) || [])

      setCarregando(false)
    }
    carregar()
  }, [localizacaoSlug, condominioSlug, mes, ano])

  // Cálculos
  const totalReservas = reservas.length
  const totalMesAnterior = reservasMesAnterior.length
  const variacao = totalMesAnterior === 0 ? null : Math.round(((totalReservas - totalMesAnterior) / totalMesAnterior) * 100)

  // Ranking de unidades
  const reservasPorUnidade = reservas.reduce((acc, r) => {
    const num = r.unidades_guardasol?.numero || '—'
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const rankingUnidades = Object.entries(reservasPorUnidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Dias mais procurados
  const reservasPorDia = reservas.reduce((acc, r) => {
    acc[r.data] = (acc[r.data] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const diasMaisProcurados = Object.entries(reservasPorDia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Taxa de adesão
  const unidadesUnicas = new Set(reservas.map(r => r.unidade_id)).size
  const taxaAdesao = totalUnidades > 0 ? Math.round((unidadesUnicas / totalUnidades) * 100) : 0

  function formatarData(dataStr: string) {
    const [a, m, d] = dataStr.split('-').map(Number)
    const data = new Date(a, m - 1, d)
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} (${diasSemana[data.getDay()]})`
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
    <>
      <style jsx global>{`
        @media print {
          .nao-imprimir { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <main style={{ minHeight: '100vh', backgroundColor: '#FAF6EE', padding: '40px 20px' }}>
        {/* Botões e seletor (não imprimem) */}
        <div className="nao-imprimir" style={{ maxWidth: 900, margin: '0 auto 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={() => window.history.back()} style={{ backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ← Voltar
            </button>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, backgroundColor: 'white' }}>
                {nomesMeses.map((nome, i) => <option key={i} value={i}>{nome}</option>)}
              </select>
              <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 14, backgroundColor: 'white' }}>
                {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={() => window.print()} style={{ backgroundColor: '#00210D', color: 'white', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Folha do relatório */}
        <div style={{ maxWidth: 900, margin: '0 auto', backgroundColor: 'white', padding: 40, borderRadius: 12, border: '1px solid #E8E4DC' }}>

          {/* Cabeçalho */}
          <div style={{ borderBottom: '2px solid #00210D', paddingBottom: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>GUARDA-SOL NA PRAIA · RELATÓRIO DO SÍNDICO</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 4 }}>{condo.nome}</h1>
            <p style={{ fontSize: 13, color: '#555' }}>{condo.endereco} · {condo.localizacoes?.nome}</p>
            <p style={{ fontSize: 14, color: '#00210D', fontWeight: 600, marginTop: 12 }}>
              Período: {nomesMeses[mes]} de {ano}
            </p>
          </div>

          {/* Resumo */}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>Resumo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            <div style={{ backgroundColor: '#FAF6EE', padding: 18, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D' }}>{totalReservas}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Reservas no mês</div>
              {variacao !== null && (
                <div style={{ fontSize: 11, color: variacao >= 0 ? '#065F46' : '#B91C1C', marginTop: 4, fontWeight: 600 }}>
                  {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao)}% vs mês anterior
                </div>
              )}
            </div>
            <div style={{ backgroundColor: '#FAF6EE', padding: 18, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D' }}>{unidadesUnicas}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Unidades ativas</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>de {totalUnidades} cadastradas</div>
            </div>
            <div style={{ backgroundColor: '#FAF6EE', padding: 18, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D' }}>{taxaAdesao}%</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Taxa de adesão</div>
            </div>
          </div>

          {/* Ranking de unidades */}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>
            Unidades que mais usaram
          </h2>
          {rankingUnidades.length === 0 ? (
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Nenhuma reserva neste mês.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E4DC' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Apto</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {rankingUnidades.map(([apto, total], i) => (
                  <tr key={apto} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '10px 8px', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '10px 8px', color: '#00210D', fontWeight: 600 }}>{apto}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#00210D', fontWeight: 600 }}>{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Dias mais procurados */}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>
            Dias mais procurados
          </h2>
          {diasMaisProcurados.length === 0 ? (
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Nenhuma reserva neste mês.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E4DC' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Data</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Kits</th>
                </tr>
              </thead>
              <tbody>
                {diasMaisProcurados.map(([data, total]) => (
                  <tr key={data} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '10px 8px', color: '#00210D' }}>{formatarData(data)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#00210D', fontWeight: 600 }}>{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Rodapé */}
          <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 16, marginTop: 24, fontSize: 11, color: '#888', textAlign: 'center' }}>
            Gerado em {new Date().toLocaleDateString('pt-BR')} · Oferecido por SS Condo · Safe Season
          </div>
        </div>
      </main>
    </>
  )
}