'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { StudentLayout } from '@/components/StudentLayout';

interface Result {
  id: number;
  course_unit: {
    code: string;
    name: string;
    credit_units: number;
  };
  quarter: {
    name: string;
  };
  academic_year: {
    name: string;
  };
  cw1_score: number | null;
  cw2_score: number | null;
  cw3_score: number | null;
  cw4_score: number | null;
  test_score: number | null;
  exam_score: number | null;
  total_score: number;
  grade: string;
  grade_points: number;
}

interface TranscriptData {
  student: any;
  results: Result[];
  gpa: number;
}

export default function StudentResultsPage() {
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/transcript');
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch transcript', error);
      toast.error('Failed to load your results');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8">Loading your academic record...</div>;
  }

  if (!data || !data.student) {
    return (
      <StudentLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground opacity-40" />
            <h2 className="text-xl font-semibold text-gray-700">No Academic Records Yet</h2>
            <p className="text-muted-foreground">Your transcript will appear here once results have been published by your lecturer.</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Group results by Academic Year and Quarter
  const groupedResults: Record<string, Result[]> = {};
  
  if (data.results && data.results.length > 0) {
    data.results.forEach(result => {
      const termKey = `${result.academic_year?.name || 'Unknown'} - ${result.quarter?.name || 'Unknown'}`;
      if (!groupedResults[termKey]) {
        groupedResults[termKey] = [];
      }
      groupedResults[termKey].push(result);
    });
  }

  return (
    <StudentLayout>
      <div className="p-8 max-w-5xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-primary">Academic Results</h1>
            <p className="text-muted-foreground mt-1">
              View your published results and academic transcript.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Transcript
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

      {/* Printable Area */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b pb-6 mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-primary">YMCA University</h2>
          <h3 className="text-xl text-gray-600 mt-2">Official Academic Transcript</h3>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p><span className="font-semibold text-gray-600 w-32 inline-block">Student Name:</span> {data.student.user?.first_name} {data.student.user?.last_name}</p>
            <p><span className="font-semibold text-gray-600 w-32 inline-block">Student Number:</span> {data.student.student_number}</p>
            <p><span className="font-semibold text-gray-600 w-32 inline-block">Program:</span> {data.student.program?.name}</p>
          </div>
          <div>
            <p><span className="font-semibold text-gray-600 w-32 inline-block">Current Year:</span> Year {data.student.current_year_of_study}</p>
            <p><span className="font-semibold text-gray-600 w-32 inline-block">Admission Date:</span> {data.student.admission_date}</p>
            <p className="mt-2 pt-2 border-t"><span className="font-bold text-gray-800 w-32 inline-block">Cumulative GPA:</span> <span className="font-bold text-primary text-lg">{data.gpa.toFixed(2)}</span></p>
          </div>
        </div>

        {/* Results by Term */}
        {Object.keys(groupedResults).length === 0 ? (
          <div className="py-12 text-center text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No published results available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedResults).map(([term, results]) => (
              <div key={term} className="break-inside-avoid">
                <h4 className="font-bold text-lg border-b pb-2 mb-4 text-gray-800 flex items-center">
                  <span className="w-2 h-6 bg-primary mr-3 rounded-full inline-block"></span>
                  {term}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-y">
                      <tr>
                        <th className="py-3 px-4">Course Code</th>
                        <th className="py-3 px-4 w-1/3">Course Name</th>
                        <th className="py-3 px-4 text-center">Credits</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Grade</th>
                        <th className="py-3 px-4 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.map((r, idx) => (
                        <tr key={r.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-medium">{r.course_unit?.code}</td>
                          <td className="py-3 px-4">{r.course_unit?.name}</td>
                          <td className="py-3 px-4 text-center">{r.course_unit?.credit_units}</td>
                          <td className="py-3 px-4 text-center font-semibold">{r.total_score}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded font-bold text-xs ${
                              ['A+', 'A', 'B+', 'B'].includes(r.grade) ? 'bg-green-100 text-green-800' :
                              ['C+', 'C'].includes(r.grade) ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium">{r.grade_points.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </StudentLayout>
  );
}
