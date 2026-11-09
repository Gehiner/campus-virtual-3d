// DATOS DE PRUEBA (v0.1). Son ficticios: no son estudiantes ni proyectos reales.
// En el Día 2 esto se reemplaza por lectura desde Supabase.

export type Project = {
  id: string;
  title: string;
  description: string;
  author: string;
  url: string;
  color: string; // color de la portada mientras no haya imagen
  category: string;
  memory: string;
  challenge: string;
  learning: string;
  coverUrl?: string;
};

export const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1",
    title: "Mi primera web",
    description: "Página personal hecha con HTML y CSS. Incluye menú, galería y formulario de contacto.",
    author: "Estudiante demo 1",
    url: "https://example.com",
    color: "#ff4d8d",
    category: "Desarrollo web",
    memory: "El primer momento en que una idea personal tomó forma en una página propia.",
    challenge: "Organizar varias secciones sin perder una navegación sencilla.",
    learning: "Estructurar contenido y combinar HTML semántico con estilos reutilizables.",
  },
  {
    id: "demo-2",
    title: "Juego de memoria",
    description: "Juego de parejas de cartas con JavaScript. Tiene contador de intentos y reinicio.",
    author: "Estudiante demo 2",
    url: "https://example.com",
    color: "#ffb02e",
    category: "Juego interactivo",
    memory: "Una colección de tarjetas que convierte unos minutos libres en un reto de memoria.",
    challenge: "Mantener el estado de las parejas y evitar que una carta se voltee dos veces.",
    learning: "Modelar estados de juego y responder a eventos con JavaScript.",
  },
  {
    id: "demo-3",
    title: "Calculadora de notas",
    description: "Calcula el promedio ponderado de un periodo y muestra cuánto falta para aprobar.",
    author: "Estudiante demo 3",
    url: "https://example.com",
    color: "#2dd4ff",
    category: "Herramienta de estudio",
    memory: "Una herramienta pensada para responder la pregunta: ¿cuánto necesito para aprobar?",
    challenge: "Aplicar correctamente los pesos de cada nota y mostrar un resultado comprensible.",
    learning: "Traducir una fórmula a código y validar los valores ingresados.",
  },
  {
    id: "demo-4",
    title: "Portafolio de arte",
    description: "Galería responsiva con ilustraciones digitales y una breve biografía del autor.",
    author: "Estudiante demo 4",
    url: "https://example.com",
    color: "#7c5cff",
    category: "Portafolio creativo",
    memory: "Un espacio digital para reunir ilustraciones y contar la historia detrás de cada una.",
    challenge: "Hacer que la galería se adapte a pantallas distintas sin quitarle protagonismo al arte.",
    learning: "Crear composiciones responsivas y cuidar la jerarquía visual.",
  },
  {
    id: "demo-5",
    title: "Lista de tareas",
    description: "App para organizar tareas con filtros por estado y guardado en el navegador.",
    author: "Estudiante demo 5",
    url: "https://example.com",
    color: "#3ddc97",
    category: "Productividad",
    memory: "Una lista que transforma pendientes en pasos pequeños y alcanzables.",
    challenge: "Encontrar tareas rápido usando filtros sin perder los cambios al recargar.",
    learning: "Separar los datos de la interfaz y persistir información en el navegador.",
  },
  {
    id: "demo-6",
    title: "Clima de mi ciudad",
    description: "Consulta el pronóstico del día y los próximos tres días con iconos animados.",
    author: "Estudiante demo 6",
    url: "https://example.com",
    color: "#5aa9ff",
    category: "Datos y visualización",
    memory: "Una ventana al clima local que reúne el pronóstico de hoy y los días que vienen.",
    challenge: "Resumir información cambiante con iconos y textos fáciles de leer.",
    learning: "Presentar datos de forma visual y diseñar estados de carga y error.",
  },
  {
    id: "demo-7",
    title: "Quiz de ciencias",
    description: "Cuestionario de 10 preguntas con retroalimentación inmediata y puntaje final.",
    author: "Estudiante demo 7",
    url: "https://example.com",
    color: "#ff7a45",
    category: "Aprendizaje",
    memory: "Un cuestionario corto que acompaña cada respuesta con retroalimentación inmediata.",
    challenge: "Mantener el puntaje y dar una explicación útil después de cada pregunta.",
    learning: "Diseñar interacciones educativas y controlar el avance entre preguntas.",
  },
  {
    id: "demo-8",
    title: "Reloj pomodoro",
    description: "Temporizador de estudio con ciclos de concentración y descanso.",
    author: "Estudiante demo 8",
    url: "https://example.com",
    color: "#e45cff",
    category: "Bienestar y estudio",
    memory: "Un reloj que recuerda hacer una pausa después de cada tramo de concentración.",
    challenge: "Representar el tiempo restante y alternar entre trabajo y descanso.",
    learning: "Gestionar intervalos y mostrar cambios de estado de manera clara.",
  },
];
