'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, ArrowRight, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import logo from '@/components/YMCA-logo.png.webp';

interface Assignment {
  id: number;
  course_unit_id: number;
  course_code: string;
  course_name: string;
  quarter_id: number;
  quarter_name: string;
  academic_year_id: number;
  academic_year_name: string;
  credit_units: number;
}

export default function LecturerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lecturer/assignments');
      
      const mapped = response.data.data.map((a: any) => ({
        id: a.id,
        course_unit_id: a.course_unit_id,
        course_code: a.course_unit?.code || 'N/A',
        course_name: a.course_unit?.name || 'Unknown Course',
        quarter_id: a.quarter_id,
        quarter_name: a.quarter?.name || 'N/A',
        academic_year_id: a.academic_year_id,
        academic_year_name: a.academic_year?.name || 'N/A',
        credit_units: a.course_unit?.credit_units || 0,
      }));

      setAssignments(mapped);

      // Fetch student counts for each course in parallel to sum up total students
      let studentsSum = 0;
      const countPromises = mapped.map(async (assign: Assignment) => {
        try {
          const res = await api.get(`/lecturer/course-units/${assign.course_unit_id}/students`, {
            params: {
              quarter_id: assign.quarter_id,
              academic_year_id: assign.academic_year_id,
            },
          });
          return res.data.data?.length || 0;
        } catch {
          return 0;
        }
      });

      const counts = await Promise.all(countPromises);
      studentsSum = counts.reduce((acc, curr) => acc + curr, 0);
      setTotalStudents(studentsSum);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-primary font-outfit">Lecturer Dashboard</h1>
            <p className="text-muted-foreground mt-0.5">
              Welcome back, {user ? `${user.first_name} ${user.last_name}` : 'Lecturer'} (Lecturer)
            </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all academic periods</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students Enrolled</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Students attending your courses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Supervised</CardTitle>
            <FileText className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {assignments.reduce((sum, a) => sum + a.credit_units, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total credit units assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle>My Course Assignments</CardTitle>
          <CardDescription>Select a course assignment below to view enrolled students and enter marks.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              No course assignments found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col justify-between p-5 border rounded-xl hover:bg-slate-50/50 hover:border-primary/20 transition-all group cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/lecturer/results?course_unit_id=${assignment.course_unit_id}&quarter_id=${assignment.quarter_id}&academic_year_id=${assignment.academic_year_id}`
                    )
                  }
                >
                  <div className="space-y-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {assignment.course_code}
                    </span>
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors pt-1">
                      {assignment.course_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.academic_year_name} • {assignment.quarter_name}
                    </p>
                  </div>
                  <div className="pt-6 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{assignment.credit_units} Credit Units</span>
                    <span className="flex items-center text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      Enter Results
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
