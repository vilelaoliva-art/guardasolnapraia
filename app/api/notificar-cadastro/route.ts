import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      condominio_nome,
      localizacao_nome,
      sindico_nome,
      sindico_contato,
      sindico_email,
      endereco,
    } = body

    const apikey = process.env.CALLMEBOT_APIKEY
    const phone = process.env.CALLMEBOT_PHONE

    if (!apikey || !phone) {
      console.error('CALLMEBOT_APIKEY ou CALLMEBOT_PHONE não configurados')
      return NextResponse.json({ ok: false, error: 'config' }, { status: 500 })
    }

    // Monta a mensagem
    const mensagem = `🌴 *Novo condomínio cadastrado no Guarda-Sol*

*Condomínio:* ${condominio_nome}
*Localização:* ${localizacao_nome}
*Endereço:* ${endereco || '—'}

*Síndico:* ${sindico_nome}
*Contato:* ${sindico_contato}
*Email:* ${sindico_email || '—'}

Acesse o painel admin para aprovar:
https://www.guardasolnapraia.com.br/admin`

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`

    const response = await fetch(url, { method: 'GET' })
    const responseText = await response.text()

    if (!response.ok) {
      console.error('Erro CallMeBot:', responseText)
      return NextResponse.json({ ok: false, error: 'callmebot' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro na notificação:', e)
    return NextResponse.json({ ok: false, error: 'exception' }, { status: 500 })
  }
}