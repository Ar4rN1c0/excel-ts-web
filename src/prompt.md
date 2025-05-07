# 🏁 Planificación de Competiciones con Ventanas Temporales Discontinuas

Este sistema organiza automáticamente el horario de una competición dividida en varios días con **franjas horarias discontinuas** (ej. dos mañanas y una tarde). Está diseñado para respetar restricciones de tiempo, orden lógico de fases, recursos disponibles y coherencia temporal.

---

## 🎯 Objetivo

Asignar actividades obligatorias y carreras para todos los equipos y jueces, cumpliendo con:

- Restricciones de tiempo
- Recursos disponibles (jueces, pista, personal de registro)
- Coherencia temporal (orden lógico de fases)
- Ventanas horarias válidas (ej. 17/jun 16–19 h, 18/jun 9–18 h, 19/jun 9–14 h)

---

## 📅 Estructura Temporal General

| Fase                          | Obligatoria | Orden      | Repetible | Notas                                                                 |
|-------------------------------|-------------|------------|-----------|-----------------------------------------------------------------------|
| Registro                      | ✅ Sí        | Siempre 1º | No        | **Sólo primer día**, todos los equipos; puede haber concurrencia según personal de registro.          |
| Charla/Presentación inicial   | ✅ Sí        | 2ª         | No        | 20 min tras el último registro del primer día.                     |
| Ceremonia de Inauguración     | ✅ Sí        | 3ª         | No        | **Sólo primer día**, tras la charla inicial.                     |
| Montaje del Pit Display       | ✅ Sí        | 4ª         | No        | **Sólo primer día**, todos los equipos a la vez. Duración variable por categoría.                  |
| Evaluaciones y Scrutiny       | ✅ Sí        | Flexible   | No        | Por equipo y por juez. Pueden hacerse en paralelo según jueces disponibles y tipo de evaluación. |
| Presentación Verbal           | ✅ Sí        | Flexible   | No        | Igual que evaluaciones (jueces simultáneos configurables).                                               |
| Carreras clasificatorias      | ✅ Sí        | Después    | Sí        | **Una carrera a la vez**, emparejadas por pares de equipos en misma categoría.                   |
| Eliminatorias (si aplica)     | ⚠️ Condicional | Al final | Sí        | Solo si hay equipos clasificados; formato bracket, emparejamientos aleatorios.                    |
| Ceremonia de Clausura         | ✅ Sí        | Último     | No        | **Sólo tras finalizar todo**, duración fija con entrega de premios.                                     |

---

## 🏁 Actividades por Categoría

| Actividad                            | Entry           | Development      | Professional     | Notas                                                                                  |
|--------------------------------------|-----------------|------------------|------------------|----------------------------------------------------------------------------------------|
| Registro y acreditación              | 5 min           | 5 min            | 5 min            | Primer día.                                                                             |
| Charla/Presentación inicial          | 20 min          | 20 min           | 20 min           | Tras último registro.                                                                  |
| Montaje Pit Display                  | 60 min          | 65 min           | 65 min           | Primer día, todos juntos.                                                             |
| Escrutinio                           | 20 min          | 20 min           | 25 min           | Antes de su primera carrera; en pit display (no en aula).                              |
| Evaluación Portfolio Técnico         | 10 min          | 15 min           | 15 min           | En pit display.                                                                        |
| Evaluación Portfolio de Empresa      | 15 min          | 10 min           | 10 min           | En pit display.                                                                        |
| Presentación verbal                  | 10 min          | 20 min           | 20 min           | Aula o escenario asignado.                                                            |
| Carreras clasificatorias             | 2 carreras      | 4–8 carreras     | 4–8 carreras     | **7 min** cada una; emparejadas aleatoriamente, dos equipos simultáneos por pista.     |
| Duración de cada carrera             | 7 min           | 7 min            | 7 min            | Aplicable a clasificatoria y eliminatoria.                                            |
| Eliminatorias finales (si aplican)    | —               | —                | —                | Mismo tiempo y pista única; horario reservado para todos los equipos.                 |
| Ceremonia de Clausura + premios      | 1 h 30 min      | 1 h 30 min       | 1 h 30 min       | Último día, tras finalizar eliminatorias y ceremonia de clausura general.              |

---

## ⏱️ Reglas Temporales

1. **Registro**:  
   - Se realiza **únicamente el primer día**, todos los equipos a lo largo de la ventana disponible.  
   - Varios equipos concurrentes según `personal_de_registro`.

2. **Charla/Presentación inicial**:  
   - 20 min tras el último registro del primer día.

3. **Ceremonia de Inauguración** y **Montaje Pit Display**:  
   - **Sólo primer día**, inmediatamente tras la charla inicial.

4. **Evaluaciones y Presentaciones**:  
   - Pueden solaparse entre sí (scrutiny, portfolios, verbal), hasta el límite de jueces disponibles por tipo.  
   - **Scrutiny** debe completarse **antes** de la primera carrera de cada equipo.

5. **Carreras clasificatorias**:  
   - Una pista → una carrera a la vez.  
   - Sólo dos equipos simultáneos, emparejados aleatoriamente pero siempre de la misma categoría.  
   - Cada equipo participa en un número configurable de carreras.

6. **Eliminatorias**:  
   - Horario **reservado** para todos los equipos desde el fin de clasificatorias, por si clasifican.  
   - Solo se ejecutan si hay suficientes equipos; emparejamientos aleatorios en bracket (8, 16 o 32).

7. **Ceremonia de Clausura + Premios**:  
   - Tras terminar todas las actividades y eliminatorias, último día.

8. **Ventanas horarias**:  
   - Generar slots con `rrule.js` en intervalos de 15 min, respetando **fechas y horarios de cada día**.  
   - Ejemplo:  
     - Día 1: 17/jun 16:00–19:00  
     - Día 2: 18/jun 09:00–18:00  
     - Día 3: 19/jun 09:00–14:00  

9. **Coherencia de Recursos**:  
   - No solapar eventos para el mismo equipo.  
   - No solapar carreras de diferentes categorías.  
   - Respetar disponibilidad de jueces (`JUDGES`) y personal de registro (`REGISTRATION_STAFF`).

---

## 📤 Inputs de la App

- Nº equipos **Entry**, **Development**, **Professional**  
- Nº jueces para:
  - Portfolio Técnico  
  - Portfolio de Empresa  
  - Presentación Verbal  
- Nº personal para registro  
- Nº carreras clasificatorias por equipo  
- Nº equipos que pasan a eliminatorias (8, 16 o 32)  
- Fechas y ventanas horarias válidas por día

---

## 📤 Outputs de la App

- **Excel por equipo** con su horario detallado  
- **Excel maestro** para la organización (todos los equipos juntos)  
- **Excel por juez** con su horario  
- **HTML visual** interactivo del horario

---

## 🧠 Lógica del Algoritmo

1. **Generar slots de tiempo** (15 min) con `rrule.js`, según ventanas de cada día.  
2. **Asignar** en orden:
   1. Registro (primer día, por turnos según personal).  
   2. Charla inicial (20 min).  
   3. Ceremonia de inauguración (todos).  
   4. Montaje del Pit Display (todos).  
3. **Reservar** en el calendario:
   - Slots para evaluaciones y presentaciones (concurrencia según jueces).  
   - Slots para **carreras clasificatorias** (pista única, emparejamientos por categoría).  
4. **Bloquear** la franja final para:
   - Carreras **eliminatorias** (si aplican).  
   - Ceremonia de clausura + premios.  
5. **Validar**:
   - Que no exista solapamiento para un mismo equipo.  
   - Que cada equipo tenga escrutinio completo antes de su primera carrera.  
   - Que carreras y eliminatorias respeten el orden lógico y la pista única.  
6. **Exportar** los horarios en los formatos solicitados.

---

## 🔄 Dependencias entre Eventos

- **Scrutiny** → debe preceder a la primera **carrera** de cada equipo.  
- **Carreras clasificatorias** → finalizadas antes de **eliminatorias**.  
- **Eliminatorias** → finalizadas antes de la **ceremonia de clausura**.  
- **Eventos globales** (registro, inauguración, montajes, clausura) → ejecutarse **una sola vez** en el momento indicado.
