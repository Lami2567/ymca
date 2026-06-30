'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, GraduationCap, FileText, TrendingUp, AlertCircle, Building, Award, Calendar, ClipboardList, Clock, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import logo from '@/components/YMCA-logo.png.webp';

interface DashboardStats {
  total_students: number;
  active_lecturers: number;
  total_course_units: number;
  total_departments: number;
  pending_approvals: number;
  current_quarter_registrations: number;
  overall_pass_rate: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/analytics/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/admin/students',
    },
    {
      title: 'Active Lecturers',
      value: stats?.active_lecturers || 0,
      icon: GraduationCap,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/admin/lecturers',
    },
    {
      title: 'Course Units',
      value: stats?.total_course_units || 0,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/admin/course-units',
    },
    {
      title: 'Departments',
      value: stats?.total_departments || 0,
      icon: Building,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/admin/departments',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_approvals || 0,
      icon: AlertCircle,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      link: '/admin/results',
    },
    {
      title: 'Current Quarter Registrations',
      value: stats?.current_quarter_registrations || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/admin/quarters',
    },
    {
      title: 'Overall Pass Rate',
      value: `${stats?.overall_pass_rate || 0}%`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/admin/results',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-1 shadow-md border border-gray-100 flex items-center justify-center shrink-0">
            <Image 
              src={logo} 
              alt="YMCA Logo" 
              className="object-contain" 
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary font-outfit">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-0.5">Welcome back, {user?.first_name} {user?.last_name} (Administrator)</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Button
            variant="outline"
            className="text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link href={card.link} key={card.title} className="block transition-transform hover:scale-[1.01]">
            <Card className="cursor-pointer hover:bg-muted/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/students">
                <Users className="h-4 w-4 mr-2 text-primary" />
                Manage Students
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/lecturers">
                <GraduationCap className="h-4 w-4 mr-2 text-success" />
                Manage Lecturers
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/departments">
                <Building className="h-4 w-4 mr-2 text-warning" />
                Manage Departments
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/programs">
                <Award className="h-4 w-4 mr-2 text-blue-500" />
                Manage Programs
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/course-units">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Manage Course Units
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/quarters">
                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                Manage Periods
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/academic-years">
                <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                Manage Academic Years
              </Link>
            </Button>
            <Button className="justify-start w-full" variant="outline" asChild>
              <Link href="/admin/assignments">
                <ClipboardList className="h-4 w-4 mr-2 text-purple-500" />
                Lecturer Assignments
              </Link>
            </Button>
            <Button className="justify-start w-full col-span-full" variant="outline" asChild>
              <Link href="/admin/results">
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                View Results
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
