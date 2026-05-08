'use client'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', color: '#00210D' }}>

      {/* HEADER VERDE */}
      <header style={{ backgroundColor: '#00210D', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            GUARDA-SOL NA PRAIA
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
            by SS Condo
          </div>
        </div>
        <a href="/cadastro" style={{ backgroundColor: 'white', color: '#00210D', padding: '10px 22px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Cadastrar meu condomínio grátis
        </a>
      </header>

      {/* HERO COM MOCKUPS */}
      <section style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center' }}>

          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: '#00210D', lineHeight: 1.15, marginBottom: 16 }}>
              Organize os guarda-sóis<br />do seu condomínio
            </h1>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 28 }}>
              Aumente a eficiência da portaria,<br />reduza confusão entre moradores.
            </p>
            <a href="/cadastro" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '14px 30px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Cadastrar meu condomínio grátis
            </a>
          </div>

          {/* MOCKUPS DOS CELULARES */}
          <div style={{ position: 'relative', height: 380, minWidth: 320 }}>

            {/* Retângulos decorativos atrás */}
            <div style={{ position: 'absolute', right: 8, top: 20, width: 160, height: 60, backgroundColor: '#C0AB60', borderRadius: 4 }}></div>
            <div style={{ position: 'absolute', right: 0, bottom: 30, width: 60, height: 110, backgroundColor: '#00210D', borderRadius: 4 }}></div>

            {/* Celular 1 - Morador (calendário) */}
            <div style={{ position: 'absolute', left: 10, top: 50, width: 170, height: 320, backgroundColor: '#1a1a1a', borderRadius: 28, padding: 10, transform: 'rotate(-6deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <div style={{ backgroundColor: '#FAF6EE', borderRadius: 20, height: '100%', padding: 14, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 6 }}>9:41</div>
                <div style={{ backgroundColor: '#00210D', color: 'white', padding: 7, borderRadius: 6, fontSize: 11, textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>Apto 304</div>
                <div style={{ fontSize: 10, color: '#00210D', fontWeight: 600, marginBottom: 6 }}>Maio 2026</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, fontSize: 9 }}>
                  <div style={{ textAlign: 'center', color: '#999' }}>D</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>T</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>Q</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>Q</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#ccc' }}>5</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>6</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>7</div>
                  <div style={{ textAlign: 'center', padding: 3, backgroundColor: '#00210D', color: 'white', borderRadius: 4 }}>8</div>
                  <div style={{ textAlign: 'center', padding: 3, backgroundColor: '#00210D', color: 'white', borderRadius: 4 }}>9</div>
                  <div style={{ textAlign: 'center', padding: 3, backgroundColor: '#00210D', color: 'white', borderRadius: 4 }}>10</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>11</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>12</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>13</div>
                  <div style={{ textAlign: 'center', padding: 3, backgroundColor: '#00210D', color: 'white', borderRadius: 4 }}>14</div>
                  <div style={{ textAlign: 'center', padding: 3, backgroundColor: '#00210D', color: 'white', borderRadius: 4 }}>15</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>16</div>
                  <div style={{ textAlign: 'center', padding: 3, color: '#00210D' }}>17</div>
                </div>
                <div style={{ backgroundColor: '#C0AB60', color: 'white', padding: 7, borderRadius: 8, fontSize: 11, textAlign: 'center', fontWeight: 600, marginTop: 12 }}>Confirmar</div>
              </div>
            </div>

            {/* Celular 2 - Portaria (lista) */}
            <div style={{ position: 'absolute', right: 30, top: 0, width: 170, height: 330, backgroundColor: '#1a1a1a', borderRadius: 28, padding: 10, transform: 'rotate(8deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: 20, height: '100%', padding: 14, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 6 }}>9:41</div>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Portaria</div>
                <div style={{ fontSize: 12, color: '#00210D', fontWeight: 700, marginBottom: 10 }}>Lista de hoje</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF6EE', padding: '8px 10px', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#00210D' }}>12</div>
                  <div style={{ fontSize: 10, color: '#555' }}>kits hoje</div>
                </div>
                {[
                  { n: '101', name: 'João' },
                  { n: '304', name: 'Maria' },
                  { n: '502', name: 'Pedro' },
                  { n: '706', name: 'Ana' },
                ].map((apto, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#00210D', padding: '6px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Apto {apto.n}</span>
                    <span style={{ color: '#C0AB60' }}>✓</span>
                  </div>
                ))}
                <div style={{ backgroundColor: '#00210D', color: 'white', padding: 7, borderRadius: 8, fontSize: 10, textAlign: 'center', fontWeight: 600, marginTop: 12 }}>📄 Gerar PDF</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DIVISOR EM ZIGZAG */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ height: 4, backgroundColor: '#00210D', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 60, bottom: -10, width: 100, height: 20, backgroundColor: '#00210D' }}></div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <section style={{ padding: '24px 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#00210D', marginBottom: 12 }}>Como funciona</h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            O proprietário reserva os dias pelo celular.<br />
            A portaria já sabe antecipadamente quantos guarda-sóis levar para a praia.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { num: '1', titulo: 'Síndico cadastra', texto: 'Registra o condomínio e as unidades em minutos.' },
            { num: '2', titulo: 'Morador reserva', texto: 'Acessa pelo QR code ou link e marca os dias.' },
            { num: '3', titulo: 'Portaria leva', texto: 'Recebe a lista do dia e leva os kits para a praia.' },
          ].map((item) => (
            <div key={item.num} style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#00210D', color: 'white', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {item.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#00210D', marginBottom: 8 }}>{item.titulo}</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{item.texto}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '56px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#00210D', marginBottom: 10 }}>
          Quer isso no seu condomínio?
        </h2>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 28, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
          Cadastre agora e compartilhe o link com os moradores em minutos.
        </p>
      <a href="/cadastro" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '14px 32px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Cadastrar meu condomínio grátis
        </a>
        <p style={{ marginTop: 14, fontSize: 13, color: '#555', fontStyle: 'italic' }}>
          Um serviço gratuito oferecido por{' '}
          <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ color: '#00210D', fontWeight: 600, textDecoration: 'underline' }}>
            www.sscondo.com.br
          </a>
        </p>
      </section>

      {/* RODAPÉ COM SELO SS CONDO DESTACADO */}
      <footer style={{ backgroundColor: '#00210D', padding: '32px 24px' }}>
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