import pandas as pd

def verificar_inconsistencias(file_path):
    # Cargar el archivo
    df = pd.read_excel(file_path, sheet_name='Horario Maestro')
    
    # Inicializar diccionario para almacenar los errores
    inconsistencias = {
        'Registro': [],
        'Scrutinio': [],
        'Carreras': [],
        'Portfolio Técnico': [],
        'Portfolio de Empresa': [],
        'Presentación Verbal': []
    }
    
    # Verificar Registro de equipos
    registro_df = df[df['Actividad'].str.contains("Registro")]
    registro_concurrencia = registro_df.groupby('Inicio').size()
    for index, row in registro_df.iterrows():
        if row['Duración (min)'] != 5:
            inconsistencias['Registro'].append(f"Inconsistencia en Registro: Duración incorrecta en el equipo {row['Equipo']} a las {row['Inicio']}.")
        if registro_concurrencia[row['Inicio']] > 2:
            inconsistencias['Registro'].append(f"Inconsistencia en Registro: Más de 2 equipos a la vez en el inicio {row['Inicio']}.")

    # Verificar Scrutinio
    scrutinio_df = df[df['Actividad'].str.contains("Escrutinio")]
    scrutinio_concurrencia = scrutinio_df.groupby('Inicio').size()
    for index, row in scrutinio_df.iterrows():
        if row['Categoría'] == "Professional" and row['Duración (min)'] != 25:
            inconsistencias['Scrutinio'].append(f"Inconsistencia en Scrutinio: Duración incorrecta para equipo {row['Equipo']} en categoría Professional a las {row['Inicio']}.")
        if row['Categoría'] != "Professional" and row['Duración (min)'] != 20:
            inconsistencias['Scrutinio'].append(f"Inconsistencia en Scrutinio: Duración incorrecta para equipo {row['Equipo']} en categoría no Professional a las {row['Inicio']}.")
        if scrutinio_concurrencia[row['Inicio']] > 3:
            inconsistencias['Scrutinio'].append(f"Inconsistencia en Scrutinio: Más de 3 equipos a la vez en el inicio {row['Inicio']}.")

    # Verificar Carreras
    carreras_df = df[df['Actividad'].str.contains("Carrera")]
    
    # Agrupar por inicio y actividad
    carreras_concurrencia = carreras_df.groupby(['Inicio', 'Actividad']).size()
    
    for (inicio, actividad), count in carreras_concurrencia.items():
        # Si hay más de 1 carrera del mismo nombre a la misma hora, no es inconsistencia
        if count > 1:
            continue
        # Si hay más de una carrera con diferentes nombres a la misma hora, es inconsistencia
        carreras_en_mismo_inicio = carreras_df[carreras_df['Inicio'] == inicio]
        actividades_distintas = carreras_en_mismo_inicio['Actividad'].nunique()
        if actividades_distintas > 1:
            inconsistencias['Carreras'].append(f"Inconsistencia en Carreras: Más de una carrera con nombres distintos a la vez en el inicio {inicio}.")

    # Verificar Portfolio Técnico
    portfolio_df = df[df['Actividad'].str.contains("Portfolio Técnico")]
    portfolio_concurrencia = portfolio_df.groupby('Inicio').size()
    for index, row in portfolio_df.iterrows():
        if portfolio_concurrencia[row['Inicio']] > 3:
            inconsistencias['Portfolio Técnico'].append(f"Inconsistencia en Portfolio Técnico: Más de 3 equipos a la vez en el inicio {row['Inicio']}.")

    # Verificar Portfolio de Empresa
    company_portfolio_df = df[df['Actividad'].str.contains("Portfolio de Empresa")]
    company_portfolio_concurrencia = company_portfolio_df.groupby('Inicio').size()
    for index, row in company_portfolio_df.iterrows():
        if company_portfolio_concurrencia[row['Inicio']] > 3:
            inconsistencias['Portfolio de Empresa'].append(f"Inconsistencia en Portfolio de Empresa: Más de 3 equipos a la vez en el inicio {row['Inicio']}.")

    # Verificar Presentación Verbal
    verbal_presentation_df = df[df['Actividad'].str.contains("Presentación Verbal")]
    verbal_presentation_concurrencia = verbal_presentation_df.groupby('Inicio').size()
    for index, row in verbal_presentation_df.iterrows():
        if verbal_presentation_concurrencia[row['Inicio']] > 2:
            inconsistencias['Presentación Verbal'].append(f"Inconsistencia en Presentación Verbal: Más de 2 equipos a la vez en el inicio {row['Inicio']}.")

    # Mostrar las inconsistencias encontradas
    for key, value in inconsistencias.items():
        if value:
            print(f"\n{key} Inconsistencias:")
            for item in value:
                print(f"  - {item}")
        else:
            print(f"\n{key}: No se encontraron inconsistencias.")

# Llamar a la función con el archivo proporcionado
file_path = '/home/4r4r/Desktop/projects/TS/juan/excel-ts-web/tests/Horario_Maestro.xlsx'  # Reemplaza con la ruta de tu archivo
verificar_inconsistencias(file_path)
