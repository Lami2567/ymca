'use client';

import { useEffect, useState } from 'react';
import { StudentsGrid } from '@/components/tables/StudentsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stuRes, progRes] = await Promise.all([
        api.get('/admin/students?per_page=1000'),
        api.get('/admin/programs?per_page=1000')
      ]);
      
      const mappedStudents = stuRes.data.data.map((s: any) => ({
        id: s.id,
        student_number: s.student_number,
        first_name: s.user ? s.user.first_name : '',
        last_name: s.user ? s.user.last_name : '',
        email: s.user ? s.user.email : '',
        program_id: s.program_id,
        program_name: s.program ? s.program.name : '',
        admission_date: s.admission_date,
        status: s.status
      }));

      const mappedPrograms = progRes.data.data.map((p: any) => ({ id: p.id, name: p.name }));

      setStudents(mappedStudents);
      setPrograms(mappedPrograms);
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
        const program_id = row.program_id;
        console.log('Saving student:', { id: row.id, program_id, program_name: row.program_name });
        if (row.id) {
          // Update
          return api.put(`/admin/students/${row.id}`, {
            student_number: row.student_number,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            program_id,
            admission_date: row.admission_date,
            status: row.status
          });
        } else {
          // Create
          return api.post('/admin/students', {
            student_number: row.student_number,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            program_id,
            admission_date: row.admission_date,
            status: row.status,
            password: 'password' // Default password for new students
          });
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
      await api.delete(`/admin/students/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading students...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Students</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit student records in bulk.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <StudentsGrid 
          initialData={students} 
          programs={programs}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
