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
  unidade_id: string
}

export default function RelatorioPortaria() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())

  const [condo, setCondo] = useState<Condominio | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [autorizado, setAutorizado] = useState(false)

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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
        .select('id, nome, slug, endereco, localizacoes(nome)')
        .eq('slug', condominioSlug)
        .eq('localizacao_id', localizacao.id)
        .single()
      if (!condoData) { setCarregando(false); return }

      // Verifica sessão da portaria
      const auth = sessionStorage.getItem('portaria_auth_' + condoData.id) === 'true'
      if (!auth) {
        window.location.href = '/login'
        return
      }
      setAutorizado(true)
      setCondo(condoData as unknown as Condominio)

      const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
      const { data: reservasMes } = await supabase
        .from('reservas_guardasol')
        .select('id, data, unidade_id')
        .eq('condominio_id', condoData.id)
        .gte('data', primeiroDia)
        .lte('data', ultimoDia)
      setReservas((reservasMes as Reserva[]) || [])

      setCarregando(false)
    }
    carregar()
  }, [localizacaoSlug, condominioSlug, mes, ano])

  const totalReservas = reservas.length

  const reservasPorDia = reservas.reduce((acc, r) => {
    acc[r.data] = (acc[r.data] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const diasMaisProcurados = Object.entries(reservasPorDia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  function gerarGridCalendario() {
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const diaSemanaInicio = primeiroDia.getDay()

    const grid: (string | null)[] = []
    for (let i = 0; i < diaSemanaInicio; i++) grid.push(null)
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      grid.push(dataStr)
    }
    return grid
  }

  const maxKitsNoDia = Math.max(0, ...Object.values(reservasPorDia))

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

        <div style={{ maxWidth: 900, margin: '0 auto', backgroundColor: 'white', padding: 40, borderRadius: 12, border: '1px solid #E8E4DC' }}>
          <div style={{ borderBottom: '2px solid #00210D', paddingBottom: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>GUARDA-SOL NA PRAIA · RELATÓRIO DA PORTARIA</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 4 }}>{condo.nome}</h1>
            <p style={{ fontSize: 13, color: '#555' }}>{condo.endereco} · {condo.localizacoes?.nome}</p>
            <p style={{ fontSize: 14, color: '#00210D', fontWeight: 600, marginTop: 12 }}>
              Período: {nomesMeses[mes]} de {ano}
            </p>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>Total no mês</h2>
          <div style={{ backgroundColor: '#FAF6EE', padding: 24, borderRadius: 10, textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#00210D' }}>{totalReservas}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Kits entregues no mês</div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>Kits por dia</h2>
          {totalReservas === 0 ? (
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>Nenhuma reserva neste mês.</p>
          ) : (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                  <div key={idx} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '4px 0', textTransform: 'uppercase' }}>
                    {dia}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {gerarGridCalendario().map((dataStr, idx) => {
                  if (!dataStr) return <div key={`empty-${idx}`} />

                  const dia = parseInt(dataStr.split('-')[2])
                  const kits = reservasPorDia[dataStr] || 0
                  const intensidade = maxKitsNoDia > 0 ? kits / maxKitsNoDia : 0

                  let bgColor = 'white'
                  let textColor = '#888'
                  if (kits > 0) {
                    if (intensidade < 0.34) { bgColor = '#FAF6EE'; textColor = '#00210D' }
                    else if (intensidade < 0.67) { bgColor = '#C0AB60'; textColor = 'white' }
                    else { bgColor = '#00210D'; textColor = 'white' }
                  }

                  return (
                    <div key={dataStr} style={{ aspectRatio: '1', backgroundColor: bgColor, color: textColor, border: '1px solid #E8E4DC', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{dia}</div>
                      {kits > 0 && (
                        <div style={{ fontSize: 11, marginTop: 2, fontWeight: 600 }}>
                          {kits} {kits === 1 ? 'kit' : 'kits'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11, color: '#888' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, backgroundColor: '#FAF6EE', border: '1px solid #E8E4DC', borderRadius: 3 }} />
                  <span>Pouco</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, backgroundColor: '#C0AB60', borderRadius: 3 }} />
                  <span>Médio</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, backgroundColor: '#00210D', borderRadius: 3 }} />
                  <span>Muito</span>
                </div>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00210D', marginBottom: 14 }}>Dias mais procurados</h2>
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

          <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 16, marginTop: 24, fontSize: 11, color: '#888', textAlign: 'center' }}>
            Gerado em {new Date().toLocaleDateString('pt-BR')} · Oferecido por SS Condo · Safe Season
          </div>
        </div>
      </main>
    </>
  )
}