import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function calculateGPA(gradePoints: number[], creditUnits: number[]): number {
  if (gradePoints.length === 0 || creditUnits.length === 0) return 0;
  
  const totalPoints = gradePoints.reduce((sum, gp, i) => sum + gp * creditUnits[i], 0);
  const totalCredits = creditUnits.reduce((sum, cu) => sum + cu, 0);
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export function getGradeClass(grade: string): string {
  const gradeClasses: Record<string, string> = {
    A: 'bg-success-100 text-success-700 border-success-200',
    B: 'bg-primary-100 text-primary-700 border-primary-200',
    C: 'bg-warning-100 text-warning-700 border-warning-200',
    D: 'bg-warning-100 text-warning-700 border-warning-200',
    F: 'bg-danger-100 text-danger-700 border-danger-200',
  };
  
  return gradeClasses[grade] || 'bg-muted-100 text-muted-700 border-muted-200';
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'bg-success-100 text-success-700',
    inactive: 'bg-muted-100 text-muted-700',
    suspended: 'bg-danger-100 text-danger-700',
    draft: 'bg-muted-100 text-muted-700',
    submitted: 'bg-primary-100 text-primary-700',
    under_review: 'bg-warning-100 text-warning-700',
    approved: 'bg-success-100 text-success-700',
    published: 'bg-success-100 text-success-700',
    registered: 'bg-success-100 text-success-700',
    dropped: 'bg-danger-100 text-danger-700',
    completed: 'bg-success-100 text-success-700',
    failed: 'bg-danger-100 text-danger-700',
  };
  
  return statusColors[status] || 'bg-muted-100 text-muted-700';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function downloadFile(data: any, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
