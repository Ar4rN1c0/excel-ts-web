import type { Equipo, Evento } from "../../types/types"

export function formatDateTime(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayName = days[date.getDay()]
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0") // Months are 0-indexed
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${dayName} ${day}/${month}/${year} ${hours}:${minutes}`
}


interface GroupedEvento {
    start: Date
    end: Date
    nombre: string
    participantes: Equipo[]
}

export function generateScheduleTable(equipos: Equipo[]): string {
  const groupedEventos: GroupedEvento[] = Object.values(
      equipos.reduce((acc, equipo) => {
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
      }, {} as Record<string, GroupedEvento>)
  )

  if (groupedEventos.length === 0) {
      return "<div>No hay eventos programados.</div>"
  }

  groupedEventos.sort((a, b) => a.start.getTime() - b.start.getTime())

  let html = `
  <table border="1" cellpadding="10" cellspacing="0">
    <thead>
      <tr>
        <th>Nombre del Evento</th>
        <th>Hora de Inicio</th>
        <th>Hora de Fin</th>
        <th>Participantes</th>
      </tr>
    </thead>
    <tbody>
`

  groupedEventos.forEach((evento) => {
      if (evento.nombre === "Descanso") {
          const dia = new Date(evento.start)
          dia.setDate(dia.getDate() - 1) // Día que termina
          const formattedDay = formatDateTime(dia).split(" ")[0] + " " + formatDateTime(dia).split(" ")[1]
          html += `
            <tr>
              <td colspan="4" style="text-align: center; font-weight: bold;">
                Fin del día: ${formattedDay}
              </td>
            </tr>
          `
      } else {
          const startTime = formatDateTime(evento.start)
          const endTime = formatDateTime(evento.end)

          html += `
            <tr>
              <td>${evento.nombre}</td>
              <td>${startTime}</td>
              <td>${endTime}</td>
              <td>
                ${evento.participantes
                    .map((equipo) => `${equipo.nombre}`)
                    .join("<br />")}
              </td>
            </tr>
          `
      }
  })

  html += `
    </tbody>
  </table>
`

  return html
}
