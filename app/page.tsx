'use client'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#00210D', color: 'white' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(192,171,96,0.2)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C0AB60', letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>by SS Condo · Safe Season</div>
        </div>
        <a href="/cadastro" style={{ backgroundColor: 'transparent', color: '#C0AB60', border: '1px solid #C0AB60', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Sou sindico
        </a>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '64px 24px 48px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏖️</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#C0AB60', marginBottom: 16, lineHeight: 1.3 }}>
          Organize os guarda-sois<br />do seu condominio
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
          O proprietario reserva os dias pelo celular. A portaria ja sabe antecipadamente quais guarda-sois levar para a praia. Simples assim.
        </p>
        <a href="/cadastro" className="btn-dourado" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Cadastrar meu condominio
        </a>
      </section>

      {/* Como funciona */}
      <section style={{ padding: '48px 24px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, color: '#C0AB60', marginBottom: 32 }}>
          Como funciona
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { num: '1', titulo: 'Sindico cadastra', texto: 'Registra o condominio, as unidades e define o horario limite para solicitacao.' },
            { num: '2', titulo: 'Proprietario reserva', texto: 'Acessa o link ou QR Code e marca os dias que vai usar o guarda-sol.' },
            { num: '3', titulo: 'Portaria ve a lista', texto: 'No dia, a portaria consulta quais unidades solicitaram e leva os guarda-sois.' },
          ].map((item) => (
            <div key={item.num} className="card" style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#C0AB60', color: '#00210D', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {item.num}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#C0AB60' }}>{item.titulo}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.texto}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ textAlign: 'center', padding: '48px 24px 64px' }}>
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#C0AB60', marginBottom: 12 }}>
            Quer isso no seu condominio?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.6 }}>
            Cadastre agora gratuitamente e compartilhe o link com os moradores em minutos.
          </p>
          <a href="/cadastro" className="btn-dourado" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Comecar agora
          </a>
          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Faz parte do ecossistema SS Condo · Safe Season
          </div>
        </div>
      </section>

    </main>
  )
}