'use client';

import { useEffect, useState } from 'react';
import { QuartersGrid } from '@/components/tables/QuartersGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

export default function QuartersPage() {
  const [quarters, setQuarters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quartRes, ayRes] = await Promise.all([
        api.get('/admin/quarters?per_page=1000'),
        api.get('/admin/academic-years?per_page=100')
      ]);

      const mappedQuarters = quartRes.data.data.map((q: any) => ({
        ...q,
        // period_type defaults to 'quarter' for legacy records without the field
        period_type:        q.period_type ?? 'quarter',
        academic_year_name: q.academic_year ? q.academic_year.name : '',
      }));

      const mappedAcademicYears = ayRes.data.data.map((ay: any) => ({
        id:   ay.id,
        name: ay.name,
      }));

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
        // Resolve academic_year_id (may be stored in academic_year_name)
        const academic_year_id =
          typeof row.academic_year_name === 'number'
            ? row.academic_year_name
            : row.academic_year_id;

        const payload = {
          academic_year_id,
          period_type: row.period_type ?? 'quarter',
          name:        row.name,
          number:      parseInt(String(row.number), 10) || 1,
          start_date:  row.start_date,
          end_date:    row.end_date,
          is_current:  !!row.is_current,
          status:      row.status ?? 'active',
        };

        if (row.id) {
          return api.put(`/admin/quarters/${row.id}`, payload);
        } else {
          return api.post('/admin/quarters', payload);
        }
      });

      await Promise.all(promises);
      await fetchData();
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Save failed:', msg, error);
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/quarters/${id}`);
    } catch (error: any) {
      const msg = parseApiError(error);
      console.error('Delete failed:', msg, error);
      toast.error(msg);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading academic periods...</div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Academic Periods</h1>
          <p className="text-muted-foreground mt-1">
            Create quarters (4/yr) or semesters (2/yr) within academic years.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <QuartersGrid
          initialData={quarters}
          academicYears={academicYears}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
