'use client';

import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
