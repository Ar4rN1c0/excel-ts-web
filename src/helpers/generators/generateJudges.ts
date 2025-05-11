import { Juez, TipoJuez } from "../../types/types";

export const generateJudges = (tipo: TipoJuez, cantidad: number) => {
  const judges: Juez[] = [];

  for (let i = 0; i < cantidad; i++) {
    const juez: Juez = {
      id: i + 1,
      tipo: tipo,
      horario: [],
      nombre: `${tipo} ${i + 1}`
    };
    judges.push(juez);
  }

  return judges;
}
