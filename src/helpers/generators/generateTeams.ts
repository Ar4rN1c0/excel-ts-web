import { Categoria, Equipo } from "../../types/types";

export const generateTeams = (category: Categoria, n: number) => {
  const teams = [];

  for (let i = 1; i <= n; i++) {
    const equipo: Equipo = {
      categoria: category,
      horario: [],
      id: Number(crypto.randomUUID()),
      nombre: `Equipo ${category} ${i}`
    }
    teams.push(equipo)
  }
  return teams
}
