// ===== CONTENIDO DEL PODCAST Y DEL TRABAJO ESCOLAR (editar aquí) =====
/* ====== CONFIGURACIÓN DEL TRABAJO ESCOLAR (edita estos datos) ====== */
let PROJECT = {
  titulo: 'Podcast Línea de 4 · Tema: Fútbol',
  materia: 'Informática Aplicada II',
  curso: '',
  integrantes: ['Domenico Bonacci', 'Isaías Olmedo', 'Mateo Sosa' ,'Demian Iriarte'],
  objetivo: 'Brindar un espacio dinámico y cercano para analizar el fútbol desde adentro. Buscamos conectar a los oyentes con la esencia de este deporte, combinando el análisis táctico, la pasión por los clubes y las historias humanas que muchas veces quedan fuera de las cámaras.',
  temas: [
    'Identidad e historia: El origen, los valores y la cultura detrás de las instituciones deportivas.',
    'Protagonistas en primera persona: Entrevistas y charlas exclusivas con jugadores, entrenadores y referentes locales.',
    'Análisis y actualidad'
  ]
};

/* ====== ESTADO ====== */
let podcast = { title:'Línea de 4', desc:'Podcast sobre fútbol: análisis, identidad e historias humanas.', cover: 'img/portada-podcast.png'};
let episodes = [
  {
    id: 1,
    num: 1,
    title: 'Línea de 4 · Episodio 1',
    desc: 'Club Argentino de España.',
    date: '2026-09-02',
    cover: 'img/episodio-1.jpg',
    audio: 'audio/episodio-1.mp3',
    trim: { s: 0, e: null },
    volume: 1
  },
  {
    id: 2,
    num: 2,
    title: 'Línea de 4 · Episodio 2',
    desc: 'Charlamos con Pio Bonacci, Delantero de Quilmes.',
    date: '2026-09-16',
    cover: 'img/episodio-2.jpg',
    audio: 'audio/episodio-2.mp3',
    trim: { s: 0, e: null },
    volume: 1
  },
  {
    id: 3,
    num: 3,
    title: 'Línea de 4 · Episodio 3',
    desc: 'Hablamos de Diego Flores, actual Dt de Instituto de Córdoba.',
    date: '2026-10-07',
    cover: 'img/episodio-3.jpg',
    audio: 'audio/episodio-3.mp3',
    trim: { s: 0, e: null },
    volume: 1
  }
];