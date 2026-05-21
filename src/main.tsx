import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error Handling für Blank Screen
const renderApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    const root = createRoot(rootElement);
    root.render(<App />);

    // Erfolgreich gerendert - Loading Screen entfernen
    console.log("✅ FitTrack Pro erfolgreich gestartet");
  } catch (error: any) {
    console.error("❌ Fehler beim Starten der App:", error);
    
    // Zeige Fehler auf der Seite an
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%);
        ">
          <div style="
            background: white;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            text-align: center;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h1 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
              Fehler beim Laden
            </h1>
            <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 14px; line-height: 1.5;">
              ${error?.message || 'Ein unbekannter Fehler ist aufgetreten'}
            </p>
            <button onclick="window.location.reload()" style="
              background: #9b87f5;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              font-weight: 500;
            ">
              Seite neu laden
            </button>
            <p style="color: #9ca3af; margin: 16px 0 0 0; font-size: 12px;">
              Fehlerdetails in der Konsole (F12)
            </p>
          </div>
        </div>
      `;
    }
  }
};

// Warte auf DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
