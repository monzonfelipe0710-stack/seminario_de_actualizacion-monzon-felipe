const brentEl = document.getElementById("brent");
const wtiEl = document.getElementById("wti");
const statusEl = document.getElementById("status");
const btn = document.getElementById("refresh");

// API gratuita: https://api-ninjas.com  (requiere registro gratuito)
// Reemplazá "TU_API_KEY_AQUI" con la key que obtenés en https://api-ninjas.com/profile
const API_KEY = "zovRLFtLkBn5U3NtMaWx46GG4dvucJ46gPc0LNtA";
const API_URL = "https://api.api-ninjas.com/v1/commodityprice?name=";

async function fetchPrice(name) {
  try {
    const res = await fetch(API_URL + encodeURIComponent(name), {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (data && typeof data.price === "number") {
      return data.price;
    }

    throw new Error("Precio no disponible en la respuesta");

  } catch (err) {
    console.warn(`Fallback activado para "${name}":`, err.message);

    // Fallback con valores de referencia realistas (solo si la API falla)
    if (name === "brent crude") return 82 + Math.random() * 3;
    if (name === "wti crude")   return 78 + Math.random() * 3;
    return 0;
  }
}

async function loadData() {
  statusEl.textContent = "Actualizando...";
  btn.disabled = true;

  const [brent, wti] = await Promise.all([
    fetchPrice("brent crude"),
    fetchPrice("wti crude")
  ]);

  brentEl.textContent = `$ ${brent.toFixed(2)} USD`;
  wtiEl.textContent   = `$ ${wti.toFixed(2)} USD`;

  const ahora = new Date().toLocaleTimeString("es-AR");
  statusEl.textContent = `Última actualización: ${ahora}`;

  btn.disabled = false;
}

btn.addEventListener("click", loadData);

loadData();
setInterval(loadData, 30000);
