'use client';

import { useEffect, useState } from 'react';
import { LecturersGrid } from '@/components/tables/LecturersGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecRes, deptRes] = await Promise.all([
        api.get('/admin/lecturers?per_page=1000'),
        api.get('/admin/departments?per_page=100')
      ]);
      
      const mappedLecturers = lecRes.data.data.map((l: any) => ({
        id: l.id,
        user_id: l.user_id,
        employee_number: l.employee_number,
        first_name: l.user ? l.user.first_name : '',
        last_name: l.user ? l.user.last_name : '',
        email: l.user ? l.user.email : '',
        department_id: l.department_id,
        department_name: l.department ? l.department.name : '',
        title: l.title,
        specialization: l.specialization,
        qualification: l.qualification,
        hire_date: l.hire_date,
        status: l.status
      }));

      const mappedDepartments = deptRes.data.data.map((d: any) => ({ id: d.id, name: d.name }));

      setLecturers(mappedLecturers);
      setDepartments(mappedDepartments);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load data from server');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bulk save: sends all changed/new rows in one API call instead of N calls.
   * This dramatically reduces save time when working with many lecturers.
   */
  const handleSave = async (data: any[]) => {
    try {
      const response = await api.post('/admin/lecturers/bulk', { items: data });

      // Show partial-failure warnings if any rows failed
      const errors: string[] = response.data.errors ?? [];
      if (errors.length > 0) {
        errors.forEach((err: string) => toast.warning(err));
      }

      // Refresh data to reflect DB state
      await fetchData();
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Bulk save failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/lecturers/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading lecturers...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Lecturers</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit lecturer records in bulk.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <LecturersGrid 
          initialData={lecturers} 
          departments={departments}
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
