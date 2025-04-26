import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO
import matplotlib.patches as mpatches

# 1) Copia exactamente la tabla que me proporcionaste entre las comillas de raw:
raw = """Equipo	Actividad	Duración (min)	Inicio	Fin
Equipo Development 1	Registro	5	07:00	07:05
Equipo Development 1	Charla/Presentación	20	07:55	08:15
Equipo Development 1	Ceremonia de Inauguración	20	08:15	08:35
Equipo Development 1	Escrutinio	20	08:35	08:55
Equipo Development 1	Presentación verbal	20	08:55	09:15
Equipo Development 1	Portfolio Técnico	15	09:15	09:30
Equipo Development 1	Portfolio de Empresa	15	09:30	09:45
Equipo Development 1	Montaje del Pit Display	65	09:50	10:55
Equipo Development 1	Carrera Clasificatoria 16	10	13:25	13:35
Equipo Development 1	Carrera Clasificatoria 31	10	15:55	16:05
Equipo Development 1	Carrera Clasificatoria 40	10	17:25	17:35
Equipo Development 1	Dieciseisavos de Final 1	10	18:55	19:05
Equipo Development 1	Dieciseisavos de Final 2	10	19:05	19:15
Equipo Development 1	Dieciseisavos de Final 3	10	19:15	19:25
Equipo Development 1	Dieciseisavos de Final 4	10	19:25	19:35
Equipo Development 1	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 1	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 1	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 1	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 1	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 1	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 1	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 1	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 1	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 1	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 1	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 1	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 1	Octavos de Final 1	10	09:00	09:10
Equipo Development 1	Octavos de Final 2	10	09:10	09:20
Equipo Development 1	Octavos de Final 3	10	09:20	09:30
Equipo Development 1	Octavos de Final 4	10	07:00	07:10
Equipo Development 1	Octavos de Final 5	10	07:10	07:20
Equipo Development 1	Octavos de Final 6	10	07:20	07:30
Equipo Development 1	Octavos de Final 7	10	07:30	07:40
Equipo Development 1	Octavos de Final 8	10	07:40	07:50
Equipo Development 1	Cuartos de Final 1	10	07:50	08:00
Equipo Development 1	Cuartos de Final 2	10	08:00	08:10
Equipo Development 1	Cuartos de Final 3	10	08:10	08:20
Equipo Development 1	Cuartos de Final 4	10	08:20	08:30
Equipo Development 1	Semifinal 1	10	08:30	08:40
Equipo Development 1	Semifinal 2	10	08:40	08:50
Equipo Development 1	Final 1	10	08:50	09:00
Equipo Development 1	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 2	Registro	5	07:00	07:05
Equipo Development 2	Charla/Presentación	20	07:55	08:15
Equipo Development 2	Ceremonia de Inauguración	20	08:15	08:35
Equipo Development 2	Escrutinio	20	08:35	08:55
Equipo Development 2	Presentación verbal	20	08:55	09:15
Equipo Development 2	Portfolio Técnico	15	09:15	09:30
Equipo Development 2	Portfolio de Empresa	15	09:30	09:45
Equipo Development 2	Montaje del Pit Display	65	09:50	10:55
Equipo Development 2	Carrera Clasificatoria 6	10	11:45	11:55
Equipo Development 2	Carrera Clasificatoria 30	10	15:45	15:55
Equipo Development 2	Carrera Clasificatoria 47	10	18:35	18:45
Equipo Development 2	Dieciseisavos de Final 1	10	18:55	19:05
Equipo Development 2	Dieciseisavos de Final 2	10	19:05	19:15
Equipo Development 2	Dieciseisavos de Final 3	10	19:15	19:25
Equipo Development 2	Dieciseisavos de Final 4	10	19:25	19:35
Equipo Development 2	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 2	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 2	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 2	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 2	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 2	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 2	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 2	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 2	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 2	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 2	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 2	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 2	Octavos de Final 1	10	09:00	09:10
Equipo Development 2	Octavos de Final 2	10	09:10	09:20
Equipo Development 2	Octavos de Final 3	10	09:20	09:30
Equipo Development 2	Octavos de Final 4	10	07:00	07:10
Equipo Development 2	Octavos de Final 5	10	07:10	07:20
Equipo Development 2	Octavos de Final 6	10	07:20	07:30
Equipo Development 2	Octavos de Final 7	10	07:30	07:40
Equipo Development 2	Octavos de Final 8	10	07:40	07:50
Equipo Development 2	Cuartos de Final 1	10	07:50	08:00
Equipo Development 2	Cuartos de Final 2	10	08:00	08:10
Equipo Development 2	Cuartos de Final 3	10	08:10	08:20
Equipo Development 2	Cuartos de Final 4	10	08:20	08:30
Equipo Development 2	Semifinal 1	10	08:30	08:40
Equipo Development 2	Semifinal 2	10	08:40	08:50
Equipo Development 2	Final 1	10	08:50	09:00
Equipo Development 2	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 3	Registro	5	07:00	07:05
Equipo Development 3	Charla/Presentación	20	07:55	08:15
Equipo Development 3	Ceremonia de Inauguración	20	08:15	08:35
Equipo Development 3	Escrutinio	20	08:35	08:55
Equipo Development 3	Presentación verbal	20	08:55	09:15
Equipo Development 3	Portfolio Técnico	15	09:15	09:30
Equipo Development 3	Portfolio de Empresa	15	09:30	09:45
Equipo Development 3	Montaje del Pit Display	65	09:50	10:55
Equipo Development 3	Carrera Clasificatoria 8	10	12:05	12:15
Equipo Development 3	Carrera Clasificatoria 26	10	15:05	15:15
Equipo Development 3	Carrera Clasificatoria 41	10	17:35	17:45
Equipo Development 3	Dieciseisavos de Final 1	10	18:55	19:05
Equipo Development 3	Dieciseisavos de Final 2	10	19:05	19:15
Equipo Development 3	Dieciseisavos de Final 3	10	19:15	19:25
Equipo Development 3	Dieciseisavos de Final 4	10	19:25	19:35
Equipo Development 3	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 3	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 3	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 3	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 3	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 3	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 3	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 3	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 3	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 3	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 3	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 3	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 3	Octavos de Final 1	10	09:00	09:10
Equipo Development 3	Octavos de Final 2	10	09:10	09:20
Equipo Development 3	Octavos de Final 3	10	09:20	09:30
Equipo Development 3	Octavos de Final 4	10	07:00	07:10
Equipo Development 3	Octavos de Final 5	10	07:10	07:20
Equipo Development 3	Octavos de Final 6	10	07:20	07:30
Equipo Development 3	Octavos de Final 7	10	07:30	07:40
Equipo Development 3	Octavos de Final 8	10	07:40	07:50
Equipo Development 3	Cuartos de Final 1	10	07:50	08:00
Equipo Development 3	Cuartos de Final 2	10	08:00	08:10
Equipo Development 3	Cuartos de Final 3	10	08:10	08:20
Equipo Development 3	Cuartos de Final 4	10	08:20	08:30
Equipo Development 3	Semifinal 1	10	08:30	08:40
Equipo Development 3	Semifinal 2	10	08:40	08:50
Equipo Development 3	Final 1	10	08:50	09:00
Equipo Development 3	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 4	Registro	5	07:00	07:05
Equipo Development 4	Charla/Presentación	20	07:50	08:10
Equipo Development 4	Ceremonia de Inauguración	20	08:10	08:30
Equipo Development 4	Escrutinio	20	08:30	08:50
Equipo Development 4	Presentación verbal	20	08:50	09:10
Equipo Development 4	Portfolio Técnico	15	09:10	09:25
Equipo Development 4	Portfolio de Empresa	15	09:25	09:40
Equipo Development 4	Montaje del Pit Display	65	09:45	10:50
Equipo Development 4	Carrera Clasificatoria 15	10	13:10	13:20
Equipo Development 4	Carrera Clasificatoria 32	10	16:00	16:10
Equipo Development 4	Carrera Clasificatoria 42	10	17:40	17:50
Equipo Development 4	Dieciseisavos de Final 1	10	18:50	19:00
Equipo Development 4	Dieciseisavos de Final 2	10	19:00	19:10
Equipo Development 4	Dieciseisavos de Final 3	10	19:10	19:20
Equipo Development 4	Dieciseisavos de Final 4	10	19:20	19:30
Equipo Development 4	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 4	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 4	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 4	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 4	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 4	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 4	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 4	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 4	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 4	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 4	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 4	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 4	Octavos de Final 1	10	09:00	09:10
Equipo Development 4	Octavos de Final 2	10	09:10	09:20
Equipo Development 4	Octavos de Final 3	10	09:20	09:30
Equipo Development 4	Octavos de Final 4	10	07:00	07:10
Equipo Development 4	Octavos de Final 5	10	07:10	07:20
Equipo Development 4	Octavos de Final 6	10	07:20	07:30
Equipo Development 4	Octavos de Final 7	10	07:30	07:40
Equipo Development 4	Octavos de Final 8	10	07:40	07:50
Equipo Development 4	Cuartos de Final 1	10	07:50	08:00
Equipo Development 4	Cuartos de Final 2	10	08:00	08:10
Equipo Development 4	Cuartos de Final 3	10	08:10	08:20
Equipo Development 4	Cuartos de Final 4	10	08:20	08:30
Equipo Development 4	Semifinal 1	10	08:30	08:40
Equipo Development 4	Semifinal 2	10	08:40	08:50
Equipo Development 4	Final 1	10	08:50	09:00
Equipo Development 4	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 5	Registro	5	07:00	07:05
Equipo Development 5	Charla/Presentación	20	07:50	08:10
Equipo Development 5	Ceremonia de Inauguración	20	08:10	08:30
Equipo Development 5	Escrutinio	20	08:30	08:50
Equipo Development 5	Presentación verbal	20	08:50	09:10
Equipo Development 5	Portfolio Técnico	15	09:10	09:25
Equipo Development 5	Portfolio de Empresa	15	09:25	09:40
Equipo Development 5	Montaje del Pit Display	65	09:45	10:50
Equipo Development 5	Carrera Clasificatoria 6	10	11:40	11:50
Equipo Development 5	Carrera Clasificatoria 21	10	14:10	14:20
Equipo Development 5	Carrera Clasificatoria 38	10	17:00	17:10
Equipo Development 5	Dieciseisavos de Final 1	10	18:50	19:00
Equipo Development 5	Dieciseisavos de Final 2	10	19:00	19:10
Equipo Development 5	Dieciseisavos de Final 3	10	19:10	19:20
Equipo Development 5	Dieciseisavos de Final 4	10	19:20	19:30
Equipo Development 5	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 5	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 5	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 5	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 5	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 5	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 5	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 5	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 5	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 5	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 5	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 5	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 5	Octavos de Final 1	10	09:00	09:10
Equipo Development 5	Octavos de Final 2	10	09:10	09:20
Equipo Development 5	Octavos de Final 3	10	09:20	09:30
Equipo Development 5	Octavos de Final 4	10	07:00	07:10
Equipo Development 5	Octavos de Final 5	10	07:10	07:20
Equipo Development 5	Octavos de Final 6	10	07:20	07:30
Equipo Development 5	Octavos de Final 7	10	07:30	07:40
Equipo Development 5	Octavos de Final 8	10	07:40	07:50
Equipo Development 5	Cuartos de Final 1	10	07:50	08:00
Equipo Development 5	Cuartos de Final 2	10	08:00	08:10
Equipo Development 5	Cuartos de Final 3	10	08:10	08:20
Equipo Development 5	Cuartos de Final 4	10	08:20	08:30
Equipo Development 5	Semifinal 1	10	08:30	08:40
Equipo Development 5	Semifinal 2	10	08:40	08:50
Equipo Development 5	Final 1	10	08:50	09:00
Equipo Development 5	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 6	Registro	5	07:00	07:05
Equipo Development 6	Charla/Presentación	20	07:50	08:10
Equipo Development 6	Ceremonia de Inauguración	20	08:10	08:30
Equipo Development 6	Escrutinio	20	08:30	08:50
Equipo Development 6	Presentación verbal	20	08:50	09:10
Equipo Development 6	Portfolio Técnico	15	09:10	09:25
Equipo Development 6	Portfolio de Empresa	15	09:25	09:40
Equipo Development 6	Montaje del Pit Display	65	09:45	10:50
Equipo Development 6	Carrera Clasificatoria 3	10	11:10	11:20
Equipo Development 6	Carrera Clasificatoria 29	10	15:30	15:40
Equipo Development 6	Carrera Clasificatoria 33	10	16:10	16:20
Equipo Development 6	Dieciseisavos de Final 1	10	18:50	19:00
Equipo Development 6	Dieciseisavos de Final 2	10	19:00	19:10
Equipo Development 6	Dieciseisavos de Final 3	10	19:10	19:20
Equipo Development 6	Dieciseisavos de Final 4	10	19:20	19:30
Equipo Development 6	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 6	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 6	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 6	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 6	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 6	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 6	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 6	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 6	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 6	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 6	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 6	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 6	Octavos de Final 1	10	09:00	09:10
Equipo Development 6	Octavos de Final 2	10	09:10	09:20
Equipo Development 6	Octavos de Final 3	10	09:20	09:30
Equipo Development 6	Octavos de Final 4	10	07:00	07:10
Equipo Development 6	Octavos de Final 5	10	07:10	07:20
Equipo Development 6	Octavos de Final 6	10	07:20	07:30
Equipo Development 6	Octavos de Final 7	10	07:30	07:40
Equipo Development 6	Octavos de Final 8	10	07:40	07:50
Equipo Development 6	Cuartos de Final 1	10	07:50	08:00
Equipo Development 6	Cuartos de Final 2	10	08:00	08:10
Equipo Development 6	Cuartos de Final 3	10	08:10	08:20
Equipo Development 6	Cuartos de Final 4	10	08:20	08:30
Equipo Development 6	Semifinal 1	10	08:30	08:40
Equipo Development 6	Semifinal 2	10	08:40	08:50
Equipo Development 6	Final 1	10	08:50	09:00
Equipo Development 6	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 7	Registro	5	07:00	07:05
Equipo Development 7	Charla/Presentación	20	07:45	08:05
Equipo Development 7	Ceremonia de Inauguración	20	08:05	08:25
Equipo Development 7	Escrutinio	20	08:25	08:45
Equipo Development 7	Presentación verbal	20	08:45	09:05
Equipo Development 7	Portfolio Técnico	15	09:05	09:20
Equipo Development 7	Portfolio de Empresa	15	09:20	09:35
Equipo Development 7	Montaje del Pit Display	65	09:40	10:45
Equipo Development 7	Carrera Clasificatoria 11	10	12:25	12:35
Equipo Development 7	Carrera Clasificatoria 19	10	13:45	13:55
Equipo Development 7	Carrera Clasificatoria 35	10	16:25	16:35
Equipo Development 7	Dieciseisavos de Final 1	10	18:45	18:55
Equipo Development 7	Dieciseisavos de Final 2	10	18:55	19:05
Equipo Development 7	Dieciseisavos de Final 3	10	19:05	19:15
Equipo Development 7	Dieciseisavos de Final 4	10	19:15	19:25
Equipo Development 7	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 7	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 7	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 7	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 7	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 7	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 7	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 7	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 7	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 7	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 7	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 7	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 7	Octavos de Final 1	10	09:00	09:10
Equipo Development 7	Octavos de Final 2	10	09:10	09:20
Equipo Development 7	Octavos de Final 3	10	09:20	09:30
Equipo Development 7	Octavos de Final 4	10	07:00	07:10
Equipo Development 7	Octavos de Final 5	10	07:10	07:20
Equipo Development 7	Octavos de Final 6	10	07:20	07:30
Equipo Development 7	Octavos de Final 7	10	07:30	07:40
Equipo Development 7	Octavos de Final 8	10	07:40	07:50
Equipo Development 7	Cuartos de Final 1	10	07:50	08:00
Equipo Development 7	Cuartos de Final 2	10	08:00	08:10
Equipo Development 7	Cuartos de Final 3	10	08:10	08:20
Equipo Development 7	Cuartos de Final 4	10	08:20	08:30
Equipo Development 7	Semifinal 1	10	08:30	08:40
Equipo Development 7	Semifinal 2	10	08:40	08:50
Equipo Development 7	Final 1	10	08:50	09:00
Equipo Development 7	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 8	Registro	5	07:00	07:05
Equipo Development 8	Charla/Presentación	20	07:45	08:05
Equipo Development 8	Ceremonia de Inauguración	20	08:05	08:25
Equipo Development 8	Escrutinio	20	08:25	08:45
Equipo Development 8	Presentación verbal	20	08:45	09:05
Equipo Development 8	Portfolio Técnico	15	09:05	09:20
Equipo Development 8	Portfolio de Empresa	15	09:20	09:35
Equipo Development 8	Montaje del Pit Display	65	09:40	10:45
Equipo Development 8	Carrera Clasificatoria 9	10	12:05	12:15
Equipo Development 8	Carrera Clasificatoria 25	10	14:45	14:55
Equipo Development 8	Carrera Clasificatoria 47	10	18:25	18:35
Equipo Development 8	Dieciseisavos de Final 1	10	18:45	18:55
Equipo Development 8	Dieciseisavos de Final 2	10	18:55	19:05
Equipo Development 8	Dieciseisavos de Final 3	10	19:05	19:15
Equipo Development 8	Dieciseisavos de Final 4	10	19:15	19:25
Equipo Development 8	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 8	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 8	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 8	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 8	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 8	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 8	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 8	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 8	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 8	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 8	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 8	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 8	Octavos de Final 1	10	09:00	09:10
Equipo Development 8	Octavos de Final 2	10	09:10	09:20
Equipo Development 8	Octavos de Final 3	10	09:20	09:30
Equipo Development 8	Octavos de Final 4	10	07:00	07:10
Equipo Development 8	Octavos de Final 5	10	07:10	07:20
Equipo Development 8	Octavos de Final 6	10	07:20	07:30
Equipo Development 8	Octavos de Final 7	10	07:30	07:40
Equipo Development 8	Octavos de Final 8	10	07:40	07:50
Equipo Development 8	Cuartos de Final 1	10	07:50	08:00
Equipo Development 8	Cuartos de Final 2	10	08:00	08:10
Equipo Development 8	Cuartos de Final 3	10	08:10	08:20
Equipo Development 8	Cuartos de Final 4	10	08:20	08:30
Equipo Development 8	Semifinal 1	10	08:30	08:40
Equipo Development 8	Semifinal 2	10	08:40	08:50
Equipo Development 8	Final 1	10	08:50	09:00
Equipo Development 8	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 9	Registro	5	07:00	07:05
Equipo Development 9	Charla/Presentación	20	07:45	08:05
Equipo Development 9	Ceremonia de Inauguración	20	08:05	08:25
Equipo Development 9	Escrutinio	20	08:25	08:45
Equipo Development 9	Presentación verbal	20	08:45	09:05
Equipo Development 9	Portfolio Técnico	15	09:05	09:20
Equipo Development 9	Portfolio de Empresa	15	09:20	09:35
Equipo Development 9	Montaje del Pit Display	65	09:40	10:45
Equipo Development 9	Carrera Clasificatoria 12	10	12:35	12:45
Equipo Development 9	Carrera Clasificatoria 18	10	13:35	13:45
Equipo Development 9	Carrera Clasificatoria 36	10	16:35	16:45
Equipo Development 9	Dieciseisavos de Final 1	10	18:45	18:55
Equipo Development 9	Dieciseisavos de Final 2	10	18:55	19:05
Equipo Development 9	Dieciseisavos de Final 3	10	19:05	19:15
Equipo Development 9	Dieciseisavos de Final 4	10	19:15	19:25
Equipo Development 9	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 9	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 9	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 9	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 9	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 9	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 9	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 9	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 9	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 9	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 9	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 9	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 9	Octavos de Final 1	10	09:00	09:10
Equipo Development 9	Octavos de Final 2	10	09:10	09:20
Equipo Development 9	Octavos de Final 3	10	09:20	09:30
Equipo Development 9	Octavos de Final 4	10	07:00	07:10
Equipo Development 9	Octavos de Final 5	10	07:10	07:20
Equipo Development 9	Octavos de Final 6	10	07:20	07:30
Equipo Development 9	Octavos de Final 7	10	07:30	07:40
Equipo Development 9	Octavos de Final 8	10	07:40	07:50
Equipo Development 9	Cuartos de Final 1	10	07:50	08:00
Equipo Development 9	Cuartos de Final 2	10	08:00	08:10
Equipo Development 9	Cuartos de Final 3	10	08:10	08:20
Equipo Development 9	Cuartos de Final 4	10	08:20	08:30
Equipo Development 9	Semifinal 1	10	08:30	08:40
Equipo Development 9	Semifinal 2	10	08:40	08:50
Equipo Development 9	Final 1	10	08:50	09:00
Equipo Development 9	Ceremonia de Clausura	90	09:00	10:30
Equipo Development 10	Registro	5	07:00	07:05
Equipo Development 10	Charla/Presentación	20	07:40	08:00
Equipo Development 10	Ceremonia de Inauguración	20	08:00	08:20
Equipo Development 10	Escrutinio	20	08:20	08:40
Equipo Development 10	Presentación verbal	20	08:40	09:00
Equipo Development 10	Portfolio Técnico	15	09:00	09:15
Equipo Development 10	Portfolio de Empresa	15	09:15	09:30
Equipo Development 10	Montaje del Pit Display	65	09:35	10:40
Equipo Development 10	Carrera Clasificatoria 11	10	12:20	12:30
Equipo Development 10	Carrera Clasificatoria 26	10	14:50	15:00
Equipo Development 10	Carrera Clasificatoria 37	10	16:40	16:50
Equipo Development 10	Dieciseisavos de Final 1	10	18:40	18:50
Equipo Development 10	Dieciseisavos de Final 2	10	18:50	19:00
Equipo Development 10	Dieciseisavos de Final 3	10	19:00	19:10
Equipo Development 10	Dieciseisavos de Final 4	10	19:10	19:20
Equipo Development 10	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Development 10	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Development 10	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Development 10	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Development 10	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Development 10	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Development 10	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Development 10	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Development 10	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Development 10	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Development 10	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Development 10	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Development 10	Octavos de Final 1	10	09:00	09:10
Equipo Development 10	Octavos de Final 2	10	09:10	09:20
Equipo Development 10	Octavos de Final 3	10	09:20	09:30
Equipo Development 10	Octavos de Final 4	10	07:00	07:10
Equipo Development 10	Octavos de Final 5	10	07:10	07:20
Equipo Development 10	Octavos de Final 6	10	07:20	07:30
Equipo Development 10	Octavos de Final 7	10	07:30	07:40
Equipo Development 10	Octavos de Final 8	10	07:40	07:50
Equipo Development 10	Cuartos de Final 1	10	07:50	08:00
Equipo Development 10	Cuartos de Final 2	10	08:00	08:10
Equipo Development 10	Cuartos de Final 3	10	08:10	08:20
Equipo Development 10	Cuartos de Final 4	10	08:20	08:30
Equipo Development 10	Semifinal 1	10	08:30	08:40
Equipo Development 10	Semifinal 2	10	08:40	08:50
Equipo Development 10	Final 1	10	08:50	09:00
Equipo Development 10	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 1	Registro	5	07:00	07:05
Equipo Professional 1	Charla/Presentación	20	07:40	08:00
Equipo Professional 1	Ceremonia de Inauguración	20	08:00	08:20
Equipo Professional 1	Escrutinio	25	08:20	08:45
Equipo Professional 1	Presentación verbal	20	08:45	09:05
Equipo Professional 1	Portfolio Técnico	15	09:05	09:20
Equipo Professional 1	Portfolio de Empresa	15	09:20	09:35
Equipo Professional 1	Montaje del Pit Display	65	09:35	10:40
Equipo Professional 1	Carrera Clasificatoria 16	10	13:10	13:20
Equipo Professional 1	Carrera Clasificatoria 27	10	15:00	15:10
Equipo Professional 1	Carrera Clasificatoria 48	10	18:30	18:40
Equipo Professional 1	Dieciseisavos de Final 1	10	18:40	18:50
Equipo Professional 1	Dieciseisavos de Final 2	10	18:50	19:00
Equipo Professional 1	Dieciseisavos de Final 3	10	19:00	19:10
Equipo Professional 1	Dieciseisavos de Final 4	10	19:10	19:20
Equipo Professional 1	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 1	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 1	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 1	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 1	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 1	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 1	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 1	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 1	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 1	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 1	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 1	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 1	Octavos de Final 1	10	09:00	09:10
Equipo Professional 1	Octavos de Final 2	10	09:10	09:20
Equipo Professional 1	Octavos de Final 3	10	09:20	09:30
Equipo Professional 1	Octavos de Final 4	10	07:00	07:10
Equipo Professional 1	Octavos de Final 5	10	07:10	07:20
Equipo Professional 1	Octavos de Final 6	10	07:20	07:30
Equipo Professional 1	Octavos de Final 7	10	07:30	07:40
Equipo Professional 1	Octavos de Final 8	10	07:40	07:50
Equipo Professional 1	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 1	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 1	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 1	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 1	Semifinal 1	10	08:30	08:40
Equipo Professional 1	Semifinal 2	10	08:40	08:50
Equipo Professional 1	Final 1	10	08:50	09:00
Equipo Professional 1	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 2	Registro	5	07:00	07:05
Equipo Professional 2	Charla/Presentación	20	07:40	08:00
Equipo Professional 2	Ceremonia de Inauguración	20	08:00	08:20
Equipo Professional 2	Escrutinio	25	08:20	08:45
Equipo Professional 2	Presentación verbal	20	08:45	09:05
Equipo Professional 2	Portfolio Técnico	15	09:05	09:20
Equipo Professional 2	Portfolio de Empresa	15	09:20	09:35
Equipo Professional 2	Montaje del Pit Display	65	09:35	10:40
Equipo Professional 2	Carrera Clasificatoria 8	10	11:50	12:00
Equipo Professional 2	Carrera Clasificatoria 31	10	15:40	15:50
Equipo Professional 2	Carrera Clasificatoria 46	10	18:10	18:20
Equipo Professional 2	Dieciseisavos de Final 1	10	18:40	18:50
Equipo Professional 2	Dieciseisavos de Final 2	10	18:50	19:00
Equipo Professional 2	Dieciseisavos de Final 3	10	19:00	19:10
Equipo Professional 2	Dieciseisavos de Final 4	10	19:10	19:20
Equipo Professional 2	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 2	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 2	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 2	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 2	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 2	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 2	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 2	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 2	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 2	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 2	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 2	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 2	Octavos de Final 1	10	09:00	09:10
Equipo Professional 2	Octavos de Final 2	10	09:10	09:20
Equipo Professional 2	Octavos de Final 3	10	09:20	09:30
Equipo Professional 2	Octavos de Final 4	10	07:00	07:10
Equipo Professional 2	Octavos de Final 5	10	07:10	07:20
Equipo Professional 2	Octavos de Final 6	10	07:20	07:30
Equipo Professional 2	Octavos de Final 7	10	07:30	07:40
Equipo Professional 2	Octavos de Final 8	10	07:40	07:50
Equipo Professional 2	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 2	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 2	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 2	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 2	Semifinal 1	10	08:30	08:40
Equipo Professional 2	Semifinal 2	10	08:40	08:50
Equipo Professional 2	Final 1	10	08:50	09:00
Equipo Professional 2	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 3	Registro	5	07:00	07:05
Equipo Professional 3	Charla/Presentación	20	07:35	07:55
Equipo Professional 3	Ceremonia de Inauguración	20	07:55	08:15
Equipo Professional 3	Escrutinio	25	08:15	08:40
Equipo Professional 3	Presentación verbal	20	08:40	09:00
Equipo Professional 3	Portfolio Técnico	15	09:00	09:15
Equipo Professional 3	Portfolio de Empresa	15	09:15	09:30
Equipo Professional 3	Montaje del Pit Display	65	09:30	10:35
Equipo Professional 3	Carrera Clasificatoria 15	10	12:55	13:05
Equipo Professional 3	Carrera Clasificatoria 17	10	13:15	13:25
Equipo Professional 3	Carrera Clasificatoria 45	10	17:55	18:05
Equipo Professional 3	Dieciseisavos de Final 1	10	18:35	18:45
Equipo Professional 3	Dieciseisavos de Final 2	10	18:45	18:55
Equipo Professional 3	Dieciseisavos de Final 3	10	18:55	19:05
Equipo Professional 3	Dieciseisavos de Final 4	10	19:05	19:15
Equipo Professional 3	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 3	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 3	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 3	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 3	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 3	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 3	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 3	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 3	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 3	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 3	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 3	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 3	Octavos de Final 1	10	09:00	09:10
Equipo Professional 3	Octavos de Final 2	10	09:10	09:20
Equipo Professional 3	Octavos de Final 3	10	09:20	09:30
Equipo Professional 3	Octavos de Final 4	10	07:00	07:10
Equipo Professional 3	Octavos de Final 5	10	07:10	07:20
Equipo Professional 3	Octavos de Final 6	10	07:20	07:30
Equipo Professional 3	Octavos de Final 7	10	07:30	07:40
Equipo Professional 3	Octavos de Final 8	10	07:40	07:50
Equipo Professional 3	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 3	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 3	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 3	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 3	Semifinal 1	10	08:30	08:40
Equipo Professional 3	Semifinal 2	10	08:40	08:50
Equipo Professional 3	Final 1	10	08:50	09:00
Equipo Professional 3	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 4	Registro	5	07:00	07:05
Equipo Professional 4	Charla/Presentación	20	07:35	07:55
Equipo Professional 4	Ceremonia de Inauguración	20	07:55	08:15
Equipo Professional 4	Escrutinio	25	08:15	08:40
Equipo Professional 4	Presentación verbal	20	08:40	09:00
Equipo Professional 4	Portfolio Técnico	15	09:00	09:15
Equipo Professional 4	Portfolio de Empresa	15	09:15	09:30
Equipo Professional 4	Montaje del Pit Display	65	09:30	10:35
Equipo Professional 4	Carrera Clasificatoria 5	10	11:15	11:25
Equipo Professional 4	Carrera Clasificatoria 30	10	15:25	15:35
Equipo Professional 4	Carrera Clasificatoria 44	10	17:45	17:55
Equipo Professional 4	Dieciseisavos de Final 1	10	18:35	18:45
Equipo Professional 4	Dieciseisavos de Final 2	10	18:45	18:55
Equipo Professional 4	Dieciseisavos de Final 3	10	18:55	19:05
Equipo Professional 4	Dieciseisavos de Final 4	10	19:05	19:15
Equipo Professional 4	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 4	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 4	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 4	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 4	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 4	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 4	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 4	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 4	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 4	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 4	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 4	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 4	Octavos de Final 1	10	09:00	09:10
Equipo Professional 4	Octavos de Final 2	10	09:10	09:20
Equipo Professional 4	Octavos de Final 3	10	09:20	09:30
Equipo Professional 4	Octavos de Final 4	10	07:00	07:10
Equipo Professional 4	Octavos de Final 5	10	07:10	07:20
Equipo Professional 4	Octavos de Final 6	10	07:20	07:30
Equipo Professional 4	Octavos de Final 7	10	07:30	07:40
Equipo Professional 4	Octavos de Final 8	10	07:40	07:50
Equipo Professional 4	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 4	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 4	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 4	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 4	Semifinal 1	10	08:30	08:40
Equipo Professional 4	Semifinal 2	10	08:40	08:50
Equipo Professional 4	Final 1	10	08:50	09:00
Equipo Professional 4	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 5	Registro	5	07:00	07:05
Equipo Professional 5	Charla/Presentación	20	07:35	07:55
Equipo Professional 5	Ceremonia de Inauguración	20	07:55	08:15
Equipo Professional 5	Escrutinio	25	08:15	08:40
Equipo Professional 5	Presentación verbal	20	08:40	09:00
Equipo Professional 5	Portfolio Técnico	15	09:00	09:15
Equipo Professional 5	Portfolio de Empresa	15	09:15	09:30
Equipo Professional 5	Montaje del Pit Display	65	09:30	10:35
Equipo Professional 5	Carrera Clasificatoria 7	10	11:35	11:45
Equipo Professional 5	Carrera Clasificatoria 23	10	14:15	14:25
Equipo Professional 5	Carrera Clasificatoria 39	10	16:55	17:05
Equipo Professional 5	Dieciseisavos de Final 1	10	18:35	18:45
Equipo Professional 5	Dieciseisavos de Final 2	10	18:45	18:55
Equipo Professional 5	Dieciseisavos de Final 3	10	18:55	19:05
Equipo Professional 5	Dieciseisavos de Final 4	10	19:05	19:15
Equipo Professional 5	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 5	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 5	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 5	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 5	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 5	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 5	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 5	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 5	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 5	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 5	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 5	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 5	Octavos de Final 1	10	09:00	09:10
Equipo Professional 5	Octavos de Final 2	10	09:10	09:20
Equipo Professional 5	Octavos de Final 3	10	09:20	09:30
Equipo Professional 5	Octavos de Final 4	10	07:00	07:10
Equipo Professional 5	Octavos de Final 5	10	07:10	07:20
Equipo Professional 5	Octavos de Final 6	10	07:20	07:30
Equipo Professional 5	Octavos de Final 7	10	07:30	07:40
Equipo Professional 5	Octavos de Final 8	10	07:40	07:50
Equipo Professional 5	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 5	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 5	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 5	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 5	Semifinal 1	10	08:30	08:40
Equipo Professional 5	Semifinal 2	10	08:40	08:50
Equipo Professional 5	Final 1	10	08:50	09:00
Equipo Professional 5	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 6	Registro	5	07:00	07:05
Equipo Professional 6	Charla/Presentación	20	07:30	07:50
Equipo Professional 6	Ceremonia de Inauguración	20	07:50	08:10
Equipo Professional 6	Escrutinio	25	08:10	08:35
Equipo Professional 6	Presentación verbal	20	08:35	08:55
Equipo Professional 6	Portfolio Técnico	15	08:55	09:10
Equipo Professional 6	Portfolio de Empresa	15	09:10	09:25
Equipo Professional 6	Montaje del Pit Display	65	09:25	10:30
Equipo Professional 6	Carrera Clasificatoria 9	10	11:50	12:00
Equipo Professional 6	Carrera Clasificatoria 24	10	14:20	14:30
Equipo Professional 6	Carrera Clasificatoria 34	10	16:00	16:10
Equipo Professional 6	Dieciseisavos de Final 1	10	18:30	18:40
Equipo Professional 6	Dieciseisavos de Final 2	10	18:40	18:50
Equipo Professional 6	Dieciseisavos de Final 3	10	18:50	19:00
Equipo Professional 6	Dieciseisavos de Final 4	10	19:00	19:10
Equipo Professional 6	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 6	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 6	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 6	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 6	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 6	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 6	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 6	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 6	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 6	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 6	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 6	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 6	Octavos de Final 1	10	09:00	09:10
Equipo Professional 6	Octavos de Final 2	10	09:10	09:20
Equipo Professional 6	Octavos de Final 3	10	09:20	09:30
Equipo Professional 6	Octavos de Final 4	10	07:00	07:10
Equipo Professional 6	Octavos de Final 5	10	07:10	07:20
Equipo Professional 6	Octavos de Final 6	10	07:20	07:30
Equipo Professional 6	Octavos de Final 7	10	07:30	07:40
Equipo Professional 6	Octavos de Final 8	10	07:40	07:50
Equipo Professional 6	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 6	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 6	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 6	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 6	Semifinal 1	10	08:30	08:40
Equipo Professional 6	Semifinal 2	10	08:40	08:50
Equipo Professional 6	Final 1	10	08:50	09:00
Equipo Professional 6	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 7	Registro	5	07:00	07:05
Equipo Professional 7	Charla/Presentación	20	07:30	07:50
Equipo Professional 7	Ceremonia de Inauguración	20	07:50	08:10
Equipo Professional 7	Escrutinio	25	08:10	08:35
Equipo Professional 7	Presentación verbal	20	08:35	08:55
Equipo Professional 7	Portfolio Técnico	15	08:55	09:10
Equipo Professional 7	Portfolio de Empresa	15	09:10	09:25
Equipo Professional 7	Montaje del Pit Display	65	09:25	10:30
Equipo Professional 7	Carrera Clasificatoria 10	10	12:00	12:10
Equipo Professional 7	Carrera Clasificatoria 20	10	13:40	13:50
Equipo Professional 7	Carrera Clasificatoria 42	10	17:20	17:30
Equipo Professional 7	Dieciseisavos de Final 1	10	18:30	18:40
Equipo Professional 7	Dieciseisavos de Final 2	10	18:40	18:50
Equipo Professional 7	Dieciseisavos de Final 3	10	18:50	19:00
Equipo Professional 7	Dieciseisavos de Final 4	10	19:00	19:10
Equipo Professional 7	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 7	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 7	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 7	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 7	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 7	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 7	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 7	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 7	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 7	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 7	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 7	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 7	Octavos de Final 1	10	09:00	09:10
Equipo Professional 7	Octavos de Final 2	10	09:10	09:20
Equipo Professional 7	Octavos de Final 3	10	09:20	09:30
Equipo Professional 7	Octavos de Final 4	10	07:00	07:10
Equipo Professional 7	Octavos de Final 5	10	07:10	07:20
Equipo Professional 7	Octavos de Final 6	10	07:20	07:30
Equipo Professional 7	Octavos de Final 7	10	07:30	07:40
Equipo Professional 7	Octavos de Final 8	10	07:40	07:50
Equipo Professional 7	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 7	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 7	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 7	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 7	Semifinal 1	10	08:30	08:40
Equipo Professional 7	Semifinal 2	10	08:40	08:50
Equipo Professional 7	Final 1	10	08:50	09:00
Equipo Professional 7	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 8	Registro	5	07:00	07:05
Equipo Professional 8	Charla/Presentación	20	07:30	07:50
Equipo Professional 8	Ceremonia de Inauguración	20	07:50	08:10
Equipo Professional 8	Escrutinio	25	08:10	08:35
Equipo Professional 8	Presentación verbal	20	08:35	08:55
Equipo Professional 8	Portfolio Técnico	15	08:55	09:10
Equipo Professional 8	Portfolio de Empresa	15	09:10	09:25
Equipo Professional 8	Montaje del Pit Display	65	09:25	10:30
Equipo Professional 8	Carrera Clasificatoria 10	10	12:00	12:10
Equipo Professional 8	Carrera Clasificatoria 24	10	14:20	14:30
Equipo Professional 8	Carrera Clasificatoria 43	10	17:30	17:40
Equipo Professional 8	Dieciseisavos de Final 1	10	18:30	18:40
Equipo Professional 8	Dieciseisavos de Final 2	10	18:40	18:50
Equipo Professional 8	Dieciseisavos de Final 3	10	18:50	19:00
Equipo Professional 8	Dieciseisavos de Final 4	10	19:00	19:10
Equipo Professional 8	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 8	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 8	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 8	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 8	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 8	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 8	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 8	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 8	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 8	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 8	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 8	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 8	Octavos de Final 1	10	09:00	09:10
Equipo Professional 8	Octavos de Final 2	10	09:10	09:20
Equipo Professional 8	Octavos de Final 3	10	09:20	09:30
Equipo Professional 8	Octavos de Final 4	10	07:00	07:10
Equipo Professional 8	Octavos de Final 5	10	07:10	07:20
Equipo Professional 8	Octavos de Final 6	10	07:20	07:30
Equipo Professional 8	Octavos de Final 7	10	07:30	07:40
Equipo Professional 8	Octavos de Final 8	10	07:40	07:50
Equipo Professional 8	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 8	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 8	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 8	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 8	Semifinal 1	10	08:30	08:40
Equipo Professional 8	Semifinal 2	10	08:40	08:50
Equipo Professional 8	Final 1	10	08:50	09:00
Equipo Professional 8	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 9	Registro	5	07:00	07:05
Equipo Professional 9	Charla/Presentación	20	07:25	07:45
Equipo Professional 9	Ceremonia de Inauguración	20	07:45	08:05
Equipo Professional 9	Escrutinio	25	08:05	08:30
Equipo Professional 9	Presentación verbal	20	08:30	08:50
Equipo Professional 9	Portfolio Técnico	15	08:50	09:05
Equipo Professional 9	Portfolio de Empresa	15	09:05	09:20
Equipo Professional 9	Montaje del Pit Display	65	09:20	10:25
Equipo Professional 9	Carrera Clasificatoria 13	10	12:25	12:35
Equipo Professional 9	Carrera Clasificatoria 18	10	13:15	13:25
Equipo Professional 9	Carrera Clasificatoria 38	10	16:35	16:45
Equipo Professional 9	Dieciseisavos de Final 1	10	18:25	18:35
Equipo Professional 9	Dieciseisavos de Final 2	10	18:35	18:45
Equipo Professional 9	Dieciseisavos de Final 3	10	18:45	18:55
Equipo Professional 9	Dieciseisavos de Final 4	10	18:55	19:05
Equipo Professional 9	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 9	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 9	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 9	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 9	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 9	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 9	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 9	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 9	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 9	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 9	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 9	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 9	Octavos de Final 1	10	09:00	09:10
Equipo Professional 9	Octavos de Final 2	10	09:10	09:20
Equipo Professional 9	Octavos de Final 3	10	09:20	09:30
Equipo Professional 9	Octavos de Final 4	10	07:00	07:10
Equipo Professional 9	Octavos de Final 5	10	07:10	07:20
Equipo Professional 9	Octavos de Final 6	10	07:20	07:30
Equipo Professional 9	Octavos de Final 7	10	07:30	07:40
Equipo Professional 9	Octavos de Final 8	10	07:40	07:50
Equipo Professional 9	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 9	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 9	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 9	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 9	Semifinal 1	10	08:30	08:40
Equipo Professional 9	Semifinal 2	10	08:40	08:50
Equipo Professional 9	Final 1	10	08:50	09:00
Equipo Professional 9	Ceremonia de Clausura	90	09:00	10:30
Equipo Professional 10	Registro	5	07:00	07:05
Equipo Professional 10	Charla/Presentación	20	07:25	07:45
Equipo Professional 10	Ceremonia de Inauguración	20	07:45	08:05
Equipo Professional 10	Escrutinio	25	08:05	08:30
Equipo Professional 10	Presentación verbal	20	08:30	08:50
Equipo Professional 10	Portfolio Técnico	15	08:50	09:05
Equipo Professional 10	Portfolio de Empresa	15	09:05	09:20
Equipo Professional 10	Montaje del Pit Display	65	09:20	10:25
Equipo Professional 10	Carrera Clasificatoria 1	10	10:25	10:35
Equipo Professional 10	Carrera Clasificatoria 23	10	14:05	14:15
Equipo Professional 10	Carrera Clasificatoria 44	10	17:35	17:45
Equipo Professional 10	Dieciseisavos de Final 1	10	18:25	18:35
Equipo Professional 10	Dieciseisavos de Final 2	10	18:35	18:45
Equipo Professional 10	Dieciseisavos de Final 3	10	18:45	18:55
Equipo Professional 10	Dieciseisavos de Final 4	10	18:55	19:05
Equipo Professional 10	Dieciseisavos de Final 5	10	07:00	07:10
Equipo Professional 10	Dieciseisavos de Final 6	10	07:10	07:20
Equipo Professional 10	Dieciseisavos de Final 7	10	07:20	07:30
Equipo Professional 10	Dieciseisavos de Final 8	10	07:30	07:40
Equipo Professional 10	Dieciseisavos de Final 9	10	07:40	07:50
Equipo Professional 10	Dieciseisavos de Final 10	10	07:50	08:00
Equipo Professional 10	Dieciseisavos de Final 11	10	08:00	08:10
Equipo Professional 10	Dieciseisavos de Final 12	10	08:10	08:20
Equipo Professional 10	Dieciseisavos de Final 13	10	08:20	08:30
Equipo Professional 10	Dieciseisavos de Final 14	10	08:30	08:40
Equipo Professional 10	Dieciseisavos de Final 15	10	08:40	08:50
Equipo Professional 10	Dieciseisavos de Final 16	10	08:50	09:00
Equipo Professional 10	Octavos de Final 1	10	09:00	09:10
Equipo Professional 10	Octavos de Final 2	10	09:10	09:20
Equipo Professional 10	Octavos de Final 3	10	09:20	09:30
Equipo Professional 10	Octavos de Final 4	10	07:00	07:10
Equipo Professional 10	Octavos de Final 5	10	07:10	07:20
Equipo Professional 10	Octavos de Final 6	10	07:20	07:30
Equipo Professional 10	Octavos de Final 7	10	07:30	07:40
Equipo Professional 10	Octavos de Final 8	10	07:40	07:50
Equipo Professional 10	Cuartos de Final 1	10	07:50	08:00
Equipo Professional 10	Cuartos de Final 2	10	08:00	08:10
Equipo Professional 10	Cuartos de Final 3	10	08:10	08:20
Equipo Professional 10	Cuartos de Final 4	10	08:20	08:30
Equipo Professional 10	Semifinal 1	10	08:30	08:40
Equipo Professional 10	Semifinal 2	10	08:40	08:50
Equipo Professional 10	Final 1	10	08:50	09:00
Equipo Professional 10	Ceremonia de Clausura	90	09:00	10:30"""

# 2) Leer en DataFrame usando tabulaciones como separador
df = pd.read_csv(StringIO(raw), sep='\t')


# 3) Convertir horas y calcular minutos desde las 07:00
df['Inicio_dt'] = pd.to_datetime(df['Inicio'], format='%H:%M')
df['Start_min'] = (df['Inicio_dt'].dt.hour * 60 + df['Inicio_dt'].dt.minute) - 7*60
df['Duration_min'] = df['Duración (min)']

# 4) Mapear cada equipo a una posición en el eje Y
equipos = df['Equipo'].unique()
pos_map = {eq: i for i, eq in enumerate(equipos)}

# 5) Asignar un color distinto a cada actividad
activities = df['Actividad'].unique()
cmap = plt.get_cmap('tab20')
color_map = {act: cmap(i % cmap.N) for i, act in enumerate(activities)}

# 6) Crear figura grande y alta resolución
fig, ax = plt.subplots(figsize=(20, len(equipos)*0.6), dpi=200)

# 7) Dibujar cada barra coloreada según la actividad
for _, row in df.iterrows():
    ax.barh(
        y=pos_map[row['Equipo']],
        width=row['Duration_min'],
        left=row['Start_min'],
        height=0.6,
        color=color_map[row['Actividad']]
    )

# 8) Construir la leyenda
patches = [
    mpatches.Patch(color=color_map[act], label=act)
    for act in activities
]
ax.legend(
    handles=patches,
    title='Actividad',
    bbox_to_anchor=(1.02, 1),
    loc='upper left'
)

# 9) Ajustes de ejes y etiquetas
max_x = df['Start_min'].max() + df['Duration_min'].max()
xticks = range(0, int(max_x)+1, 60)
ax.set_xticks(xticks)
ax.set_xticklabels([f"{7 + t//60:02d}:00" for t in xticks])
ax.set_xlim(0, max_x)

ax.set_yticks(list(pos_map.values()))
ax.set_yticklabels(list(pos_map.keys()), fontsize=10)

ax.set_xlabel('Hora del día', fontsize=12)
ax.set_ylabel('Equipo', fontsize=12)
ax.set_title('Diagrama de Gantt de actividades por equipo', fontsize=14)

plt.tight_layout()
plt.savefig("output.png")
