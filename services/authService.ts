
import { User, UserStatus } from '../types';
import { SESSION_USER_KEY } from '../constants';

// URL de exportación CSV del Google Sheet
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/11RrC-3sF2_N2dMGDjJiWbxTNu7K-mmJd6eMdPsef1qE/export?format=csv&gid=0';

/**
 * Parser de CSV robusto
 */
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  const firstLine = cleanText.split('\n')[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentField += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
};

/**
 * Normalización de fechas
 */
const parseDate = (str: string): Date | null => {
  if (!str) return null;
  const cleanStr = str.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (cleanStr === "") return null;

  const parts = cleanStr.split(/[-/]/);
  if (parts.length !== 3) return null;
  
  let d, m, y;
  if (parts[0].length === 4) { [y, m, d] = parts.map(Number); }
  else { [d, m, y] = parts.map(Number); }
  
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Sincronización con el Excel
 */
const fetchUsersFromSheet = async (): Promise<User[]> => {
  try {
    const response = await fetch(SHEET_URL, { cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw new Error("Error de conexión");

    const text = await response.text();
    const allRows = parseCSV(text);
    if (allRows.length < 1) return [];

    const hasHeader = allRows[0][0].toLowerCase().includes('email');
    const dataRows = hasHeader ? allRows.slice(1) : allRows;

    return dataRows.map((cols) => {
      const clean = (val: any) => String(val || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
      
      const email = clean(cols[0]).toLowerCase();
      const rawStatus = clean(cols[1]).toUpperCase();
      const nombre = clean(cols[2]) || "Usuario";
      const fecha_inicio = clean(cols[3]);
      const fecha_expiracion = clean(cols[4]);
      const notas = clean(cols[5]);

      // Lógica de Estado ultra-flexible:
      // Si el valor NO es negativo (FALSO/DESACTIVADO/NO), lo consideramos ACTIVO
      const negativeValues = ['FALSE', 'FALSO', 'DESACTIVADO', 'DESACTIVADA', 'NO', 'OFF', '0', 'BLOQUEADO'];
      const isNegative = negativeValues.includes(rawStatus);
      const estado = isNegative ? UserStatus.DESACTIVADO : UserStatus.ACTIVO;

      // Debug para el administrador (F12 en el navegador)
      if (email) {
        console.debug(`[DB-Sync] User: ${email} | Columna B: "${rawStatus}" | Final: ${estado}`);
      }

      return { 
        email, 
        estado, 
        nombre, 
        fecha_inicio, 
        fecha_expiracion, 
        notas, 
        dispositivos_activos: [] // Ignoramos columna G
      };
    }).filter(u => u.email.includes('@'));
  } catch (error) {
    console.error("Fallo al leer Excel:", error);
    return [];
  }
};

export const validateUser = async (email: string): Promise<{ success: boolean; message: string; user?: User }> => {
  const cleanEmail = email.toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!cleanEmail) return { success: false, message: 'Ingrese su email.' };

  const users = await fetchUsersFromSheet();
  const user = users.find(u => u.email === cleanEmail);

  if (!user) {
    return { success: false, message: `El correo '${cleanEmail}' no está en la lista del Excel.` };
  }

  // 1. ESTADO (Columna B)
  if (user.estado === UserStatus.DESACTIVADO) {
    return { success: false, message: 'ACCESO DENEGADO: Tu cuenta está desactivada en el Excel (Columna B).' };
  }

  // 2. FECHA DE EXPIRACIÓN (Columna E)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = parseDate(user.fecha_expiracion);

  if (expiration && today > expiration) {
    return { success: false, message: `ACCESO EXPIRADO: Tu suscripción venció el día ${user.fecha_expiracion}.` };
  }

  // 3. FECHA DE INICIO (Columna D)
  const start = parseDate(user.fecha_inicio);
  if (start && today < start) {
    return { success: false, message: `ACCESO PENDIENTE: Tu cuenta se activa el ${user.fecha_inicio}.` };
  }

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  return { success: true, message: '¡Bienvenido!', user };
};

export const getSessionUser = (): User | null => {
  const session = localStorage.getItem(SESSION_USER_KEY);
  if (!session) return null;

  try {
    const user: User = JSON.parse(session);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiration = parseDate(user.fecha_expiracion);

    if (expiration && today > expiration) {
      logout();
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
};

export const logout = () => localStorage.removeItem(SESSION_USER_KEY);
