// src/html.ts
import { Equipo } from './timetable';

// Generar colores suaves únicos por equipo + actividad
function softColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`;
}

interface Cell {
  fecha: string;
  dia: string;
  hora: string;
  actividad: string;
  participantes: string[];
}

export function generateHorarioHtml(equipos: Equipo[]): string {
  const map = new Map<string, Cell>();
  equipos.forEach(eq => {
    eq.horario.forEach(ev => {
      if (!ev.inicio) return;
      const d = new Date(ev.inicio);
      const fecha = d.toISOString().slice(0, 10);
      const dia = d.toLocaleDateString('es-ES', { weekday: 'long' });
      const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const key = `${fecha}|${hora}|${ev.nombre}`;
      const cell = map.get(key);
      if (cell) {
        if (!cell.participantes.includes(eq.nombre)) {
          cell.participantes.push(eq.nombre);
        }
      } else {
        map.set(key, {
          fecha,
          dia,
          hora,
          actividad: ev.nombre,
          participantes: [eq.nombre],
        });
      }
    });
  });

  const cells = Array.from(map.values());
  cells.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    if (a.hora !== b.hora) return a.hora.localeCompare(b.hora);
    return a.actividad.localeCompare(b.actividad);
  });

  const fechas = Array.from(new Set(cells.map(c => c.fecha))).sort();
  const columnas = fechas.map(f => ({
    fecha: f,
    dia: new Date(f).toLocaleDateString('es-ES', { weekday: 'long' })
  }));

  const horas = Array.from(new Set(cells.map(c => c.hora))).sort((a, b) => {
    const [ha, ma] = a.split(':').map(Number);
    const [hb, mb] = b.split(':').map(Number);
    return ha === hb ? ma - mb : ha - hb;
  });

  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { background: #fdfcfb; font-family: sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background: #f1f1f1; }
    .event { margin-bottom: 4px; padding: 6px; border-radius: 4px; font-size: 0.9em; line-height: 1.2em; }
  </style>
</head>
<body>
  <h2 style="text-align:center;">Horario</h2>
  <table>
    <tr>
      <th>Hora</th>
      ${columnas.map(c => `<th>${c.dia} ${c.fecha}</th>`).join('')}
    </tr>
`;

  horas.forEach(hora => {
    html += `    <tr>\n      <td><strong>${hora}</strong></td>\n`;
    columnas.forEach(({ fecha }) => {
      const eventos = cells.filter(c => c.hora === hora && c.fecha === fecha);
      if (eventos.length === 0) {
        html += `      <td></td>\n`;
      } else {
        html += `      <td>\n`;
        eventos.forEach(cell => {
          const { actividad, participantes } = cell;
          const label = `<strong>${actividad}</strong><br/>`;

          if (participantes.length === 1) {
            const color = softColor(participantes[0] + actividad);
            html += `<div class="event" style="background:${color}">${label}${participantes[0]}</div>\n`;

          } else if (participantes.length === 2) {
            // Solo “vs” si la actividad es una carrera
            const isCarrera = actividad.toLowerCase().includes('carrera');
            const separator = isCarrera ? ' vs ' : ', ';
            const c1 = softColor(participantes[0] + actividad);
            const c2 = softColor(participantes[1] + actividad);
            html += `<div class="event" style="background:linear-gradient(to right, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)">${label}${participantes[0]}${separator}${participantes[1]}</div>\n`;

          } else {
            html += `<div class="event" style="background:#f9f9f9; border: 1px solid #ccc">${label}${participantes.join(', ')}</div>\n`;
          }
        });
        html += `      </td>\n`;
      }
    });
    html += `    </tr>\n`;
  });

  html += `  </table>\n</body>\n</html>`;
  return html;
}
