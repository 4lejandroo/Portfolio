// Datos del CV que se muestran en la pantalla del notebook y en la UI.

export const MODE_LABELS = ['terminal', 'perfil.json', 'proyectos', 'skills --monitor', 'formacion.log', 'mail'];

export const TERM_LINES = [
  { t: '$ whoami', c: 'cmd' },
  { t: 'alejandro rojas muena', c: 'out' },
  { t: '$ cat titulo.txt', c: 'cmd' },
  { t: 'ing. de ejecución en informática — UDLA', c: 'out' },
  { t: '$ ./iniciar-portafolio --secciones=6', c: 'cmd' },
  { t: '[OK] usa el scroll para navegar', c: 'ok' },
];

export const BIOS = ['NEXUS-BIOS v2.5.1', 'cpu ok · mem 16GB ok · gpu ok', 'montando portafolio...'];

export const JSON_LINES = [
  ['{', 'punct'],
  ['  "nombre": ', 'key'], ['"alejandro rojas muena",', 'str'],
  ['  "titulo": ', 'key'], ['"ing. de ejecución en informática",', 'str'],
  ['  "base": ', 'key'], ['"telecomunicaciones → software",', 'str'],
  ['  "proyectos": ', 'key'], ['6,', 'num'],
  ['  "stack": ', 'key'], ['["react","next","flutter",".net","django"],', 'str'],
  ['  "ubicacion": ', 'key'], ['"peñalolén, santiago",', 'str'],
  ['  "disponible": ', 'key'], ['true', 'num'],
  ['}', 'punct'],
];

export const PROJECTS = [
  ['001', 'los deleites de carlita', 'web · supabase · admin'],
  ['002', 'praxisdigital', 'next.js · frontend'],
  ['003', 'studyroom', 'sistema de reservas · udla'],
  ['004', 'dr. 911', 'app móvil · flutter'],
  ['005', 'bramal', 'fullstack · reportes de obras'],
  ['006', 'getsper', 'erp / crm · rr.hh.'],
];

export const SKILLS = [
  ['frontend', 88],
  ['backend', 80],
  ['móvil · flutter', 75],
  ['datos & cloud', 78],
  ['herramientas', 85],
  ['redes & telecom', 90],
];

export const TIMELINE = [
  ['2025', 'título: ing. de ejecución en informática', 'universidad de las américas'],
  ['2022 — 2025', 'ingeniería en informática', 'udla · memoria: studyroom'],
  ['2019 — 2020', 'técnico en telecomunicaciones', 'l. pedro de valdivia · práctica en gtd'],
  ['2021', 'cinta negra · karate shotokan', 'asociación japonesa de karate'],
  ['2025', 'seguridad: supervisor + guardia (os-10)', '120 h · 90 h'],
];

export const LABELS = ['Inicio', 'Sobre mí', 'Proyectos', 'Habilidades', 'Educación', 'Contacto'];