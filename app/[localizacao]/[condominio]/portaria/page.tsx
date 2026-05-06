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
      .eq('senha_portaria', senha)
      .single()

    if (error || !data) {
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

  // Quando a data muda, recarrega reservas
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
      // Importa jsPDF e registra a fonte Roboto
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

      // Cabeçalho
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

      // Título da seção
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

      // Data e total
      doc.setFontSize(12)
      doc.setFont('Roboto-Regular', 'bold')
      doc.setTextColor(...corVerde)
      doc.text(`Data: ${formatarData(dataSelecionada)}`, ML, y)
      doc.text(`Total de kits: ${reservas.length}`, W - MR, y, { align: 'right' })
      y += 8

      // Linha divisória
      doc.setDrawColor(...corDourado)
      doc.setLineWidth(0.4)
      doc.line(ML, y, W - MR, y)
      y += 8

      // Cabeçalho da tabela
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

      // Lista de reservas
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

      // Rodapé
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
      <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C0AB60' }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Painel da portaria</div>
          </div>
          <div className="card">
            <form onSubmit={autenticar}>
              <div style={{ marginBottom: 16 }}>
                <label>Senha da portaria</label>
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

  // Tela principal
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', padding: '32px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Painel da portaria</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C0AB60' }}>{condo?.nome}</h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {condo?.localizacoes?.nome}
          </div>
        </div>

        {/* Seletor de data + total */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label>Data</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', backgroundColor: 'rgba(192,171,96,0.15)', borderRadius: 8, minWidth: 100 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#C0AB60', lineHeight: 1 }}>{reservas.length}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>kits hoje</div>
            </div>
          </div>
        </div>

        {/* Botão PDF */}
        <button
          onClick={gerarPdf}
          disabled={gerandoPdf || reservas.length === 0}
          className="btn-dourado"
          style={{ width: '100%', marginBottom: 16, opacity: reservas.length === 0 ? 0.5 : 1 }}
        >
          {gerandoPdf ? 'Gerando PDF...' : '📄 Gerar PDF da lista'}
        </button>

        {/* Lista de reservas */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#C0AB60', marginBottom: 16 }}>
            Reservas para {formatarData(dataSelecionada)}
          </h2>
          {reservas.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '24px 0' }}>
              Nenhuma reserva para esta data.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reservas.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(192,171,96,0.1)' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Apto {r.unidades_guardasol?.numero}</div>
                    {r.nome_morador && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{r.nome_morador}</div>
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