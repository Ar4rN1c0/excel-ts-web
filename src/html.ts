// src/html.ts

import { Equipo } from './timetable';

const diasOrden = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'] as const;
type Dia = typeof diasOrden[number];

// asigna colores como en tu ejemplo Python
const colors: Record<string,string> = {
  'Equipo Entry 1': '#1f77b4',
  'Equipo Entry 2': '#ff7f0e',
  'Equipo Entry 3': '#2ca02c',
  'Equipo Entry 4': '#d62728',
  'Equipo Entry 5': '#9467bd',
  'Equipo Development 1': '#8c564b',
  'Equipo Development 2': '#e377c2',
  'Equipo Development 3': '#7f7f7f',
  'Equipo Development 4': '#bcbd22',
  'Equipo Development 5': '#17becf',
  'Equipo Professional 1': '#aec7e8',
  'Equipo Professional 2': '#ffbb78',
  'Equipo Professional 3': '#98df8a',
  'Equipo Professional 4': '#ff9896',
  'Equipo Professional 5': '#c5b0d5',
  'Equipo Professional 6': '#c49c94',
  'Equipo Professional 7': '#f7b6d2',
};

interface Cell {
  fecha: string;       // YYYY-MM-DD
  dia: Dia;            // e.g. "martes"
  hora: string;        // "HH:MM"
  actividad: string;
  participantes: string[];
}

export function generateHorarioHtml(equipos: Equipo[]): string {
  // 1) Aplanar todos los eventos en un map para agrupar participantes
  const map = new Map<string,Cell>();
  equipos.forEach(eq => {
    eq.horario.forEach(ev => {
      if (!ev.inicio) return;
      const d = new Date(ev.inicio);
      const fecha = d.toISOString().slice(0,10);
      const dia = d.toLocaleDateString('es-ES', { weekday: 'long' }) as Dia;
      const hora = d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
      const key = `${fecha}|${hora}|${ev.nombre}`;
      const cell = map.get(key);
      if (cell) {
        if (!cell.participantes.includes(eq.nombre))
          cell.participantes.push(eq.nombre);
      } else {
        map.set(key, {
          fecha, dia, hora,
          actividad: ev.nombre,
          participantes: [eq.nombre],
        });
      }
    });
  });

  // 2) Convertir a array y ordenar por hora y fecha
  const cells = Array.from(map.values());
  cells.sort((a,b) => {
    if (a.hora !== b.hora) return a.hora.localeCompare(b.hora);
    return a.fecha.localeCompare(b.fecha);
  });

  // 3) Extraer lista de días presentes, en orden Lunes→Domingo
  const diasPresentes = diasOrden.filter(d => cells.some(c => c.dia === d));

  // 4) Construir HTML
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <table>
    <tr><th>Hora</th>${diasPresentes.map(d => `<th>${d}</th>`).join('')}</tr>
`;

  // 5) Todas las horas únicas en orden
  const horas = Array.from(new Set(cells.map(c => c.hora))).sort();

  horas.forEach(hora => {
    html += `    <tr><td><strong>${hora}</strong></td>\n`;
    diasPresentes.forEach(dia => {
      const cell = cells.find(c => c.hora === hora && c.dia === dia);
      if (!cell) {
        html += '      <td></td>\n';
      } else {
        const p = cell.participantes;
        const act = `<strong>${cell.actividad}</strong><br/>`;
        if (p.length === 1) {
          const color = colors[p[0]] || '#ccc';
          html += `      <td style="background-color:${color};">${act}${p[0]}</td>\n`;
        } else if (p.length === 2) {
          const c1 = colors[p[0]]||'#ccc';
          const c2 = colors[p[1]]||'#999';
          html += `      <td style="background:linear-gradient(to right, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%);">${act}${p[0]} vs ${p[1]}</td>\n`;
        } else {
          html += `      <td>${act}${p.join(', ')}</td>\n`;
        }
      }
    });
    html += '    </tr>\n';
  });

  html += `  </table>
</body>
</html>`;
  return html;
}
