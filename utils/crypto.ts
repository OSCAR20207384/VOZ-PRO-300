
export const getDeviceId = (): string => {
  const navigatorInfo = window.navigator.userAgent + 
                        window.navigator.language + 
                        screen.width + 
                        screen.height + 
                        window.navigator.hardwareConcurrency;
  let hash = 0;
  for (let i = 0; i < navigatorInfo.length; i++) {
    const char = navigatorInfo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return 'vpro-' + Math.abs(hash).toString(16);
};

/**
 * Verificación de integridad de dominio ultra-flexible pero segura.
 * Permite el acceso en entornos de desarrollo y despliegue conocidos.
 */
export const isDomainAuthorized = (): boolean => {
  const currentHost = window.location.hostname.toLowerCase();
  
  // Dominios base autorizados
  const authorizedTerms = [
    'localhost',
    '127.0.0.1',
    'vozpro.app',
    'lovable.app',
    'lovable.project',
    'gptengineer.run',
    'stackblitz',
    'webcontainer',
    'netlify.app',
    'vercel.app',
    'pages.dev',
    'firebaseapp.com',
    'github.io'
  ];

  // Si el host actual contiene cualquiera de los términos autorizados, permitimos el acceso.
  // Esto asegura que en cualquier plataforma de preview o dominio oficial funcione.
  return authorizedTerms.some(term => currentHost.includes(term)) || currentHost === "";
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};
