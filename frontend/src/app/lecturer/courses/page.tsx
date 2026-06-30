'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: number;
  course_unit: {
    id: number;
    code: string;
    name: string;
    credit_units: number;
  };
  quarter: {
    id: number;
    name: string;
  };
  academic_year: {
    id: number;
    name: string;
  };
}

export default function LecturerCoursesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // The endpoint is /lecturer/assignments based on routes/api.php
      const res = await api.get('/lecturer/assignments');
      setAssignments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load your assigned courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading your courses...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">My Assigned Courses</h1>
        <p className="text-muted-foreground mt-1">
          Select a course below to manage students and enter results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">You do not have any course assignments yet.</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <Card 
              key={assignment.id} 
              className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/20"
              onClick={() => router.push(`/lecturer/results?course_unit_id=${assignment.course_unit?.id}&quarter_id=${assignment.quarter?.id}&academic_year_id=${assignment.academic_year?.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-2 rounded-lg inline-flex text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {assignment.course_unit?.code}
                  </span>
                </div>
                <CardTitle className="text-xl mt-4 line-clamp-2">
                  {assignment.course_unit?.name}
                </CardTitle>
                <CardDescription>
                  {assignment.academic_year?.name} • {assignment.quarter?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6">
                  {assignment.course_unit?.credit_units} Credit Units
                </p>
                <Button className="w-full">
                  Manage Results
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
