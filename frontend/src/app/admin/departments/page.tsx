'use client';

import { useEffect, useState } from 'react';
import { DepartmentsGrid } from '@/components/tables/DepartmentsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, lecRes] = await Promise.all([
        api.get('/admin/departments?per_page=100'),
        api.get('/admin/lecturers?per_page=1000')
      ]);
      
      const mappedDepartments = deptRes.data.data.map((d: any) => ({
        ...d,
        head_name: d.head ? d.head.first_name + ' ' + d.head.last_name : ''
      }));

      const mappedLecturers = lecRes.data.data.map((l: any) => ({
        id: l.id,
        name: l.user ? l.user.first_name + ' ' + l.user.last_name : 'Unknown'
      }));

      setDepartments(mappedDepartments);
      setLecturers(mappedLecturers);
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
        const head_id = typeof row.head_name === 'number' ? row.head_name : row.head_id;
        if (row.id) {
          // Update
          return api.put(`/admin/departments/${row.id}`, {
            code: row.code,
            name: row.name,
            description: row.description,
            head_id,
            status: row.status
          });
        } else {
          // Create
          return api.post('/admin/departments', {
            code: row.code,
            name: row.name,
            description: row.description,
            head_id,
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
      await api.delete(`/admin/departments/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading departments...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Departments</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit university departments in bulk.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <DepartmentsGrid 
          initialData={departments} 
          lecturers={lecturers}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
