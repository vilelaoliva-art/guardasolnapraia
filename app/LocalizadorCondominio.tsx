'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

type Localizacao = { id: string; nome: string; slug: string }
type Condominio = { id: string; nome: string; slug: string; status: string }

export default function LocalizadorCondominio() {
  const router = useRouter()

  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])

  const [buscaLoc, setBuscaLoc] = useState('')
  const [locSelecionada, setLocSelecionada] = useState<Localizacao | null>(null)
  const [mostrarSugLoc, setMostrarSugLoc] = useState(false)

  const [buscaCondo, setBuscaCondo] = useState('')
  const [condoSelecionado, setCondoSelecionado] = useState<Condominio | null>(null)
  const [mostrarSugCondo, setMostrarSugCondo] = useState(false)

  const [erro, setErro] = useState('')
  const refLoc = useRef<HTMLDivElement>(null)
  const refCondo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('localizacoes').select('id, nome, slug').order('nome')
      setLocalizacoes((data as Localizacao[]) || [])
    }
    carregar()
  }, [])

  useEffect(() => {
    async function carregar() {
      if (!locSelecionada) { setCondominios([]); return }
      const { data } = await supabase
        .from('condominios_guardasol')
        .select('id, nome, slug, status')
        .eq('localizacao_id', locSelecionada.id)
        .eq('status', 'ativo')
        .order('nome')
      setCondominios((data as Condominio[]) || [])
    }
    carregar()
    setBuscaCondo('')
    setCondoSelecionado(null)
  }, [locSelecionada])

  // Fechar sugestões quando clica fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (refLoc.current && !refLoc.current.contains(e.target as Node)) setMostrarSugLoc(false)
      if (refCondo.current && !refCondo.current.contains(e.target as Node)) setMostrarSugCondo(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function normalizar(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Sugestões: só mostra depois de digitar 1+ caractere
  const sugestoesLoc = buscaLoc.trim().length > 0
    ? localizacoes.filter(l => normalizar(l.nome).includes(normalizar(buscaLoc))).slice(0, 8)
    : []

  const sugestoesCondo = buscaCondo.trim().length > 0
    ? condominios.filter(c => normalizar(c.nome).includes(normalizar(buscaCondo))).slice(0, 8)
    : []

  function acessar() {
    setErro('')
    if (!locSelecionada || !condoSelecionado) {
      setErro('Selecione a localização e o condomínio.')
      return
    }
    router.push(`/${locSelecionada.slug}/${condoSelecionado.slug}`)
  }

  const estiloInput: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #E8E4DC',
    fontSize: 14,
    backgroundColor: 'white',
    color: '#00210D',
    boxSizing: 'border-box',
  }

  const estiloSugestoes: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #E8E4DC',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    maxHeight: 240,
    overflowY: 'auto',
    zIndex: 10,
    textAlign: 'left',
  }

  const estiloItem: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 14,
    color: '#00210D',
    cursor: 'pointer',
    borderBottom: '1px solid #F5F2EC',
  }

  return (
    <section style={{ backgroundColor: 'white', padding: '56px 20px', borderTop: '1px solid #E8E4DC' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, color: '#00210D', marginBottom: 8 }}>
          Seu condomínio já é cadastrado?
        </h2>
        <p style={{ fontSize: 15, color: '#555', marginBottom: 28 }}>
          Localize aqui.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {/* Busca de localização */}
          <div ref={refLoc} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Digite a localização"
              value={buscaLoc}
              onChange={e => {
                setBuscaLoc(e.target.value)
                setLocSelecionada(null)
                setMostrarSugLoc(true)
              }}
              onFocus={() => setMostrarSugLoc(true)}
              style={estiloInput}
            />
            {mostrarSugLoc && sugestoesLoc.length > 0 && (
              <div style={estiloSugestoes}>
                {sugestoesLoc.map(l => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setLocSelecionada(l)
                      setBuscaLoc(l.nome)
                      setMostrarSugLoc(false)
                    }}
                    style={estiloItem}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAF6EE')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    {l.nome}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Busca de condomínio */}
          <div ref={refCondo} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Digite o condomínio"
              value={buscaCondo}
              onChange={e => {
                setBuscaCondo(e.target.value)
                setCondoSelecionado(null)
                setMostrarSugCondo(true)
              }}
              onFocus={() => setMostrarSugCondo(true)}
              disabled={!locSelecionada}
              style={{ ...estiloInput, opacity: locSelecionada ? 1 : 0.5, cursor: locSelecionada ? 'text' : 'not-allowed' }}
            />
            {mostrarSugCondo && sugestoesCondo.length > 0 && (
              <div style={estiloSugestoes}>
                {sugestoesCondo.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCondoSelecionado(c)
                      setBuscaCondo(c.nome)
                      setMostrarSugCondo(false)
                    }}
                    style={estiloItem}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAF6EE')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    {c.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {erro && <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>{erro}</div>}

        <button onClick={acessar} style={{ backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '14px 40px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15 }}>
          Acessar
        </button>
      </div>
    </section>
  )
}