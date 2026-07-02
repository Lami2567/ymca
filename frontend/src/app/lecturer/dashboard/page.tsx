'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, ArrowRight, LogOut, ChevronDown, BarChart2, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import logo from '@/components/YMCA-logo.png.webp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface Assignment {
  id: number;
  course_unit_id: number;
  course_code: string;
  course_name: string;
  quarter_id: number;
  quarter_name: string;
  academic_year_id: number;
  academic_year_name: string;
  credit_units: number;
}

interface StudentResult {
  id: number;
  enrollment_id: number;
  student_number: string;
  student_name: string;
  total_score: number | null;
  grade: string;
}

export default function LecturerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  // Dashboard overall state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Tabs & Analytics state
  const [activeTab, setActiveTab] = useState<'assignments' | 'analytics'>('assignments');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [analyticsStudents, setAnalyticsStudents] = useState<StudentResult[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics' && selectedAssignmentId) {
      fetchAnalyticsData(Number(selectedAssignmentId));
    }
  }, [activeTab, selectedAssignmentId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lecturer/assignments');
      
      const mapped = response.data.data.map((a: any) => ({
        id: a.id,
        course_unit_id: a.course_unit_id,
        course_code: a.course_unit?.code || 'N/A',
        course_name: a.course_unit?.name || 'Unknown Course',
        quarter_id: a.quarter_id,
        quarter_name: a.quarter?.name || 'N/A',
        academic_year_id: a.academic_year_id,
        academic_year_name: a.academic_year?.name || 'N/A',
        credit_units: a.course_unit?.credit_units || 0,
      }));

      setAssignments(mapped);
      
      if (mapped.length > 0) {
        setSelectedAssignmentId(mapped[0].id.toString());
      }

      // Fetch student counts for each course in parallel to sum up total students
      let studentsSum = 0;
      const countPromises = mapped.map(async (assign: Assignment) => {
        try {
          const res = await api.get(`/lecturer/course-units/${assign.course_unit_id}/students`, {
            params: {
              quarter_id: assign.quarter_id,
              academic_year_id: assign.academic_year_id,
            },
          });
          return res.data.data?.length || 0;
        } catch {
          return 0;
        }
      });

      const counts = await Promise.all(countPromises);
      studentsSum = counts.reduce((acc, curr) => acc + curr, 0);
      setTotalStudents(studentsSum);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async (assignmentId: number) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    try {
      setAnalyticsLoading(true);
      const res = await api.get(`/lecturer/course-units/${assignment.course_unit_id}/students`, {
        params: {
          quarter_id: assignment.quarter_id,
          academic_year_id: assignment.academic_year_id,
        },
      });

      const enrollments = res.data.data || [];
      const mapped = enrollments.map((e: any) => {
        const r = e.result || {};
        return {
          id: r.id || 0,
          enrollment_id: e.id,
          student_number: e.student ? e.student.student_number : '',
          student_name: e.student && e.student.user ? `${e.student.user.first_name} ${e.student.user.last_name}` : '',
          total_score: r.total_score !== null && r.total_score !== undefined ? parseFloat(r.total_score) : null,
          grade: r.grade || '',
        };
      });

      setAnalyticsStudents(mapped);
    } catch (error) {
      console.error('Failed to fetch analytics data', error);
      toast.error('Failed to load students for analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const computeDistribution = () => {
    let count80_100 = 0;
    let count70_79 = 0;
    let count60_69 = 0;
    let count50_59 = 0;
    let count45_49 = 0;
    let count40_44 = 0;
    let countBelow40 = 0;

    analyticsStudents.forEach(student => {
      const score = student.total_score !== null && student.total_score !== undefined ? student.total_score : 0;
      if (score >= 80 && score <= 100) {
        count80_100++;
      } else if (score >= 70 && score < 80) {
        count70_79++;
      } else if (score >= 60 && score < 70) {
        count60_69++;
      } else if (score >= 50 && score < 60) {
        count50_59++;
      } else if (score >= 45 && score < 50) {
        count45_49++;
      } else if (score >= 40 && score < 45) {
        count40_44++;
      } else {
        countBelow40++;
      }
    });

    const total = analyticsStudents.length;
    const passCount = total - countBelow40;
    const failCount = countBelow40;

    const passPercentage = total > 0 ? parseFloat(((passCount / total) * 100).toFixed(1)) : 0;
    const failPercentage = total > 0 ? parseFloat(((failCount / total) * 100).toFixed(1)) : 0;

    return {
      total,
      count80_100,
      count70_79,
      count60_69,
      count50_59,
      count45_49,
      count40_44,
      countBelow40,
      passPercentage,
      failPercentage,
      passCount,
      failCount,
    };
  };

  const stats = computeDistribution();

  const chartData = [
    { name: 'Below 40', count: stats.countBelow40, percentage: stats.total > 0 ? ((stats.countBelow40 / stats.total) * 100).toFixed(1) : '0', color: '#ef4444' },
    { name: '40 - 44', count: stats.count40_44, percentage: stats.total > 0 ? ((stats.count40_44 / stats.total) * 100).toFixed(1) : '0', color: '#f97316' },
    { name: '45 - 49', count: stats.count45_49, percentage: stats.total > 0 ? ((stats.count45_49 / stats.total) * 100).toFixed(1) : '0', color: '#eab308' },
    { name: '50 - 59', count: stats.count50_59, percentage: stats.total > 0 ? ((stats.count50_59 / stats.total) * 100).toFixed(1) : '0', color: '#0ea5e9' },
    { name: '60 - 69', count: stats.count60_69, percentage: stats.total > 0 ? ((stats.count60_69 / stats.total) * 100).toFixed(1) : '0', color: '#14b8a6' },
    { name: '70 - 79', count: stats.count70_79, percentage: stats.total > 0 ? ((stats.count70_79 / stats.total) * 100).toFixed(1) : '0', color: '#0d9488' },
    { name: '80 - 100', count: stats.count80_100, percentage: stats.total > 0 ? ((stats.count80_100 / stats.total) * 100).toFixed(1) : '0', color: '#0f766e' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse font-outfit">Loading dashboard...</div>
      </div>
    );
  }

  const selectedAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-1 shadow-md border border-gray-100 flex items-center justify-center shrink-0">
            <Image 
              src={logo} 
              alt="YMCA Logo" 
              className="object-contain" 
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary font-outfit">Lecturer Dashboard</h1>
            <p className="text-muted-foreground mt-0.5">
              Welcome back, {user ? `${user.first_name} ${user.last_name}` : 'Lecturer'} (Lecturer)
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Button
            variant="outline"
            className="text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-gray-700'
          }`}
        >
          My Assignments
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-gray-700'
          }`}
        >
          Student Analytics
        </button>
      </div>

      {activeTab === 'assignments' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all academic periods</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students Enrolled</CardTitle>
                <Users className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">Students attending your courses</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Supervised</CardTitle>
                <FileText className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assignments.reduce((sum, a) => sum + a.credit_units, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total credit units assigned</p>
              </CardContent>
            </Card>
          </div>

          {/* Courses List */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>My Course Assignments</CardTitle>
              <CardDescription>Select a course assignment below to view enrolled students and enter marks.</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  No course assignments found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-col justify-between p-5 border rounded-xl hover:bg-slate-50/50 hover:border-primary/20 transition-all group cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/lecturer/results?course_unit_id=${assignment.course_unit_id}&quarter_id=${assignment.quarter_id}&academic_year_id=${assignment.academic_year_id}`
                        )
                      }
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                          {assignment.course_code}
                        </span>
                        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors pt-1">
                          {assignment.course_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.academic_year_name} • {assignment.quarter_name}
                        </p>
                      </div>
                      <div className="pt-6 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{assignment.credit_units} Credit Units</span>
                        <span className="flex items-center text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                          Enter Results
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Dropdown Course Selector */}
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6">
              {assignments.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No course assignments found to analyze.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-800 font-outfit">Filter Course Unit Assignment</h3>
                    <p className="text-xs text-muted-foreground">Analyze and visualize student score distribution for your courses.</p>
                  </div>
                  <div className="w-full md:w-[450px]">
                    <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                      <SelectTrigger className="w-full border-gray-200 shadow-sm focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select an assigned course" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[450px]">
                        {assignments.map((assign) => (
                          <SelectItem key={assign.id} value={assign.id.toString()}>
                            {assign.course_code} - {assign.course_name} ({assign.academic_year_name} • {assign.quarter_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAssignment && (
            <>
              {analyticsLoading ? (
                <div className="p-12 flex items-center justify-center min-h-[300px]">
                  <div className="text-muted-foreground animate-pulse font-outfit">Loading analytics data...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {/* Candidates Score Distribution Table */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold font-outfit text-gray-800">Score Distribution Analysis</CardTitle>
                      <CardDescription>
                        Summary of candidate achievements in {selectedAssignment.course_code} - {selectedAssignment.course_name} ({selectedAssignment.academic_year_name} • {selectedAssignment.quarter_name})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 border-collapse text-center table-fixed">
                          <thead className="bg-slate-50">
                            <tr>
                              <th colSpan={10} className="py-3 px-4 border-b border-gray-200 font-bold uppercase text-gray-700 tracking-wider text-sm">
                                CANDIDATE(S) SCORE DISTRIBUTION
                              </th>
                            </tr>
                            <tr className="divide-x divide-gray-200 text-[10px] sm:text-xs font-bold text-gray-600 uppercase bg-slate-100">
                              <th className="py-3 px-1 border-b border-gray-200">Total Candidates</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 80 - 100</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 70 - 79</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 60 - 69</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 50 - 59</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 45 - 49</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE 40 - 44</th>
                              <th className="py-3 px-1 border-b border-gray-200">SCORE Below 40</th>
                              <th className="py-3 px-1 border-b border-gray-200">% Pass</th>
                              <th className="py-3 px-1 border-b border-gray-200">% Fail</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 font-semibold text-gray-800 text-sm">
                            <tr className="divide-x divide-gray-200 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-1 font-bold text-base text-gray-900 bg-slate-50/50">{stats.total}</td>
                              <td className="py-4 px-1">{stats.count80_100}</td>
                              <td className="py-4 px-1">{stats.count70_79}</td>
                              <td className="py-4 px-1">{stats.count60_69}</td>
                              <td className="py-4 px-1">{stats.count50_59}</td>
                              <td className="py-4 px-1">{stats.count45_49}</td>
                              <td className="py-4 px-1">{stats.count40_44}</td>
                              <td className="py-4 px-1 text-red-600 bg-red-50/30">{stats.countBelow40}</td>
                              <td className="py-4 px-1 font-bold text-emerald-600 bg-emerald-50/20">{stats.passPercentage}%</td>
                              <td className="py-4 px-1 font-bold text-red-600 bg-red-50/20">{stats.failPercentage}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Graphical Visualization Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recharts Thin Graph Card */}
                    <Card className="shadow-sm border-gray-100 lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold font-outfit text-gray-800 flex items-center gap-2">
                          <BarChart2 className="h-5 w-5 text-primary" />
                          Distribution Visualization
                        </CardTitle>
                        <CardDescription>
                          A thin, horizontal visualization of the candidate score brackets.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {stats.total === 0 ? (
                          <div className="h-[220px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                            No students registered yet.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                              layout="vertical"
                              data={chartData}
                              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                              <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] text-gray-400" />
                              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs font-semibold text-gray-600" />
                              <Tooltip
                                cursor={{ fill: 'rgba(0, 102, 102, 0.03)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md text-xs space-y-1">
                                        <p className="font-bold text-gray-800">{data.name}</p>
                                        <p className="text-gray-600">Students: <span className="font-bold text-primary">{data.count}</span></p>
                                        <p className="text-gray-600">Percentage: <span className="font-bold text-emerald-600">{data.percentage}%</span></p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={10}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Overall Summary Card */}
                    <Card className="shadow-sm border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold font-outfit text-gray-800">Overall Statistics</CardTitle>
                        <CardDescription>
                          A brief performance synopsis of the class.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {stats.total === 0 ? (
                          <div className="py-12 text-center text-muted-foreground">
                            No data available.
                          </div>
                        ) : (
                          <>
                            {/* Pass Rate Metric */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center text-emerald-700 gap-1.5">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Pass Rate
                                </span>
                                <span className="text-emerald-700 font-bold">{stats.passPercentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-600 transition-all duration-500" 
                                  style={{ width: `${stats.passPercentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stats.passCount} of {stats.total} students passed (Score &ge; 40).
                              </p>
                            </div>

                            {/* Fail Rate Metric */}
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center text-red-700 gap-1.5">
                                  <AlertTriangle className="h-4 w-4" />
                                  Fail Rate
                                </span>
                                <span className="text-red-700 font-bold">{stats.failPercentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-600 transition-all duration-500" 
                                  style={{ width: `${stats.failPercentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stats.failCount} of {stats.total} students failed (Score &lt; 40).
                              </p>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-start gap-2.5 text-xs text-slate-600">
                              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-gray-800">Insights: </span>
                                {stats.passPercentage >= 75 ? (
                                  <span>The class is showing strong performance, with over 75% passing. Keep up the good work!</span>
                                ) : stats.passPercentage >= 50 ? (
                                  <span>Moderate performance overall. Consider targeting support for students in the 40-49 brackets.</span>
                                ) : (
                                  <span className="text-red-600 font-medium">Attention required: More than half the candidates are currently failing this course. Review assessment metrics.</span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

