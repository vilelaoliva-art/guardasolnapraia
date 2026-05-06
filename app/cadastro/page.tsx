'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Cadastro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [unidadesTexto, setUnidadesTexto] = useState('')
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    localizacao_nome: '',
    horario_limite: '05:00',
    regras: '',
    sindico_nome: '',
    sindico_contato: '',
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

    // 1. Verifica se a localização já existe (pelo slug)
    let localizacaoId: string

    const { data: localizacaoExistente } = await supabase
      .from('localizacoes')
      .select('id')
      .eq('slug', localizacaoSlug)
      .maybeSingle()

    if (localizacaoExistente) {
      // Já existe — reaproveita
      localizacaoId = localizacaoExistente.id
    } else {
      // Não existe — cria nova
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

    // 2. Cria o condomínio
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

    // 3. Cria as unidades
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

    // 4. Redireciona pro painel do síndico
    router.push(`/${localizacaoSlug}/${slug}/sindico`)
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white', padding: '32px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <a href="/" style={{ color: '#C0AB60', fontSize: 14, textDecoration: 'none', display: 'block', marginBottom: 24 }}>
          ← Voltar
        </a>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C0AB60', marginBottom: 8 }}>
          Cadastrar condomínio
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          Preencha os dados abaixo para criar o link do seu condomínio.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C0AB60', marginBottom: 20 }}>Dados do condomínio</h2>

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
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: 'block' }}>
                Bairro, praia ou região onde fica o condomínio
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Horário limite para solicitação *</label>
              <input name="horario_limite" type="time" value={form.horario_limite} onChange={handleChange} required />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: 'block' }}>
                Proprietário deve solicitar antes desse horário no mesmo dia
              </span>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label>Regras adicionais (opcional)</label>
              <textarea name="regras" value={form.regras} onChange={handleChange} placeholder="Ex: Guarda-sol entregue até as 8h na faixa de areia em frente ao prédio." rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C0AB60', marginBottom: 20 }}>Unidades</h2>
            <div>
              <label>Números das unidades *</label>
              <textarea
                value={unidadesTexto}
                onChange={e => setUnidadesTexto(e.target.value)}
                placeholder={'101\n102\n201\n202\n301'}
                rows={6}
                style={{ resize: 'vertical', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: 'block' }}>
                Digite um número por linha ou separe por vírgula
              </span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C0AB60', marginBottom: 20 }}>Síndico responsável</h2>

            <div style={{ marginBottom: 16 }}>
              <label>Nome do síndico *</label>
              <input name="sindico_nome" value={form.sindico_nome} onChange={handleChange} placeholder="Nome completo" required />
            </div>

            <div>
              <label>Contato (telefone ou email) *</label>
              <input name="sindico_contato" value={form.sindico_contato} onChange={handleChange} placeholder="(11) 99999-9999" required />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C0AB60', marginBottom: 8 }}>Senhas de acesso</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              Guarde essas senhas com cuidado. Você precisará delas para acessar o painel.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label>Senha do síndico *</label>
              <input name="senha_sindico" type="password" value={form.senha_sindico} onChange={handleChange} placeholder="Senha para o painel do síndico" required />
            </div>

            <div>
              <label>Senha da portaria *</label>
              <input name="senha_portaria" type="password" value={form.senha_portaria} onChange={handleChange} placeholder="Senha para a portaria" required />
            </div>
          </div>

          {erro && (
            <div style={{ backgroundColor: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#ff9090' }}>
              {erro}
            </div>
          )}

          <button type="submit" className="btn-dourado" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar condomínio'}
          </button>

        </form>
      </div>
    </main>
  )
}