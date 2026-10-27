const dlpRules = [
  {
    id: 'DLP-001',
    name: 'Identificacion personal',
    category: 'IDENTIFICACION',
    sensitivity: 'ALTO',
    weight: 35,
    description: 'Detecta identificadores sinteticos con prefijos CC o TI.',
    pattern: /\b(?:CC|TI)\s*[:\-]?\s*\d{6,10}\b/gi,
  },
  {
    id: 'DLP-002',
    name: 'Historia clinica',
    category: 'HISTORIA_CLINICA',
    sensitivity: 'CRITICO',
    weight: 50,
    description: 'Detecta codigos sinteticos de historia clinica.',
    pattern: /\bHC[-\s]?\d{4,10}\b/gi,
  },
  {
    id: 'DLP-003',
    name: 'Terminologia clinica',
    category: 'TERMINO_CLINICO',
    sensitivity: 'MEDIO',
    weight: 25,
    description: 'Detecta vocabulario relacionado con informacion medica sensible.',
    pattern: /\b(historia clinica|diagnostico|diagnóstico|resultado(?:s)? de laboratorio|paciente|tratamiento|medicacion|medicación|examen clinico|examen clínico)\b/gi,
  },
];

export default dlpRules;
