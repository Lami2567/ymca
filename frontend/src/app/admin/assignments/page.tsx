'use client';

import { useEffect, useState } from 'react';
import { CourseAssignmentsGrid } from '@/components/tables/CourseAssignmentsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LecturerAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [courseUnits, setCourseUnits] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, cuRes, lecRes, quartRes, ayRes] = await Promise.all([
        api.get('/admin/lecturer-assignments?per_page=1000'),
        api.get('/admin/course-units?per_page=1000'),
        api.get('/admin/lecturers?per_page=1000'),
        api.get('/admin/quarters?per_page=1000'),
        api.get('/admin/academic-years?per_page=1000')
      ]);
      
      const mappedAssignments = assignRes.data.data.map((a: any) => ({
        id: a.id,
        course_unit_id: a.course_unit_id,
        course_code: a.course_unit ? a.course_unit.code : '',
        course_name: a.course_unit ? a.course_unit.name : '',
        lecturer_id: a.lecturer_id,
        lecturer_name: a.lecturer && a.lecturer.user ? `${a.lecturer.user.first_name} ${a.lecturer.user.last_name}` : '',
        quarter_id: a.quarter_id,
        quarter_name: a.quarter ? a.quarter.name : '',
        academic_year_id: a.academic_year_id,
        academic_year_name: a.academic_year ? a.academic_year.name : '',
        status: a.status
      }));

      const mappedCourseUnits = cuRes.data.data.map((c: any) => ({ id: c.id, code: c.code, name: c.name }));
      const mappedLecturers = lecRes.data.data.map((l: any) => ({ 
        id: l.id, 
        name: l.user ? `${l.user.first_name} ${l.user.last_name}` : l.employee_number 
      }));
      const mappedQuarters = quartRes.data.data.map((q: any) => ({ id: q.id, name: q.name, academic_year_id: q.academic_year_id }));
      const mappedAcademicYears = ayRes.data.data.map((ay: any) => ({ id: ay.id, name: ay.name }));

      setAssignments(mappedAssignments);
      setCourseUnits(mappedCourseUnits);
      setLecturers(mappedLecturers);
      setQuarters(mappedQuarters);
      setAcademicYears(mappedAcademicYears);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any[]) => {
    try {
      setLoading(true);
      const promises = data.map((row) => {
        const lecturer_id = typeof row.lecturer_name === 'number' ? row.lecturer_name : row.lecturer_id;
        const course_unit_id = typeof row.course_name === 'number' ? row.course_name : row.course_unit_id;
        const quarter_id = typeof row.quarter_name === 'number' ? row.quarter_name : row.quarter_id;
        const academic_year_id = typeof row.academic_year_name === 'number' ? row.academic_year_name : row.academic_year_id;

        if (row.id) {
          // Update
          return api.put(`/admin/lecturer-assignments/${row.id}`, {
            lecturer_id,
            course_unit_id,
            quarter_id,
            academic_year_id,
            status: row.status
          });
        } else {
          // Create
          return api.post('/admin/lecturer-assignments', {
            lecturer_id,
            course_unit_id,
            quarter_id,
            academic_year_id,
            status: row.status
          });
        }
      });
      await Promise.all(promises);
      await fetchData();
    } catch (error: any) {
      console.error('Save failed', error);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/lecturer-assignments/${id}`);
    } catch (error: any) {
      console.error('Delete failed', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading lecturer assignments...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Lecturer Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Assign lecturers to specific course units per period (quarter or semester) and academic year.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <CourseAssignmentsGrid 
          initialData={assignments} 
          courseUnits={courseUnits}
          lecturers={lecturers}
          quarters={quarters}
          academicYears={academicYears}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
