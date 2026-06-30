'use client';

import { useEffect, useState } from 'react';
import { AcademicYearsGrid } from '@/components/tables/AcademicYearsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/academic-years?per_page=100');
      setAcademicYears(response.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load academic years from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any[]) => {
    try {
      setLoading(true);
      const promises = data.map((row) => {
        if (row.id) {
          // Update
          return api.put(`/admin/academic-years/${row.id}`, {
            name: row.name,
            start_date: row.start_date,
            end_date: row.end_date,
            is_current: row.is_current,
            status: row.status
          });
        } else {
          // Create
          return api.post('/admin/academic-years', {
            name: row.name,
            start_date: row.start_date,
            end_date: row.end_date,
            is_current: row.is_current,
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
      await api.delete(`/admin/academic-years/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading academic years...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Academic Years</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit academic years in bulk.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <AcademicYearsGrid 
          initialData={academicYears} 
          onSave={handleSave} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
