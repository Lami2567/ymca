'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  User, 
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth';
import logo from './YMCA-logo.png.webp';

const navItems = [
  {
    title: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Course Enrollment',
    href: '/student/enrollment',
    icon: BookOpen,
  },
  {
    title: 'Academic Results',
    href: '/student/results',
    icon: FileText,
  },
  {
    title: 'Profile',
    href: '/student/profile',
    icon: User,
  },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-primary/5 to-primary/10 border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <Image src={logo} alt="YMCA Logo" width={32} height={32} className="object-contain" />
        <span className="text-xl font-bold text-primary font-outfit">YMCA Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-gray-900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
