'use client'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', color: '#00210D' }}>

      {/* HEADER VERDE */}
      <header style={{ backgroundColor: '#00210D', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
              GUARDA-SOL NA PRAIA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              by SS Condo
            </div>
          </div>
          <a href="/cadastro" className="btn-header-cadastro" style={{ backgroundColor: 'white', color: '#00210D', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Cadastrar grátis
          </a>
        </div>
      </header>

      {/* HERO COM MOCKUPS */}
      <section style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>

          <div>
            <h1 style={{ fontSize: 'clamp(26px, 6vw, 36px)', fontWeight: 700, color: '#00210D', lineHeight: 1.15, marginBottom: 16 }}>
              Organize os guarda-sóis do seu condomínio
            </h1>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 28 }}>
              Aumente a eficiência da portaria, reduza confusão entre moradores.
            </p>
            <a href="/cadastro" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '14px 30px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Cadastrar meu condomínio grátis
            </a>
          </div>

          {/* MOCKUPS DOS CELULARES */}
          <div style={{ position: 'relative', height: 300, maxWidth: 340, margin: '0 auto', width: '100%' }}>

            <div style={{ position: 'absolute', right: 8, top: 16, width: 130, height: 50, backgroundColor: '#C0AB60', borderRadius: 4 }}></div>
            <div style={{ position: 'absolute', right: 0, bottom: 24, width: 48, height: 90, backgroundColor: '#00210D', borderRadius: 4 }}></div>

            {/* Celular 1 - Morador */}
            <div style={{ position: 'absolute', left: 8, top: 40, width: 140, height: 250, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 8, transform: 'rotate(-6deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <div style={{ backgroundColor: '#FAF6EE', borderRadius: 18, height: '100%', padding: 10, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 9, color: '#888', textAlign: 'center', marginBottom: 4 }}>9:41</div>
                <div style={{ backgroundColor: '#00210D', color: 'white', padding: 5, borderRadius: 5, fontSize: 10, textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>Apto 304</div>
                <div style={{ fontSize: 9, color: '#00210D', fontWeight: 600, marginBottom: 4 }}>Maio 2026</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 8 }}>
                  <div style={{ textAlign: 'center', color: '#999' }}>D</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>T</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>Q</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>Q</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', color: '#999' }}>S</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#ccc' }}>5</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>6</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>7</div>
                  <div style={{ textAlign: 'center', padding: 2, backgroundColor: '#00210D', color: 'white', borderRadius: 3 }}>8</div>
                  <div style={{ textAlign: 'center', padding: 2, backgroundColor: '#00210D', color: 'white', borderRadius: 3 }}>9</div>
                  <div style={{ textAlign: 'center', padding: 2, backgroundColor: '#00210D', color: 'white', borderRadius: 3 }}>10</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>11</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>12</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>13</div>
                  <div style={{ textAlign: 'center', padding: 2, backgroundColor: '#00210D', color: 'white', borderRadius: 3 }}>14</div>
                  <div style={{ textAlign: 'center', padding: 2, backgroundColor: '#00210D', color: 'white', borderRadius: 3 }}>15</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>16</div>
                  <div style={{ textAlign: 'center', padding: 2, color: '#00210D' }}>17</div>
                </div>
                <div style={{ backgroundColor: '#C0AB60', color: 'white', padding: 5, borderRadius: 6, fontSize: 10, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>Confirmar</div>
              </div>
            </div>

            {/* Celular 2 - Portaria */}
            <div style={{ position: 'absolute', right: 20, top: 0, width: 140, height: 260, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 8, transform: 'rotate(8deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: 18, height: '100%', padding: 10, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 9, color: '#888', textAlign: 'center', marginBottom: 4 }}>9:41</div>
                <div style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Portaria</div>
                <div style={{ fontSize: 11, color: '#00210D', fontWeight: 700, marginBottom: 8 }}>Lista de hoje</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF6EE', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#00210D' }}>12</div>
                  <div style={{ fontSize: 9, color: '#555' }}>kits hoje</div>
                </div>
                {[
                  { n: '101', name: 'João' },
                  { n: '304', name: 'Maria' },
                  { n: '502', name: 'Pedro' },
                  { n: '706', name: 'Ana' },
                ].map((apto, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#00210D', padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Apto {apto.n}</span>
                    <span style={{ color: '#C0AB60' }}>✓</span>
                  </div>
                ))}
                <div style={{ backgroundColor: '#00210D', color: 'white', padding: 5, borderRadius: 6, fontSize: 9, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>📄 Gerar PDF</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DIVISOR EM ZIGZAG */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ height: 4, backgroundColor: '#00210D', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 60, bottom: -10, width: 100, height: 20, backgroundColor: '#00210D' }}></div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <section style={{ padding: '24px 20px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: '#00210D', marginBottom: 12 }}>Como funciona</h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            O proprietário reserva os dias pelo celular. A portaria já sabe antecipadamente quantos guarda-sóis levar para a praia.
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
      <section style={{ backgroundColor: '#FAF6EE', padding: '56px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 700, color: '#00210D', marginBottom: 10 }}>
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

      {/* RODAPÉ */}
      <footer style={{ backgroundColor: '#00210D', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 20, textAlign: 'center' }}>

          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Guarda-Sol na Praia · {new Date().getFullYear()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>
              powered by
            </span>
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/sscondo-logo.jpg" alt="SS Condo" style={{ height: 32, borderRadius: 4 }} />
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