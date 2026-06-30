'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, TrendingUp, GraduationCap, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { cn, getGradeClass, getStatusColor } from '@/lib/utils';
import { StudentLayout } from '@/components/StudentLayout';

interface Enrollment {
  id: number;
  course_unit: {
    code: string;
    name: string;
    credit_units: number;
  };
  status: string;
  result?: {
    cw1_score: string | number | null;
    cw2_score: string | number | null;
    cw3_score: string | number | null;
    cw4_score: string | number | null;
    test_score: string | number | null;
    exam_score: string | number | null;
    total_score: string | number | null;
    grade: string | null;
    status: string;
  } | null;
}

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
  total_score: number;
  grade: string;
  grade_points: number;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [gpa, setGpa] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const [enrollmentsRes, resultsRes, gpaRes] = await Promise.all([
        api.get('/student/enrollments'),
        api.get('/student/results'),
        api.get('/student/gpa'),
      ]);

      setEnrollments(enrollmentsRes.data.data);
      setResults(resultsRes.data.data);
      setGpa(gpaRes.data.data.gpa || 0);
    } catch (error) {
      console.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandEnrollment = (id: number) => {
    setExpandedEnrollmentId(expandedEnrollmentId === id ? null : id);
  };

  // Helper to format score value
  const formatScore = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '-';
    const num = parseFloat(String(val));
    return isNaN(num) ? '-' : `${num}%`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading student portal...</div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Student Portal</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.first_name} {user?.last_name}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/student/enrollment">
            <Card className="shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registered Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enrollments.length}</div>
                <div className="text-xs text-muted-foreground mt-2 group-hover:text-primary transition-colors">
                  View enrollments →
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/student/results">
            <Card className="shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current GPA</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{gpa.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-2 group-hover:text-primary transition-colors">
                  View results →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/student/results">
            <Card className="shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Courses</CardTitle>
                <FileText className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.length}</div>
                <div className="text-xs text-muted-foreground mt-2 group-hover:text-primary transition-colors">
                  View transcript →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/student/profile">
            <Card className="shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credit Units</CardTitle>
                <GraduationCap className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {enrollments.reduce((sum, e) => sum + (e.course_unit?.credit_units || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-2 group-hover:text-primary transition-colors">
                  View profile →
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Enrollments card */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Current Enrollments</CardTitle>
            <CardDescription>Click on a course below to view your current continuous assessment marks.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No current enrollments.</p>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const isExpanded = expandedEnrollmentId === enrollment.id;
                  const res = enrollment.result;
                  return (
                    <div
                      key={enrollment.id}
                      className="border rounded-xl p-4 transition-all duration-200 hover:border-primary/20 bg-white"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer select-none"
                        onClick={() => toggleExpandEnrollment(enrollment.id)}
                      >
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base text-gray-800">{enrollment.course_unit?.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.course_unit?.code} • {enrollment.course_unit?.credit_units} Credits
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                              getStatusColor(enrollment.status)
                            )}
                          >
                            {enrollment.status}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Scorecard breakdown */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-4 animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Progress Scorecard</span>
                          </div>
                          
                          {!res ? (
                            <div className="text-center text-xs text-muted-foreground py-3 bg-slate-50/50 rounded-lg">
                              No marks entered for this course unit yet.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CW1</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.cw1_score)}</div>
                                </div>
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CW2</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.cw2_score)}</div>
                                </div>
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CW3</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.cw3_score)}</div>
                                </div>
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CW4</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.cw4_score)}</div>
                                </div>
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Test</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.test_score)}</div>
                                </div>
                                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Exam</div>
                                  <div className="text-sm font-semibold text-gray-800">{formatScore(res.exam_score)}</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 mt-2">
                                <div className="text-xs">
                                  <span className="font-semibold text-gray-700">Total Weighted Score:</span>
                                  <span className="ml-2 font-bold text-primary text-sm">
                                    {res.total_score !== null ? `${parseFloat(String(res.total_score)).toFixed(1)}%` : '-'}
                                  </span>
                                </div>
                                {res.grade && (
                                  <span className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
                                    getGradeClass(res.grade)
                                  )}>
                                    Grade {res.grade}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results card */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Your officially published final grades.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No results available yet.</p>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">{result.course_unit?.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.course_unit?.code} • {result.quarter?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
                          getGradeClass(result.grade)
                        )}
                      >
                        {result.grade}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                        {result.total_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </StudentLayout>
  );
}
