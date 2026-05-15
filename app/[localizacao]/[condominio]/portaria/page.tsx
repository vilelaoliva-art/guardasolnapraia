'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

type Condominio = {
  id: string
  slug: string
  nome: string
  endereco: string
  senha_portaria: string
  localizacoes?: { nome: string } | null
}

type Reserva = {
  id: string
  data: string
  nome_morador: string
  criado_em: string
  unidades_guardasol: { numero: string } | null
}

export default function PainelPortaria() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [condo, setCondo] = useState<Condominio | null>(null)
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

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
      .select('*, localizacoes(nome)')
      .eq('slug', condominioSlug)
      .eq('localizacao_id', localizacao.id)
      .single()

    if (error || !data) {
      setErro('Condomínio não encontrado.')
      setLoading(false)
      return
    }

    // Verifica senha via RPC (não expõe a senha)
    const { data: senhaOk, error: erroRpc } = await supabase.rpc('verificar_senha_portaria', {
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
    setLoading(false)
    carregarReservas(data.id, dataSelecionada)
  }

  async function carregarReservas(condoId: string, data: string) {
    const { data: reservasData } = await supabase
      .from('reservas_guardasol')
      .select('*, unidades_guardasol(numero)')
      .eq('condominio_id', condoId)
      .eq('data', data)
      .order('unidades_guardasol(numero)', { ascending: true })

    setReservas((reservasData as Reserva[]) || [])
  }

  useEffect(() => {
    if (condo?.id) {
      carregarReservas(condo.id, dataSelecionada)
    }
  }, [dataSelecionada, condo?.id])

  function formatarData(dataStr: string) {
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  async function gerarPdf() {
    if (!condo) return
    setGerandoPdf(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      await import('../../../lib/fonts/Roboto-Regular-normal')
      await import('../../../lib/fonts/Roboto-Regular-bold')

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const W = 210, ML = 14, MR = 14, CW = W - ML - MR
      let y = 0

      const corVerde: [number, number, number] = [0, 33, 13]
      const corDourado: [number, number, number] = [192, 171, 96]
      const corCinza: [number, number, number] = [120, 120, 120]
      const corTexto: [number, number, number] = [30, 30, 30]
      const corDivisor: [number, number, number] = [224, 224, 224]

      doc.setFillColor(...corVerde)
      doc.rect(0, 0, W, 38, 'F')
      doc.setFontSize(18)
      doc.setTextColor(...corDourado)
      doc.setFont('Roboto-Regular', 'bold')
      doc.text('GUARDA-SOL NA PRAIA', ML, 16)
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont('Roboto-Regular', 'normal')
      doc.text('Lista do dia — Portaria', ML, 24)
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 180)
      const dataGeracao = new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      doc.text(`Gerado em ${dataGeracao}`, W - MR, 24, { align: 'right' })

      y = 50

      doc.setFontSize(14)
      doc.setFont('Roboto-Regular', 'bold')
      doc.setTextColor(...corTexto)
      doc.text(condo.nome, ML, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('Roboto-Regular', 'normal')
      doc.setTextColor(...corCinza)
      doc.text(`${condo.endereco} · ${condo.localizacoes?.nome || ''}`, ML, y)
      y += 8

      doc.setFontSize(12)
      doc.setFont('Roboto-Regular', 'bold')
      doc.setTextColor(...corVerde)
      doc.text(`Data: ${formatarData(dataSelecionada)}`, ML, y)
      doc.text(`Total de kits: ${reservas.length}`, W - MR, y, { align: 'right' })
      y += 8

      doc.setDrawColor(...corDourado)
      doc.setLineWidth(0.4)
      doc.line(ML, y, W - MR, y)
      y += 8

      doc.setFontSize(9)
      doc.setFont('Roboto-Regular', 'bold')
      doc.setTextColor(...corCinza)
      doc.text('APTO', ML + 2, y)
      doc.text('MORADOR', ML + 30, y)
      doc.text('CONFIRMAÇÃO', W - MR - 2, y, { align: 'right' })
      y += 4
      doc.setDrawColor(...corDivisor)
      doc.setLineWidth(0.3)
      doc.line(ML, y, W - MR, y)
      y += 5

      if (reservas.length === 0) {
        doc.setFont('Roboto-Regular', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...corCinza)
        doc.text('Nenhuma reserva para esta data.', ML, y + 4)
      } else {
        doc.setFont('Roboto-Regular', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...corTexto)
        reservas.forEach((r, i) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          doc.text(r.unidades_guardasol?.numero || '—', ML + 2, y)
          doc.text(r.nome_morador || '—', ML + 30, y)
          doc.text('☐', W - MR - 2, y, { align: 'right' })
          y += 6
          if (i < reservas.length - 1) {
            doc.setDrawColor(...corDivisor)
            doc.line(ML, y - 2, W - MR, y - 2)
          }
        })
      }

      const totalPaginas = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p)
        doc.setDrawColor(...corDivisor)
        doc.setLineWidth(0.3)
        doc.line(ML, 285, W - MR, 285)
        doc.setFontSize(7)
        doc.setFont('Roboto-Regular', 'normal')
        doc.setTextColor(...corCinza)
        doc.text('Guarda-Sol na Praia · powered by SS Condo · Safe Season', ML, 291)
        doc.text(`Página ${p} de ${totalPaginas}`, W - MR, 291, { align: 'right' })
      }

      doc.save(`lista-${condominioSlug}-${dataSelecionada}.pdf`)
    } catch (e) {
      console.error('Erro ao gerar PDF:', e)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  // Tela de login
  if (!autenticado) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
              GUARDA-SOL NA PRAIA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              by SS Condo
            </div>
          </a>
        </header>

        <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 6 }}>Painel da portaria</h1>
              <p style={{ fontSize: 14, color: '#555' }}>Entre com a senha da portaria</p>
            </div>
            <div className="card-form">
              <form onSubmit={autenticar}>
                <div style={{ marginBottom: 16 }}>
                  <label>Senha da portaria</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite a senha" required autoFocus />
                </div>
                {erro && (
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>
                    {erro}
                  </div>
                )}
                <button
                  type="submit"
                  style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
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

  // Tela principal
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>

      <header style={{ backgroundColor: '#00210D', padding: '18px 24px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            GUARDA-SOL NA PRAIA
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
            by SS Condo
          </div>
        </a>
      </header>

      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Painel da portaria
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#00210D' }}>{condo?.nome}</h1>
          <div style={{ fontSize: 14, color: '#555', marginTop: 6 }}>
            {condo?.localizacoes?.nome}
          </div>
        </div>

        {/* Seletor de data + total */}
        <div className="card-form">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label>Data</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ textAlign: 'center', padding: '14px 24px', backgroundColor: '#FAF6EE', borderRadius: 8, minWidth: 110 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00210D', lineHeight: 1 }}>{reservas.length}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>kits hoje</div>
            </div>
          </div>
        </div>

        {/* Botão PDF */}
        <button
          onClick={gerarPdf}
          disabled={gerandoPdf || reservas.length === 0}
          style={{
            width: '100%',
            backgroundColor: '#00210D',
            color: 'white',
            fontWeight: 600,
            padding: '14px',
            borderRadius: 999,
            border: 'none',
            cursor: reservas.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 15,
            marginBottom: 16,
            opacity: reservas.length === 0 ? 0.4 : 1,
          }}
        >
          {gerandoPdf ? 'Gerando PDF...' : '📄 Gerar PDF da lista'}
        </button>

        {/* Lista de reservas */}
        <div className="card-form" style={{ marginBottom: 32 }}>
          <h2>Reservas para {formatarData(dataSelecionada)}</h2>
          {reservas.length === 0 ? (
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '24px 0' }}>
              Nenhuma reserva para esta data.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reservas.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #E8E4DC' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#00210D' }}>Apto {r.unidades_guardasol?.numero}</div>
                    {r.nome_morador && (
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{r.nome_morador}</div>
                    )}
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