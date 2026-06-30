'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminResultsGrid } from '@/components/tables/AdminResultsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch results that are not in draft status, meaning they have been submitted for review
      // For a real production app, we might want to filter this on the backend
      const res = await api.get('/admin/results?per_page=1000');
      
      const mappedResults = res.data.data
        // .filter((r: any) => r.status !== 'draft') // Only show submitted/review/approved/published
        .map((r: any) => ({
          id: r.id,
          student_number: r.student ? r.student.student_number : '',
          student_name: r.student && r.student.user ? `${r.student.user.first_name} ${r.student.user.last_name}` : '',
          course_code: r.course_unit ? r.course_unit.code : '',
          course_name: r.course_unit ? r.course_unit.name : '',
          quarter_name: r.quarter ? r.quarter.name : '',
          academic_year_name: r.academic_year ? r.academic_year.name : '',
          total_score: r.total_score,
          grade: r.grade,
          status: r.status
        }));

      setResults(mappedResults);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load results from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    await api.post(`/admin/results/${id}/approve`);
  };

  const handlePublish = async (id: number) => {
    await api.post(`/admin/results/${id}/publish`);
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Results Workflow Approval</h1>
          <p className="text-muted-foreground mt-1">
            Review submitted student results, approve, and publish them.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <AdminResultsGrid 
          initialData={results} 
          onApprove={handleApprove}
          onPublish={handlePublish}
          onRefresh={fetchData}
          loadingData={loading}
        />
      </div>
    </div>
  );
}
