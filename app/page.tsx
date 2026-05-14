'use client'
import LocalizadorCondominio from './LocalizadorCondominio'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white', color: '#00210D' }}>

      <header style={{ backgroundColor: '#00210D', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GUARDA-SOL NA PRAIA</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>by SS Condo</div>
          </div>
          <a href="/login" style={{ backgroundColor: 'white', color: '#00210D', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Fazer login</a>
        </div>
      </header>

      <section style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 6vw, 36px)', fontWeight: 700, color: '#00210D', lineHeight: 1.15, marginBottom: 16 }}>Organize os guarda-sóis do seu condomínio</h1>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 28 }}>Aumente a eficiência da portaria, reduza confusão entre moradores.</p>
            <a href="/cadastro" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '14px 30px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Cadastrar meu condomínio grátis</a>
          </div>

          <div style={{ position: 'relative', height: 300, maxWidth: 340, margin: '0 auto', width: '100%' }}>
            <div style={{ position: 'absolute', right: 8, top: 16, width: 130, height: 50, backgroundColor: '#C0AB60', borderRadius: 4 }}></div>
            <div style={{ position: 'absolute', right: 0, bottom: 24, width: 48, height: 90, backgroundColor: '#00210D', borderRadius: 4 }}></div>

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

            <div style={{ position: 'absolute', right: 20, top: 0, width: 140, height: 260, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 8, transform: 'rotate(8deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: 18, height: '100%', padding: 10, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 9, color: '#888', textAlign: 'center', marginBottom: 4 }}>9:41</div>
                <div style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Portaria</div>
                <div style={{ fontSize: 11, color: '#00210D', fontWeight: 700, marginBottom: 8 }}>Lista de hoje</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF6EE', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#00210D' }}>12</div>
                  <div style={{ fontSize: 9, color: '#555' }}>kits hoje</div>
                </div>
                <div style={{ fontSize: 9, color: '#00210D', padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}><span>Apto 101</span><span style={{ color: '#C0AB60' }}>✓</span></div>
                <div style={{ fontSize: 9, color: '#00210D', padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}><span>Apto 304</span><span style={{ color: '#C0AB60' }}>✓</span></div>
                <div style={{ fontSize: 9, color: '#00210D', padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}><span>Apto 502</span><span style={{ color: '#C0AB60' }}>✓</span></div>
                <div style={{ fontSize: 9, color: '#00210D', padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}><span>Apto 706</span><span style={{ color: '#C0AB60' }}>✓</span></div>
                <div style={{ backgroundColor: '#00210D', color: 'white', padding: 5, borderRadius: 6, fontSize: 9, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>📄 Gerar PDF</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ height: 4, backgroundColor: '#00210D', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 60, bottom: -10, width: 100, height: 20, backgroundColor: '#00210D' }}></div>
        </div>
      </div>

      <section style={{ padding: '24px 20px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: '#00210D', marginBottom: 12 }}>Como funciona</h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>O proprietário reserva os dias pelo celular. A portaria já sabe antecipadamente quantos guarda-sóis levar para a praia.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#00210D', color: 'white', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>1</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#00210D', marginBottom: 8 }}>Síndico cadastra</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>Registra o condomínio e as unidades em minutos.</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#00210D', color: 'white', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>2</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#00210D', marginBottom: 8 }}>Morador reserva</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>Acessa pelo QR code ou link e marca os dias.</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#00210D', color: 'white', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>3</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#00210D', marginBottom: 8 }}>Portaria leva</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>Recebe a lista do dia e leva os kits para a praia.</div>
          </div>
        </div>
      </section>

      <LocalizadorCondominio />
      <section style={{ backgroundColor: '#FAF6EE', padding: '56px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 700, color: '#00210D', marginBottom: 10 }}>Quer isso no seu condomínio?</h2>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 28, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>Cadastre agora e compartilhe o link com os moradores em minutos.</p>
        <a href="/cadastro" style={{ display: 'inline-block', backgroundColor: '#00210D', color: 'white', padding: '14px 32px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Cadastrar meu condomínio grátis</a>
        <p style={{ marginTop: 14, fontSize: 13, color: '#555', fontStyle: 'italic' }}>Um serviço gratuito oferecido por <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ color: '#00210D', fontWeight: 600, textDecoration: 'underline' }}>www.sscondo.com.br</a></p>
      </section>

      <footer style={{ backgroundColor: '#00210D', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 20, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Guarda-Sol na Praia · {new Date().getFullYear()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' }}>powered by</span>
            <a href="https://www.sscondo.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/sscondo-logo.jpg" alt="SS Condo" style={{ height: 32, borderRadius: 4 }} />
              <div style={{ color: '#C0AB60', fontSize: 13, fontWeight: 600 }}>Safe Season</div>
            </a>
          </div>
        </div>
      </footer>

    <a href="https://wa.me/5513996655551?text=Ola!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Guarda-Sol%20na%20Praia." target="_blank" rel="noopener noreferrer" aria-label="Fale conosco no WhatsApp" style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", textDecoration: "none", zIndex: 999 }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg></a>
    </main>
  )
}
