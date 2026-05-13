'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Cadastro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [unidadesTexto, setUnidadesTexto] = useState('')
  const [verSenhaSindico, setVerSenhaSindico] = useState(false)
  const [verSenhaPortaria, setVerSenhaPortaria] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    localizacao_nome: '',
    horario_limite: '05:00',
    regras: '',
    sindico_nome: '',
    sindico_contato: '',
    sindico_email: '',
    senha_sindico: '',
    senha_portaria: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function gerarSlug(nome: string) {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    if (!form.localizacao_nome.trim()) {
      setErro('Informe a localização.')
      setLoading(false)
      return
    }

    const slug = gerarSlug(form.nome)
    const localizacaoSlug = gerarSlug(form.localizacao_nome)

    const unidades = unidadesTexto
      .split(/[\n,;]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (unidades.length === 0) {
      setErro('Informe pelo menos uma unidade.')
      setLoading(false)
      return
    }

    let localizacaoId: string

    const { data: localizacaoExistente } = await supabase
      .from('localizacoes')
      .select('id')
      .eq('slug', localizacaoSlug)
      .maybeSingle()

    if (localizacaoExistente) {
      localizacaoId = localizacaoExistente.id
    } else {
      const { data: novaLocalizacao, error: erroLoc } = await supabase
        .from('localizacoes')
        .insert({
          nome: form.localizacao_nome.trim(),
          slug: localizacaoSlug,
          cidade: form.localizacao_nome.trim(),
          estado: 'SP',
        })
        .select()
        .single()

      if (erroLoc || !novaLocalizacao) {
        setErro('Erro ao salvar localização. ' + (erroLoc?.message || ''))
        setLoading(false)
        return
      }
      localizacaoId = novaLocalizacao.id
    }

    const { localizacao_nome, ...formSemLocalizacao } = form

    const { data: condo, error: erroInsert } = await supabase
      .from('condominios_guardasol')
      .insert({
        ...formSemLocalizacao,
        slug,
        localizacao_id: localizacaoId,
      })
      .select()
      .single()

    if (erroInsert || !condo) {
      setErro(erroInsert?.message || 'Erro ao cadastrar. Tente novamente.')
      setLoading(false)
      return
    }

    const unidadesParaInserir = unidades.map(numero => ({
      condominio_id: condo.id,
      numero,
    }))

    const { error: erroUnidades } = await supabase
      .from('unidades_guardasol')
      .insert(unidadesParaInserir)

    if (erroUnidades) {
      setErro('Condomínio cadastrado mas houve erro ao salvar unidades.')
      setLoading(false)
      return
    }

    router.push(`/${localizacaoSlug}/${slug}/sindico`)
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            GUARDA-SOL NA PRAIA
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
            by SS Condo
          </div>
        </a>
      </header>

      {/* CONTEÚDO */}
      <section style={{ flex: 1, padding: '40px 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>

        <a href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          ← Voltar
        </a>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#00210D', marginBottom: 8 }}>
          Cadastrar condomínio
        </h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
          Preencha os dados abaixo para criar o link do seu condomínio.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="card-form">
            <h2>Dados do condomínio</h2>

            <div style={{ marginBottom: 16 }}>
              <label>Nome do condomínio *</label>
              <input name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Edifício Beira Mar" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Endereço *</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, número" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Localização *</label>
              <input
                name="localizacao_nome"
                value={form.localizacao_nome}
                onChange={handleChange}
                placeholder="Ex: Riviera de São Lourenço, Maresias, Guarujá..."
                required
              />
              <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
                Bairro, praia ou região onde fica o condomínio
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Horário limite para solicitação *</label>
              <input name="horario_limite" type="time" value={form.horario_limite} onChange={handleChange} required />
              <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
                Proprietário deve solicitar antes desse horário no mesmo dia
              </span>
            </div>

            <div>
              <label>Regras adicionais (opcional)</label>
              <textarea name="regras" value={form.regras} onChange={handleChange} placeholder="Ex: Guarda-sol entregue até as 8h na faixa de areia em frente ao prédio." rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div className="card-form">
            <h2>Unidades</h2>
            <div>
              <label>Números das unidades *</label>
              <textarea
                value={unidadesTexto}
                onChange={e => setUnidadesTexto(e.target.value)}
                placeholder={'101\n102\n201\n202\n301'}
                rows={6}
                style={{ resize: 'vertical', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>
                Digite um número por linha ou separe por vírgula
              </span>
            </div>
          </div>

          <div className="card-form">
            <h2>Síndico responsável</h2>

            <div style={{ marginBottom: 16 }}>
              <label>Nome do síndico *</label>
              <input name="sindico_nome" value={form.sindico_nome} onChange={handleChange} placeholder="Nome completo" required />
            </div>

            <div>
              <label>Contato (telefone ou email) *</label>
              <input name="sindico_contato" value={form.sindico_contato} onChange={handleChange} placeholder="(11) 99999-9999" required /><div style={{ marginTop: 16 }}><label>Email do síndico *</label><input name="sindico_email" type="email" value={form.sindico_email} onChange={handleChange} placeholder="seu@email.com" required /></div>
            </div>
          </div>

          <div className="card-form" style={{ marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8 }}>Senhas de acesso</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              Guarde essas senhas com cuidado. Você precisará delas para acessar o painel.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label>Senha do síndico *</label>
              <div style={{ position: "relative" }}><input name="senha_sindico" type={verSenhaSindico ? "text" : "password"} value={form.senha_sindico} onChange={handleChange} placeholder="Senha para o painel do síndico" required style={{ paddingRight: 44 }} /><button type="button" onClick={() => setVerSenhaSindico(!verSenhaSindico)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "#00210D", fontWeight: 600, padding: "4px 8px", textDecoration: "underline" }}>{verSenhaSindico ? "Ocultar" : "Mostrar"}</button></div>
            </div>

            <div>
              <label>Senha da portaria *</label>
              <div style={{ position: "relative" }}><input name="senha_portaria" type={verSenhaPortaria ? "text" : "password"} value={form.senha_portaria} onChange={handleChange} placeholder="Senha para a portaria" required style={{ paddingRight: 44 }} /><button type="button" onClick={() => setVerSenhaPortaria(!verSenhaPortaria)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "#00210D", fontWeight: 600, padding: "4px 8px", textDecoration: "underline" }}>{verSenhaPortaria ? "Ocultar" : "Mostrar"}</button></div>
            </div>
          </div>

          {erro && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#B91C1C' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            style={{ width: '100%', backgroundColor: '#00210D', color: 'white', fontWeight: 600, padding: '14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar condomínio grátis'}
          </button>

          <p style={{ marginTop: 14, fontSize: 13, color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
            Um serviço gratuito oferecido por{' '}
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ color: '#00210D', fontWeight: 600, textDecoration: 'underline' }}>
              www.sscondo.com.br
            </a>
          </p>

        </form>
      </section>

      {/* RODAPÉ */}
      <footer style={{ backgroundColor: '#00210D', padding: '32px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Guarda-Sol na Praia · {new Date().getFullYear()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>
              powered by
            </span>
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/sscondo-logo.jpg" alt="SS Condo" style={{ height: 36, borderRadius: 4 }} />
              <div style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>
                Safe Season
              </div>
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}