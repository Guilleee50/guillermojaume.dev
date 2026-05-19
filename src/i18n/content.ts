export type Lang = 'es' | 'en';

export const content = {
  es: {
    nav: {
      links: [
        { href: '#about', label: 'Sobre mí' },
        { href: '#experience', label: 'Experiencia' },
        { href: '#projects', label: 'Proyectos' },
        { href: '#skills', label: 'Habilidades' },
        { href: '#education', label: 'Formación' },
        { href: '#contact', label: 'Contacto' },
      ],
      switcherLabel: 'EN',
      switcherHref: '/en',
    },
    hero: {
      prompt: '$ whoami',
      subtitle: 'Técnico en Ciberseguridad & Desarrollador de Software',
      location: 'Barcelona, España',
      openToWork: 'Open to work',
      downloadCV: 'Descargar CV',
      contact: 'Contacto',
    },
    about: {
      tag: '// sobre mí',
      title: 'Sobre mí',
      paragraphs: [
        'Soy un <span class="text-zinc-100 font-medium">Técnico Superior en DAM</span> con experiencia real en desarrollo de software corporativo, actualmente especializándome en <span class="text-zinc-100 font-medium">Ciberseguridad</span>. He participado en proyectos de alta visibilidad como el <span class="text-zinc-100 font-medium">Mobile World Congress</span> y en sistemas críticos del sector sanitario.',
        'Mi enfoque es diferenciador: traigo la perspectiva de desarrollador al mundo de la seguridad, lo que me permite entender y proteger infraestructuras, aplicaciones y entornos cloud de forma integral. Próximamente iniciaré el <span class="text-zinc-100 font-medium">Grado en Ingeniería Informática</span> en la UOC.',
        'Busco mi primera oportunidad en el sector de la ciberseguridad, especialmente en roles donde pueda combinar mi base técnica en desarrollo con las capacidades ofensivas y defensivas que estoy adquiriendo.',
      ],
      info: [
        { key: 'loc', value: 'Barcelona, España' },
        { key: 'lang', value: 'ES · CA · EN (B1)' },
        { key: 'edu', value: 'DAM · Ciberseg · Ing. Inf.' },
        { key: 'focus', value: 'Blue Team · DevSecOps' },
        { key: 'status', value: 'open to work', accent: true },
      ],
    },
    experience: {
      tag: '// experiencia',
      title: 'Experiencia',
      items: [
        {
          company: 'Inetum',
          role: 'Desarrollador de Software',
          type: 'Prácticas FP Dual',
          start: 'Sep 2023',
          end: 'May 2024',
          location: 'Barcelona',
          bullets: [
            {
              text: 'Desarrollo fullstack de aplicación web corporativa para gestión de salas de reuniones, presentada y exhibida en el Mobile World Congress (MWC).',
              tech: ['C#', 'Angular', 'MySQL'],
            },
            {
              text: 'Desarrollo evolutivo y mantenimiento del Sistema Informático de Recetas Electrónicas (SIRE), proyecto de alta criticidad y gran volumen de datos en el sector sanitario.',
              tech: ['Java'],
            },
          ],
        },
      ],
    },
    projects: {
      tag: '// proyectos',
      title: 'Proyectos',
      items: [
        {
          name: 'Secure the Box',
          description:
            'Plataforma interactiva de entrenamiento SOC con mecánicas CTF. Autenticación de dos factores con TOTP y CAPTCHA, defensa anti-fuerza bruta, flags firmados con HMAC-SHA256, puntuación en tiempo real y leaderboard global.',
          tech: ['Python', 'Django', 'DRF', 'TailwindCSS', 'MariaDB', 'Nginx', 'Gunicorn'],
          tags: ['Ciberseguridad', 'Full Stack'],
          url: 'https://github.com/Guilleee50/secure-the-box-web',
        },
        {
          name: 'Motobrief',
          description:
            'Web de fichas técnicas, comparativas y guías de compra de motos. Permite consultar especificaciones completas, comparar dos modelos lado a lado y filtrar guías por tipo de carnet y categoría.',
          tech: ['Astro', 'TypeScript', 'Python'],
          tags: ['Web'],
          url: 'https://github.com/Guilleee50/motobrief',
        },
      ],
    },
    skills: {
      tag: '// habilidades',
      title: 'Habilidades Técnicas',
      items: [
        {
          title: 'Desarrollo Seguro & DevSecOps',
          items: [
            'Estándares ASVS',
            'Prevención de inyección y gestión de sesiones',
            'CI/CD y automatización de despliegues',
            'Sistemas de control de versiones',
          ],
        },
        {
          title: 'Hacking Ético & Seguridad Ofensiva',
          items: [
            'OSINT pasivo y activo',
            'Análisis y explotación de vulnerabilidades web',
            'Ataques MitM e intrusión en redes inalámbricas',
            'Red Team / Blue Team',
          ],
        },
        {
          title: 'Respuesta a Incidentes & Forense',
          items: [
            'Contención y mitigación de incidentes',
            'Análisis forense con cadena de custodia',
            'Evidencias en Cloud, móviles e IoT',
          ],
        },
        {
          title: 'Desarrollo & Cloud',
          items: ['Java · C# · Angular · Python', 'MySQL · MariaDB', 'AWS · Docker'],
        },
        {
          title: 'Normativa & Compliance',
          items: [
            'ISO 27001 (SGSI) · ISO 22301',
            'ENS · Directiva NIS · PIC',
            'RGPD y Privacidad por Diseño',
          ],
        },
      ],
    },
    education: {
      tag: '// formación',
      title: 'Formación',
      statusLabels: {
        current: 'En curso',
        upcoming: 'Próximamente',
      },
      items: [
        {
          degree: 'Grado en Ingeniería Informática',
          institution: 'Universitat Oberta de Catalunya (UOC)',
          dates: 'Sep 2026',
          status: 'upcoming' as const,
        },
        {
          degree: 'Curso de Especialización en Ciberseguridad',
          institution: 'Institut Tecnològic Barcelona',
          dates: 'Sep 2025 – Jun 2026',
          status: 'current' as const,
        },
        {
          degree: 'Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)',
          institution: 'Institut TIC de Barcelona',
          dates: 'Sep 2022 – Jun 2024',
          status: 'completed' as const,
        },
      ],
    },
    contact: {
      tag: '// contacto',
      title: 'Contacto',
      description:
        'Busco mi primera oportunidad en ciberseguridad. Si tienes un rol interesante o simplemente quieres hablar, escríbeme.',
      footer: 'Diseñado y construido por Guillermo Jaume Murciano · Barcelona, 2025',
    },
  },

  en: {
    nav: {
      links: [
        { href: '#about', label: 'About' },
        { href: '#experience', label: 'Experience' },
        { href: '#projects', label: 'Projects' },
        { href: '#skills', label: 'Skills' },
        { href: '#education', label: 'Education' },
        { href: '#contact', label: 'Contact' },
      ],
      switcherLabel: 'ES',
      switcherHref: '/',
    },
    hero: {
      prompt: '$ whoami',
      subtitle: 'Cybersecurity Technician & Software Developer',
      location: 'Barcelona, Spain',
      openToWork: 'Open to work',
      downloadCV: 'Download CV',
      contact: 'Contact',
    },
    about: {
      tag: '// about',
      title: 'About me',
      paragraphs: [
        'I\'m a <span class="text-zinc-100 font-medium">Higher Technician in Multiplatform Application Development (DAM)</span> with proven experience in corporate software development, currently specializing in <span class="text-zinc-100 font-medium">Cybersecurity</span>. I\'ve participated in high-visibility projects such as the <span class="text-zinc-100 font-medium">Mobile World Congress</span> and in critical healthcare systems.',
        'My approach is distinctive: I bring a developer\'s perspective to the security world, allowing me to understand and protect infrastructure, applications, and cloud environments comprehensively. I\'ll soon be starting a <span class="text-zinc-100 font-medium">Computer Engineering degree</span> at UOC.',
        "I'm looking for my first opportunity in cybersecurity, particularly in roles where I can combine my technical development background with the offensive and defensive skills I'm building.",
      ],
      info: [
        { key: 'loc', value: 'Barcelona, Spain' },
        { key: 'lang', value: 'ES · CA · EN (B1)' },
        { key: 'edu', value: 'DAM · Cybersec · Comp. Eng.' },
        { key: 'focus', value: 'Blue Team · DevSecOps' },
        { key: 'status', value: 'open to work', accent: true },
      ],
    },
    experience: {
      tag: '// experience',
      title: 'Experience',
      items: [
        {
          company: 'Inetum',
          role: 'Software Developer',
          type: 'FP Dual Internship',
          start: 'Sep 2023',
          end: 'May 2024',
          location: 'Barcelona',
          bullets: [
            {
              text: 'Full-stack development of a corporate web application for meeting room management, presented and showcased at the Mobile World Congress (MWC).',
              tech: ['C#', 'Angular', 'MySQL'],
            },
            {
              text: 'Evolutionary development and maintenance of the Electronic Prescription Information System (SIRE), a high-criticality project handling large volumes of healthcare data.',
              tech: ['Java'],
            },
          ],
        },
      ],
    },
    projects: {
      tag: '// projects',
      title: 'Projects',
      items: [
        {
          name: 'Secure the Box',
          description:
            'Interactive SOC training platform with CTF mechanics. Two-factor authentication with TOTP and CAPTCHA, brute-force defense, HMAC-SHA256 signed flags, real-time scoring, and a global leaderboard.',
          tech: ['Python', 'Django', 'DRF', 'TailwindCSS', 'MariaDB', 'Nginx', 'Gunicorn'],
          tags: ['Cybersecurity', 'Full Stack'],
          url: 'https://github.com/Guilleee50/secure-the-box-web',
        },
        {
          name: 'Motobrief',
          description:
            'Website featuring motorcycle technical specs, side-by-side comparisons, and buying guides. Browse full specifications, compare two models, and filter guides by license type and category.',
          tech: ['Astro', 'TypeScript', 'Python'],
          tags: ['Web'],
          url: 'https://github.com/Guilleee50/motobrief',
        },
      ],
    },
    skills: {
      tag: '// skills',
      title: 'Technical Skills',
      items: [
        {
          title: 'Secure Development & DevSecOps',
          items: [
            'ASVS standards',
            'Injection prevention & session management',
            'CI/CD and deployment automation',
            'Version control systems',
          ],
        },
        {
          title: 'Ethical Hacking & Offensive Security',
          items: [
            'Passive and active OSINT',
            'Web vulnerability analysis & exploitation',
            'MitM attacks & wireless intrusion',
            'Red Team / Blue Team',
          ],
        },
        {
          title: 'Incident Response & Forensics (DFIR)',
          items: [
            'Incident containment and mitigation',
            'Forensic analysis with chain of custody',
            'Evidence from Cloud, mobile & IoT',
          ],
        },
        {
          title: 'Development & Cloud',
          items: ['Java · C# · Angular · Python', 'MySQL · MariaDB', 'AWS · Docker'],
        },
        {
          title: 'Regulatory & Compliance',
          items: [
            'ISO 27001 (ISMS) · ISO 22301',
            'ENS · NIS Directive · CIP',
            'GDPR and Privacy by Design',
          ],
        },
      ],
    },
    education: {
      tag: '// education',
      title: 'Education',
      statusLabels: {
        current: 'In progress',
        upcoming: 'Upcoming',
      },
      items: [
        {
          degree: 'Computer Engineering Degree',
          institution: 'Universitat Oberta de Catalunya (UOC)',
          dates: 'Sep 2026',
          status: 'upcoming' as const,
        },
        {
          degree: 'Cybersecurity Specialization Certificate',
          institution: 'Institut Tecnològic Barcelona',
          dates: 'Sep 2025 – Jun 2026',
          status: 'current' as const,
        },
        {
          degree: 'Higher Certificate in Multiplatform App Development (DAM)',
          institution: 'Institut TIC de Barcelona',
          dates: 'Sep 2022 – Jun 2024',
          status: 'completed' as const,
        },
      ],
    },
    contact: {
      tag: '// contact',
      title: 'Contact',
      description:
        "I'm looking for my first opportunity in cybersecurity. If you have an interesting role or just want to chat, get in touch.",
      footer: 'Designed and built by Guillermo Jaume Murciano · Barcelona, 2025',
    },
  },
} as const;

export type Content = typeof content.es;
