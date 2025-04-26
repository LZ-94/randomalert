// 🎯 Elementos del DOM (se obtienen dentro de DOMContentLoaded)
let sliderInicio, sliderFin, spanInicio, spanFin;
let inputAvisos, spanAvisosHora, selectTono;
let sliderVolumen, spanVolumen, audioAlerta;
let btnProbar, btnGuardar, btnDetener, btnModoClaro, listaConfig;
let timers = [];

// Sonidos
const sonidos = {
  beep: "sonidos/beep.mp3",
  bird: "sonidos/bird.mp3",
  bell: "sonidos/bell.mp3",
};

// Esperamos a que cargue el DOM
window.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Referencias a elementos
  sliderInicio   = document.getElementById("slider-inicio");
  sliderFin      = document.getElementById("slider-fin");
  spanInicio     = document.getElementById("inicio-hora");
  spanFin        = document.getElementById("fin-hora");
  inputAvisos    = document.getElementById("alerts");
  spanAvisosHora = document.getElementById("avisos-por-hora");
  selectTono     = document.getElementById("tono");
  sliderVolumen  = document.getElementById("volumen");
  spanVolumen    = document.getElementById("volumen-valor");
  audioAlerta    = document.getElementById("audio-alerta");
  btnProbar      = document.getElementById("probar-sonido");
  btnGuardar     = document.getElementById("guardar-config");
  btnDetener     = document.getElementById("detener-avisos");
  btnModoClaro   = document.getElementById("btnModoClaro");
  listaConfig    = document.getElementById("configuracion-guardada");

  // 2️⃣ Cargar tema guardado (o light por defecto)
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  btnModoClaro.textContent = savedTheme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro";

  // 3️⃣ Lógica de cambio de tema
  btnModoClaro.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    btnModoClaro.textContent = next === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro";
  });

  // 4️⃣ Resto de tu lógica tal cual:
  // Probar sonido
  btnProbar.onclick = () => {
    audioAlerta.src = sonidos[selectTono.value];
    audioAlerta.volume = parseFloat(sliderVolumen.value);
    audioAlerta.play();
  };

  // Volumen dinámico
  sliderVolumen.oninput = () => {
    spanVolumen.textContent = Math.round(sliderVolumen.value * 100) + "%";
    audioAlerta.volume = sliderVolumen.value;
  };

  // Sliders hora inicio/fin
  sliderInicio.oninput = () => {
    spanInicio.textContent = sliderInicio.value;
    if (+sliderFin.value <= +sliderInicio.value) {
      sliderFin.value = +sliderInicio.value + 1;
      spanFin.textContent = sliderFin.value;
    }
    actualizarAvisosPorHora();
  };
  sliderFin.oninput = () => {
    if (+sliderFin.value <= +sliderInicio.value) {
      sliderFin.value = +sliderInicio.value + 1;
    }
    spanFin.textContent = sliderFin.value;
    actualizarAvisosPorHora();
  };

  // Cálculo avisos por hora
  inputAvisos.oninput = actualizarAvisosPorHora;
  function actualizarAvisosPorHora() {
    const horas = sliderFin.value - sliderInicio.value;
    const avisosPorHora = horas > 0
      ? Math.max(1, inputAvisos.value / horas).toFixed(2)
      : "0";
    spanAvisosHora.textContent = avisosPorHora;
  }

  // Guardar configuración e iniciar avisos
  btnGuardar.onclick = () => {
    const config = {
      horaInicio: +sliderInicio.value,
      horaFin:    +sliderFin.value,
      avisos:     +inputAvisos.value,
      tono:       selectTono.value,
      volumen:    +sliderVolumen.value
    };
    localStorage.setItem("configAlarma", JSON.stringify(config));
    mostrarConfiguracion(config);
    iniciarAvisos(config);
    alert("✅ Configuración guardada e iniciada");
  };

  // Mostrar configuración
  function mostrarConfiguracion(config) {
    listaConfig.innerHTML = `
      <p><strong>Hora de inicio:</strong> ${config.horaInicio}</p>
      <p><strong>Hora de fin:</strong> ${config.horaFin}</p>
      <p><strong>Número de avisos:</strong> ${config.avisos}</p>
      <p><strong>Tono:</strong> ${config.tono}</p>
      <p><strong>Volumen:</strong> ${Math.round(config.volumen * 100)}%</p>
    `;
  }

  // Cargar configuración previa
  const prev = JSON.parse(localStorage.getItem("configAlarma"));
  if (prev) {
    sliderInicio.value   = prev.horaInicio;
    sliderFin.value      = prev.horaFin;
    inputAvisos.value    = prev.avisos;
    selectTono.value     = prev.tono;
    sliderVolumen.value  = prev.volumen;
    spanInicio.textContent = prev.horaInicio;
    spanFin.textContent    = prev.horaFin;
    spanVolumen.textContent= Math.round(prev.volumen * 100) + "%";
    actualizarAvisosPorHora();
    mostrarConfiguracion(prev);
  }

  // Iniciar avisos aleatorios
  function iniciarAvisos(config) {
    timers.forEach(clearTimeout);
    timers = [];
    const ahora = new Date();
    const hoy   = new Date().toDateString();
    const totalMinutos = (config.horaFin - config.horaInicio) * 60;
    const setMinutos = new Set();
    while (setMinutos.size < config.avisos) {
      setMinutos.add(Math.floor(Math.random() * totalMinutos));
    }
    setMinutos.forEach(min => {
      const h = Math.floor(min / 60), m = min % 60;
      const t = new Date(`${hoy} ${String(config.horaInicio+h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
      const delay = t - ahora;
      if (delay > 0) {
        const id = setTimeout(() => lanzarAviso(config), delay);
        timers.push(id);
      }
    });
  }

  // Detener avisos
  btnDetener.onclick = () => {
    timers.forEach(clearTimeout);
    timers = [];
    alert("⏹️ Avisos detenidos");
  };

  // Lanzar aviso
  function lanzarAviso(config) {
    audioAlerta.src = sonidos[config.tono];
    audioAlerta.volume = config.volumen;
    audioAlerta.play();
    const aviso = document.createElement("div");
    aviso.textContent = "🔔 ¡Aviso!";
    aviso.classList.add("aviso-visual");
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 10000);
  }
});
