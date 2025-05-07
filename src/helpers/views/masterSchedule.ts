import type { Equipo, Evento } from "../../types/types"

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

interface GroupedEvento {
  start: Date
  end: Date
  nombre: string
  participantes: Equipo[]
}

export function generateScheduleHTML(equipos: Equipo[]): string {
  const groupedEventos: GroupedEvento[] = Object.values(
    equipos.reduce(
      (acc, equipo) => {
        equipo.horario.forEach((evento: Evento) => {
          const key = `${evento.start.toISOString()}-${evento.end.toISOString()}-${evento.nombre}`
          if (!acc[key]) {
            acc[key] = {
              start: evento.start,
              end: evento.end,
              nombre: evento.nombre,
              participantes: [],
            }
          }
          acc[key].participantes.push(equipo)
        })
        return acc
      },
      {} as Record<string, GroupedEvento>,
    ),
  )

  if (groupedEventos.length === 0) {
    return "<div>No hay eventos programados.</div>"
  }

  groupedEventos.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Calcular el rango total del timeline
  const minStartTime = Math.min(...groupedEventos.map((e) => e.start.getTime()))
  const maxEndTime = Math.max(...groupedEventos.map((e) => e.end.getTime()))
  const totalDurationMs = maxEndTime - minStartTime

  // Generar las horas para el eje de tiempo
  const startDate = new Date(minStartTime)
  const endDate = new Date(maxEndTime)
  const timeLabels = []

  const startHour = startDate.getHours()
  const endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0)

  for (let hour = startHour; hour <= endHour; hour++) {
    const timeLabel = `${hour.toString().padStart(2, "0")}:00`
    timeLabels.push(timeLabel)
  }

  // Organizar eventos en filas para manejar eventos concurrentes
  const rows: GroupedEvento[][] = []

  groupedEventos.forEach((evento) => {
    // Buscar una fila donde el evento pueda ser colocado sin solaparse
    let rowIndex = 0
    let placed = false

    while (!placed) {
      if (!rows[rowIndex]) {
        rows[rowIndex] = []
        rows[rowIndex].push(evento)
        placed = true
      } else {
        // Verificar si el evento se solapa con alguno en esta fila
        const overlaps = rows[rowIndex].some((existingEvento) => {
          // Add a small buffer (5 minutes) to avoid events being too close
          const buffer = 5 * 60 * 1000 // 5 minutes in milliseconds
          return (
            evento.start.getTime() - buffer < existingEvento.end.getTime() &&
            evento.end.getTime() + buffer > existingEvento.start.getTime()
          )
        })

        if (!overlaps) {
          rows[rowIndex].push(evento)
          placed = true
        } else {
          rowIndex++
        }
      }
    }
  })

  // Calcular el ancho mínimo necesario para el contenedor basado en la duración
  // Asegurar que haya suficiente espacio para mostrar todos los eventos
  const hourWidth = 320 // Significantly increased width per hour (pixels)
  const totalHours = (maxEndTime - minStartTime) / (60 * 60 * 1000)
  const minContainerWidth = Math.max(totalHours * hourWidth, 2000) // Fixed syntax error here

  // Generar el HTML
  let html = `
    <div class="schedule-container" style="min-width: ${minContainerWidth}px;">
      <div class="time-axis">
        ${timeLabels.map((label) => `<div class="time-label">${label}</div>`).join("")}
      </div>
      <div class="events-container">
  `

  rows.forEach((row) => {
    html += '<div class="event-row">'

    row.forEach((evento) => {
      const startPos = ((evento.start.getTime() - minStartTime) / totalDurationMs) * 100
      const width = ((evento.end.getTime() - evento.start.getTime()) / totalDurationMs) * 100

      const startTime = formatTime(evento.start)
      const endTime = formatTime(evento.end)

      // Increased minimum width for each event card
      const minWidth = 10 // Increased minimum percentage width

      // Calculate event type color
      const eventType = evento.nombre.includes("Carrera")
        ? "race"
        : evento.nombre.includes("Portfolio")
          ? "portfolio"
          : evento.nombre.includes("Presentación")
            ? "presentation"
            : evento.nombre.includes("Escrutinio")
              ? "scrutiny"
              : evento.nombre.includes("Pit Display")
                ? "pit"
                : evento.nombre.includes("Charla")
                  ? "talk"
                  : "default"

      html += `
        <div class="event-card event-type-${eventType}" style="left: ${startPos}%; width: ${Math.max(width, minWidth)}%;">
          <div class="event-header">
            <div class="event-name">${evento.nombre}</div>
            <div class="event-time">${startTime} - ${endTime}</div>
          </div>
          <div class="event-participants">
            ${evento.participantes
              .map(
                (equipo) => `
              <div class="participant">
                <span class="participant-color" style="background-color: ${getCategoryColor(equipo.categoria)};"></span>
                <span class="participant-name">${equipo.nombre}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    })

    html += "</div>"
  })

  html += `
      </div>
    </div>
    <style>
      .schedule-container {
        font-family: 'Arial', sans-serif;
        margin: 20px 0;
        position: relative;
        overflow-x: auto; /* Enable horizontal scroll */
      }
      
      .time-axis {
        display: flex;
        justify-content: space-between;
        padding-bottom: 15px;
        border-bottom: 2px solid #ddd;
        position: sticky;
        top: 0;
        background-color: white;
        z-index: 10;
      }
      
      .time-label {
        font-size: 16px;
        color: #555;
        flex: 1;
        text-align: center;
        min-width: 100px; /* Increased minimum width for time labels */
        padding: 0 15px;
        font-weight: bold;
      }
      
      .events-container {
        position: relative;
        padding-top: 25px; /* Increased top padding */
      }
      
      .event-row {
        position: relative;
        height: 110px; /* Increased row height */
        margin-bottom: 25px; /* Increased margin between rows */
      }
      
      .event-card {
        position: absolute;
        background-color: #f0f7ff;
        border: 1px solid #cce5ff;
        border-radius: 8px; /* Increased border radius */
        padding: 15px; /* Increased padding */
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        height: 100%;
        box-sizing: border-box;
        transition: transform 0.2s, box-shadow 0.2s;
        min-width: 200px; /* Increased minimum width for event cards */
      }
      
      /* Event type styling */
      .event-type-race {
        background-color: #e3f2fd;
        border-color: #90caf9;
      }
      
      .event-type-portfolio {
        background-color: #e8f5e9;
        border-color: #a5d6a7;
      }
      
      .event-type-presentation {
        background-color: #fff3e0;
        border-color: #ffcc80;
      }
      
      .event-type-scrutiny {
        background-color: #f3e5f5;
        border-color: #ce93d8;
      }
      
      .event-type-pit {
        background-color: #e8eaf6;
        border-color: #9fa8da;
      }
      
      .event-type-talk {
        background-color: #fce4ec;
        border-color: #f48fb1;
      }
      
      .event-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        z-index: 10;
      }
      
      .event-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px; /* Increased margin */
        flex-wrap: wrap;
      }
      
      .event-name {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 15px; /* Increased font size */
        flex: 1;
        min-width: 150px;
        margin-right: 10px;
      }
      
      .event-time {
        font-size: 14px; /* Increased font size */
        color: #555;
        white-space: nowrap;
      }
      
      .event-participants {
        font-size: 14px; /* Increased font size */
        overflow-y: auto;
        max-height: 60px; /* Increased max height */
      }
      
      .participant {
        display: flex;
        align-items: center;
        margin-bottom: 5px; /* Increased margin */
      }
      
      .participant-color {
        display: inline-block;
        width: 12px; /* Increased size */
        height: 12px; /* Increased size */
        border-radius: 50%;
        margin-right: 8px; /* Increased margin */
      }
      
      .participant-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      @media (max-width: 768px) {
        .event-card {
          padding: 10px;
        }
        
        .event-name, .event-time {
          font-size: 13px;
        }
        
        .event-participants {
          font-size: 12px;
        }
      }
    </style>
  `

  return html
}

// Helper function to get color based on team category
function getCategoryColor(category: string): string {
  switch (category) {
    case "Entry":
      return "#4285F4"
    case "Development":
      return "#EA4335"
    case "Professional":
      return "#FBBC05"
    default:
      return "#34A853"
  }
}
