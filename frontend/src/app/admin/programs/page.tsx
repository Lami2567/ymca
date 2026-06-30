'use client';

import { useEffect, useState } from 'react';
import { ProgramsGrid } from '@/components/tables/ProgramsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([
        api.get('/admin/programs?per_page=1000'),
        api.get('/admin/departments?per_page=100')
      ]);
      
      const mappedPrograms = progRes.data.data.map((p: any) => ({
        ...p,
        department_name: p.department ? p.department.name : ''
      }));

      const mappedDepartments = deptRes.data.data.map((d: any) => ({
        id: d.id,
        name: d.name
      }));

      setPrograms(mappedPrograms);
      setDepartments(mappedDepartments);
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
        if (row.id) {
          // Update
          return api.put(`/admin/programs/${row.id}`, {
            department_id,
            code: row.code,
            name: row.name,
            type: row.type,
            duration_years: row.duration_years,
            description: row.description,
            status: row.status
          });
        } else {
          // Create
          return api.post('/admin/programs', {
            department_id,
            code: row.code,
            name: row.name,
            type: row.type,
            duration_years: row.duration_years,
            description: row.description,
            status: row.status
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
      await api.delete(`/admin/programs/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading programs...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Programs</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit university academic programs in bulk.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ProgramsGrid 
          initialData={programs} 
          departments={departments}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
