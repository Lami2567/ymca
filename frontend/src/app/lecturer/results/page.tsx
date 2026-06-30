'use client';

import { useEffect, useState, Suspense } from 'react';
import { ResultsGrid } from '@/components/tables/ResultsGrid';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, AlertCircle, Sparkles } from 'lucide-react';

interface WeightConfig {
  cw1_weight: number;
  cw2_weight: number;
  cw3_weight: number;
  cw4_weight: number;
  test_weight: number;
  exam_weight: number;
}

function LecturerResultsContent() {
  const searchParams = useSearchParams();
  const courseUnitId = searchParams.get('course_unit_id');
  const quarterId = searchParams.get('quarter_id');
  const academicYearId = searchParams.get('academic_year_id');

  const [students, setStudents] = useState<any[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Assessment weights state
  const [weights, setWeights] = useState<WeightConfig>({
    cw1_weight: 20,
    cw2_weight: 20,
    cw3_weight: 0,
    cw4_weight: 0,
    test_weight: 20,
    exam_weight: 40,
  });

  useEffect(() => {
    if (courseUnitId && quarterId && academicYearId) {
      fetchData(Number(courseUnitId), Number(quarterId), Number(academicYearId));
      fetchAssessmentConfig(Number(courseUnitId), Number(quarterId), Number(academicYearId));
    } else {
      setLoading(false);
    }
  }, [courseUnitId, quarterId, academicYearId]);

  const fetchAssessmentConfig = async (cId: number, qId: number, aId: number) => {
    try {
      const res = await api.get('/lecturer/assessment-configurations', {
        params: { course_unit_id: cId, quarter_id: qId, academic_year_id: aId }
      });
      // The backend index returns a paginated list of items under data
      const items = res.data.data || [];
      if (items.length > 0) {
        const cfg = items[0];
        setWeights({
          cw1_weight: parseFloat(cfg.cw1_weight) || 0,
          cw2_weight: parseFloat(cfg.cw2_weight) || 0,
          cw3_weight: parseFloat(cfg.cw3_weight) || 0,
          cw4_weight: parseFloat(cfg.cw4_weight) || 0,
          test_weight: parseFloat(cfg.test_weight) || 0,
          exam_weight: parseFloat(cfg.exam_weight) || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load assessment configuration', error);
    }
  };

  const handleSaveWeights = async () => {
    if (!courseUnitId || !quarterId || !academicYearId) return;

    const total = 
      weights.cw1_weight + 
      weights.cw2_weight + 
      weights.cw3_weight + 
      weights.cw4_weight + 
      weights.test_weight + 
      weights.exam_weight;

    if (Math.abs(total - 100) > 0.01) {
      toast.error(`The sum of all weights must equal exactly 100%. Currently: ${total}%`);
      return;
    }

    try {
      setConfigLoading(true);
      await api.post('/lecturer/assessment-configurations', {
        course_unit_id: Number(courseUnitId),
        quarter_id: Number(quarterId),
        academic_year_id: Number(academicYearId),
        ...weights
      });
      
      toast.success('Assessment configuration saved successfully!');
      setShowConfigPanel(false);
      
      // Refresh students/grades so they recalculate with the new weights
      await fetchData(Number(courseUnitId), Number(quarterId), Number(academicYearId));
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to save weights';
      toast.error(msg);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchData = async (cId: number, qId: number, aId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/lecturer/course-units/${cId}/students`, {
        params: { quarter_id: qId, academic_year_id: aId }
      });
      
      const enrollments = res.data.data;

      const courseRes = await api.get(`/course-units/${cId}`);
      setCourseInfo(courseRes.data.data);
      
      const mappedResults = enrollments.map((e: any) => {
        const r = e.result || {};
        return {
          id: r.id || 0,
          enrollment_id: e.id,
          student_number: e.student ? e.student.student_number : '',
          student_name: e.student && e.student.user ? `${e.student.user.first_name} ${e.student.user.last_name}` : '',
          cw1_score: r.cw1_score !== null && r.cw1_score !== undefined ? parseFloat(r.cw1_score) : null,
          cw2_score: r.cw2_score !== null && r.cw2_score !== undefined ? parseFloat(r.cw2_score) : null,
          cw3_score: r.cw3_score !== null && r.cw3_score !== undefined ? parseFloat(r.cw3_score) : null,
          cw4_score: r.cw4_score !== null && r.cw4_score !== undefined ? parseFloat(r.cw4_score) : null,
          test_score: r.test_score !== null && r.test_score !== undefined ? parseFloat(r.test_score) : null,
          exam_score: r.exam_score !== null && r.exam_score !== undefined ? parseFloat(r.exam_score) : null,
          total_score: r.total_score !== null && r.total_score !== undefined ? parseFloat(r.total_score) : 0,
          grade: r.grade || '',
          status: r.status || 'draft'
        };
      });

      setStudents(mappedResults);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load students for this course');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any[]) => {
    if (!courseUnitId || !quarterId || !academicYearId) return;

    try {
      const payload = {
        results: data.map(row => ({
          enrollment_id: row.enrollment_id,
          cw1_score: row.cw1_score,
          cw2_score: row.cw2_score,
          cw3_score: row.cw3_score,
          cw4_score: row.cw4_score,
          test_score: row.test_score,
          exam_score: row.exam_score,
        }))
      };

      await api.post(`/lecturer/results/bulk`, payload);
      await fetchData(Number(courseUnitId), Number(quarterId), Number(academicYearId));
    } catch (error: any) {
      console.error('Save failed', error);
      throw error;
    }
  };

  if (!courseUnitId || !quarterId || !academicYearId) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Missing Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            Please navigate to this page from the 'My Courses' section to ensure the correct course, quarter, and academic year are selected.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading students and results...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Enter Results</h1>
          <p className="text-muted-foreground mt-1">
            {courseInfo ? `${courseInfo.code} - ${courseInfo.name}` : 'Loading course details...'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className="mt-4 md:mt-0"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Configure Assessment Weights
        </Button>
      </div>

      {/* Assessment Weights Configuration Panel */}
      {showConfigPanel && (
        <Card className="shadow-md border-primary/25 bg-slate-50/50 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary animate-pulse" />
              Customize Assessment Components
            </CardTitle>
            <CardDescription>
              Assign weightings to the different components. Ensure the total equals exactly 100%. Set a component to 0% to disable it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">CW1 Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.cw1_weight}
                  onChange={(e) => setWeights({ ...weights, cw1_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">CW2 Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.cw2_weight}
                  onChange={(e) => setWeights({ ...weights, cw2_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">CW3 Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.cw3_weight}
                  onChange={(e) => setWeights({ ...weights, cw3_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">CW4 Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.cw4_weight}
                  onChange={(e) => setWeights({ ...weights, cw4_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Test Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.test_weight}
                  onChange={(e) => setWeights({ ...weights, test_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Exam Weight (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.exam_weight}
                  onChange={(e) => setWeights({ ...weights, exam_weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center text-sm gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  Total Weight:{' '}
                  <span
                    className={
                      weights.cw1_weight +
                        weights.cw2_weight +
                        weights.cw3_weight +
                        weights.cw4_weight +
                        weights.test_weight +
                        weights.exam_weight ===
                      100
                        ? 'text-emerald-600'
                        : 'text-red-500 font-bold'
                    }
                  >
                    {weights.cw1_weight +
                      weights.cw2_weight +
                      weights.cw3_weight +
                      weights.cw4_weight +
                      weights.test_weight +
                      weights.exam_weight}
                    %
                  </span>
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowConfigPanel(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveWeights} disabled={configLoading}>
                  {configLoading ? 'Saving...' : 'Apply Weighting'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List & Results Entry Grid */}
      <div className="flex-1">
        <ResultsGrid
          courseUnitId={Number(courseUnitId)}
          quarterId={Number(quarterId)}
          academicYearId={Number(academicYearId)}
          initialData={students}
          onSave={handleSave}
          weights={weights}
        />
      </div>
    </div>
  );
}

export default function LecturerResultsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <LecturerResultsContent />
    </Suspense>
  );
}
