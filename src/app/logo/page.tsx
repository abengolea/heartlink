export default function LogoPage() {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Logo HeartLink - Descarga</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
              text-align: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { 
              color: #2c3e50;
              margin-bottom: 30px;
            }
            .logo-section {
              margin: 30px 0;
              padding: 20px;
              border: 2px dashed #3498db;
              border-radius: 10px;
              background: #f8f9fa;
            }
            .logo {
              width: 200px;
              height: 200px;
              margin: 20px auto;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 48px;
              font-weight: bold;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
            .heart {
              color: #e74c3c;
              margin-right: 10px;
              animation: heartbeat 1.5s ease-in-out infinite;
            }
            @keyframes heartbeat {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            .download-btn {
              background: #3498db;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin: 10px;
              text-decoration: none;
              display: inline-block;
              transition: background 0.3s;
            }
            .download-btn:hover {
              background: #2980b9;
            }
            .logo-variants {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .variant {
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .variant h3 {
              margin-top: 0;
              color: #2c3e50;
            }
            .small-logo {
              width: 80px;
              height: 80px;
              margin: 10px auto;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 20px;
            }
            .blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .red { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            .green { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
            .dark { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); }
            .instructions {
              background: #e3f2fd;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: left;
            }
          `
        }} />
      </head>
      <body>
        <div className="container">
          <h1>🏥 Logo HeartLink - Centro de Descarga</h1>
          
          <div className="logo-section">
            <h2>Logo Principal</h2>
            <div className="logo">
              <span className="heart">❤️</span>
              <span>HL</span>
            </div>
            <p><strong>HeartLink</strong> - Sistema de Estudios Médicos</p>
          </div>

          <div className="instructions">
            <h3>📱 Cómo descargar:</h3>
            <ol>
              <li><strong>Screenshot:</strong> Haz captura de pantalla del logo que prefieras</li>
              <li><strong>Recortar:</strong> Recorta solo la parte del logo</li>
              <li><strong>Guardar:</strong> Guarda como PNG o JPG</li>
              <li><strong>Usar:</strong> Sube a Meta Developer Console</li>
            </ol>
          </div>

          <h2>🎨 Variantes de Logo</h2>
          <div className="logo-variants">
            <div className="variant">
              <h3>Azul (Principal)</h3>
              <div className="small-logo blue">
                <span style={{color: '#e74c3c', marginRight: '5px'}}>❤️</span>
                <span>HL</span>
              </div>
              <p>Para uso general</p>
            </div>
            
            <div className="variant">
              <h3>Rojo Médico</h3>
              <div className="small-logo red">
                <span style={{color: '#fff', marginRight: '5px'}}>❤️</span>
                <span>HL</span>
              </div>
              <p>Tema médico</p>
            </div>
            
            <div className="variant">
              <h3>Azul Claro</h3>
              <div className="small-logo green">
                <span style={{color: '#e74c3c', marginRight: '5px'}}>❤️</span>
                <span>HL</span>
              </div>
              <p>Versión fresca</p>
            </div>
            
            <div className="variant">
              <h3>Oscuro</h3>
              <div className="small-logo dark">
                <span style={{color: '#e74c3c', marginRight: '5px'}}>❤️</span>
                <span>HL</span>
              </div>
              <p>Fondo claro</p>
            </div>
          </div>

          <div className="logo-section">
            <h2>📏 Especificaciones</h2>
            <ul style={{textAlign: 'left', display: 'inline-block'}}>
              <li><strong>Tamaño recomendado:</strong> 512x512px o 1024x1024px</li>
              <li><strong>Formato:</strong> PNG con fondo transparente</li>
              <li><strong>Colores:</strong> Gradiente azul-púrpura + corazón rojo</li>
              <li><strong>Tipografía:</strong> Bold, sans-serif</li>
            </ul>
          </div>

          <div className="instructions">
            <h3>💡 Para Meta Developer Console:</h3>
            <p>Meta requiere un logo cuadrado de al menos 1024x1024px. Haz screenshot del logo principal y recórtalo en formato cuadrado.</p>
          </div>

          <p style={{marginTop: '40px', color: '#7f8c8d'}}>
            <strong>URL de esta página:</strong><br/>
            <code>https://heartlink--heartlink-f4ftq.us-central1.hosted.app/logo</code>
          </p>
        </div>
      </body>
    </html>
  );
}