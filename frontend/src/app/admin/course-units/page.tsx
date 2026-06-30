'use client';

import { useEffect, useState } from 'react';
import { CourseUnitsGrid } from '@/components/tables/CourseUnitsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function CourseUnitsPage() {
  const [courseUnits, setCourseUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cuRes, deptRes, progRes, quartRes] = await Promise.all([
        api.get('/admin/course-units?per_page=1000'),
        api.get('/admin/departments?per_page=100'),
        api.get('/admin/programs?per_page=1000'),
        api.get('/admin/quarters?per_page=1000')
      ]);
      
      const mappedCourseUnits = cuRes.data.data.map((cu: any) => ({
        ...cu,
        department_name: cu.department ? cu.department.name : '',
        program_name: cu.program ? cu.program.name : '',
        quarter_name: cu.quarter ? cu.quarter.name : '',
      }));

      const mappedDepartments = deptRes.data.data.map((d: any) => ({ id: d.id, name: d.name }));
      const mappedPrograms = progRes.data.data.map((p: any) => ({ id: p.id, name: p.name }));
      const mappedQuarters = quartRes.data.data.map((q: any) => ({ id: q.id, name: q.name }));

      setCourseUnits(mappedCourseUnits);
      setDepartments(mappedDepartments);
      setPrograms(mappedPrograms);
      setQuarters(mappedQuarters);
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
        const department_id = typeof row.department_name === 'number' ? row.department_name : row.department_id;
        const program_id = typeof row.program_name === 'number' ? row.program_name : row.program_id;
        const quarter_id = typeof row.quarter_name === 'number' ? row.quarter_name : row.quarter_id;
        
        const payload = {
          department_id,
          program_id,
          year_of_study: row.year_of_study,
          quarter_id,
          code: row.code,
          name: row.name,
          credit_units: row.credit_units,
          description: row.description,
          prerequisites: row.prerequisites,
          status: row.status
        };

        if (row.id) {
          // Update
          return api.put(`/admin/course-units/${row.id}`, payload);
        } else {
          // Create
          return api.post('/admin/course-units', payload);
        }
      });
      await Promise.all(promises);
      await fetchData();
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Save failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/course-units/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading course units...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Course Units</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit course units across different programs and quarters.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <CourseUnitsGrid 
          initialData={courseUnits} 
          departments={departments}
          programs={programs}
          quarters={quarters}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
