import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    super_admin: 4,
    admin: 3,
    lecturer: 2,
    student: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
         roleHierarchy[requiredRole as keyof typeof roleHierarchy];
};

export const canAccess = (userRole: string, resource: string, action: string): boolean => {
  const permissions: Record<string, Record<string, string[]>> = {
    super_admin: {
      '*': ['*'],
    },
    admin: {
      users: ['create', 'read', 'update', 'delete'],
      departments: ['create', 'read', 'update', 'delete'],
      programs: ['create', 'read', 'update', 'delete'],
      course_units: ['create', 'read', 'update', 'delete'],
      results: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
      reports: ['read'],
    },
    lecturer: {
      results: ['create', 'read', 'update'],
      assignments: ['read'],
      grades: ['read'],
    },
    student: {
      results: ['read'],
      enrollments: ['read'],
      grades: ['read'],
    },
  };

  if (userRole === 'super_admin') return true;
  
  const rolePermissions = permissions[userRole];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes('*') || resourcePermissions.includes(action);
};
