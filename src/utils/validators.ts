export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateBoardTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200;
}

export function validateProjectData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!Array.isArray(data.elements) && !Array.isArray(data.pages)) {
    return false;
  }
  
  return true;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function validateFileType(mimetype: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ];
  return allowedTypes.includes(mimetype);
}

export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

