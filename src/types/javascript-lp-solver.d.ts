// src/types/javascript-lp-solver.d.ts
declare module 'javascript-lp-solver' {
    /**
     * El solver expone una función Solve que toma un modelo LP/MIP y devuelve
     * el resultado en JSON.
     * Aquí lo dejamos como `any`, pero podrías tiparlo si quisieras.
     */
    export function Solve(model: any): any;
  
    /** También se puede importar como namespace */
    const Solver: {
      Solve: (model: any) => any;
    };
    export default Solver;
  }
  