'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../../lib/supabase'

type Condominio = {
  id: string
  nome: string
  slug: string
  localizacoes?: { nome: string; slug: string } | null
}

export default function QRCodePage() {
  const params = useParams()
  const localizacaoSlug = params.localizacao as string
  const condominioSlug = params.condominio as string

  const [condo, setCondo] = useState<Condominio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [urlMorador, setUrlMorador] = useState('')
  const [senhaMorador, setSenhaMorador] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: localizacao } = await supabase
        .from('localizacoes')
        .select('id')
        .eq('slug', localizacaoSlug)
        .single()

      if (!localizacao) {
        setCarregando(false)
        return
      }

      const { data } = await supabase
        .from('condominios_guardasol')
        .select('id, nome, slug, localizacoes(nome, slug)')
        .eq('slug', condominioSlug)
        .eq('localizacao_id', localizacao.id)
        .single()

      if (data) {
        setCondo(data as unknown as Condominio)
        if (typeof window !== 'undefined') {
          setUrlMorador(`${window.location.origin}/${localizacaoSlug}/${condominioSlug}`)
        }

        // Busca a senha do morador via RPC dedicada (só síndicos autenticados verão)
        const autorizado = sessionStorage.getItem('sindico_auth_' + data.id) === 'true'
        if (autorizado) {
          const { data: senhaData } = await supabase.rpc('obter_senha_morador_sindico', {
            p_condominio_id: data.id,
          })
          if (senhaData) setSenhaMorador(senhaData as string)
        }
      }
      setCarregando(false)
    }
    carregar()
  }, [localizacaoSlug, condominioSlug])

  if (carregando) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <div style={{ color: '#555' }}>Carregando...</div>
      </main>
    )
  }

  if (!condo) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <div style={{ color: '#555' }}>Condomínio não encontrado.</div>
      </main>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .nao-imprimir { display: none !important; }
          body { background: white !important; }
          @page { margin: 1cm; }
        }
      `}</style>

      <main style={{ minHeight: '100vh', backgroundColor: '#FAF6EE', padding: '40px 24px' }}>
        <div className="nao-imprimir" style={{ maxWidth: 600, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => window.history.back()} style={{ backgroundColor: 'transparent', color: '#00210D', border: '1px solid #00210D', borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ← Voltar
          </button>
          <button onClick={() => window.print()} style={{ backgroundColor: '#00210D', color: 'white', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Imprimir
          </button>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', backgroundColor: 'white', padding: 40, borderRadius: 12, textAlign: 'center', border: '1px solid #E8E4DC' }}>

          <div style={{ marginBottom: 8, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            GUARDA-SOL NA PRAIA
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#00210D', marginTop: 16, marginBottom: 6 }}>
            {condo.nome}
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 30 }}>
            {condo.localizacoes?.nome}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ padding: 20, backgroundColor: 'white', border: '2px solid #00210D', borderRadius: 12 }}>
              {urlMorador && <QRCodeSVG value={urlMorador} size={240} level="M" />}
            </div>
          </div>

          {senhaMorador && (
            <div style={{ backgroundColor: '#FAF6EE', border: '2px dashed #C0AB60', borderRadius: 10, padding: '14px 20px', marginBottom: 24, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{ fontSize: 11, color: '#8a7a44', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
                🔒 Senha de acesso
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#00210D', letterSpacing: 1 }}>
                {senhaMorador}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#00210D', marginBottom: 14, letterSpacing: -0.5 }}>
            Reserve seu kit de praia
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>
            Aponte a câmera do celular para o código acima e marque os dias em que você quer guarda-sol na praia.
          </p>

          <div style={{ backgroundColor: '#FAF6EE', borderRadius: 8, padding: '12px 18px', marginBottom: 24, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ fontSize: 13, color: '#00210D', lineHeight: 1.5, margin: 0 }}>
              💡 <strong>Dica:</strong> tente sempre reservar com 1 dia de antecedência.
            </p>
          </div>

          <p style={{ fontSize: 14, color: '#00210D', fontWeight: 600, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Mais organização e eficiência no condomínio!
          </p>

          <div style={{ borderTop: '1px solid #E8E4DC', paddingTop: 16, marginTop: 24 }}>
            <p style={{ fontSize: 13, color: '#00210D', fontWeight: 600, marginBottom: 8 }}>Saiba mais: www.guardasolnapraia.com.br</p>
            <p style={{ fontSize: 11, color: '#888', fontStyle: 'italic', wordBreak: 'break-all' }}>
              {urlMorador}
            </p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
              Oferecido por SS Condo · Safe Season
            </p>
          </div>
        </div>
      </main>
    </>
  )
}