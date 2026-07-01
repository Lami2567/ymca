'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, PlusCircle, CheckCircle2 } from 'lucide-react';
import { StudentLayout } from '@/components/StudentLayout';

interface CourseUnit {
  id: number;
  code: string;
  name: string;
  credit_units: number;
  year_of_study: number;
}

interface Quarter {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

export default function StudentEnrollmentPage() {
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  
  const [currentQuarter, setCurrentQuarter] = useState<Quarter | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [studentYear, setStudentYear] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'core' | 'carryover'>('core');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch student/user profile first to determine program period type
      const meRes = await api.get('/auth/me');
      const user = meRes.data.data;
      const student = user.student;
      
      if (!student) {
        toast.error('Student profile not found.');
        setLoading(false);
        return;
      }

      setStudentYear(student.current_year_of_study || 1);

      // Determine period type based on program type
      const programType = student.program?.type;
      const periodType = (programType === 'degree' || programType === 'masters' || programType === 'phd')
        ? 'semester'
        : 'quarter';

      // 2. Fetch academic year and the correct current quarter for this period type
      const [ayRes, qRes] = await Promise.all([
        api.get('/academic-years/current'),
        api.get(`/quarters/current?period_type=${periodType}`)
      ]);
      
      const ay = ayRes.data.data;
      const q = qRes.data.data;
      
      setCurrentAcademicYear(ay);
      setCurrentQuarter(q);

      if (ay && q) {
        // 3. Fetch all course units for student's program & quarter
        const coursesRes = await api.get('/course-units', {
          params: { 
            program_id: student.program_id,
            quarter_id: q.id,
            per_page: 100
          }
        });
        
        setCourseUnits(coursesRes.data.data);

        // 4. Fetch student's current enrollments
        const enrollmentsRes = await api.get('/student/enrollments', {
          params: { quarter_id: q.id }
        });
        
        const enrolledIds = enrollmentsRes.data.data.map((e: any) => e.course_unit_id);
        setEnrolledCourseIds(enrolledIds);
        setSelectedCourseIds(enrolledIds); // Pre-select already enrolled
      }
    } catch (error) {
      console.error('Failed to fetch enrollment data', error);
      toast.error('Failed to load course information');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (id: number) => {
    if (enrolledCourseIds.includes(id)) {
      toast.info('You are already enrolled in this course.');
      return;
    }
    
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    const newCoursesToEnroll = selectedCourseIds.filter(id => !enrolledCourseIds.includes(id));
    
    if (newCoursesToEnroll.length === 0) {
      toast.info('No new courses selected for enrollment.');
      return;
    }
    
    if (!currentQuarter || !currentAcademicYear) return;

    try {
      setSubmitting(true);
      await api.post('/student/enrollments', {
        course_unit_ids: newCoursesToEnroll,
        quarter_id: currentQuarter.id,
        academic_year_id: currentAcademicYear.id
      });
      
      toast.success('Successfully enrolled in selected courses!');
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Enrollment failed', error);
      toast.error('Failed to enroll in courses');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading enrollment data...</div>;
  }

  const newSelections = selectedCourseIds.filter(id => !enrolledCourseIds.includes(id)).length;
  
  const coreCourses = courseUnits.filter(course => course.year_of_study === studentYear);
  const carryoverCourses = courseUnits.filter(course => course.year_of_study < studentYear);
  const activeCourses = activeTab === 'core' ? coreCourses : carryoverCourses;

  return (
    <StudentLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-primary">Course Enrollment</h1>
            <p className="text-muted-foreground mt-1">
              {currentAcademicYear?.name} • {currentQuarter?.name}
            </p>
          </div>
        </div>

      {!currentQuarter || !currentAcademicYear ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Enrollment is currently not available because there is no active quarter or academic year set by the administration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Tabs for Core vs Carryover */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                className={`py-2.5 px-6 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'core'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('core')}
              >
                Core Courses (Year {studentYear})
              </button>
              <button
                type="button"
                className={`py-2.5 px-6 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'carryover'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('carryover')}
              >
                Carryover Courses (Previous Years)
              </button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'core' 
                    ? `Recommended Core Courses` 
                    : 'Carryover & Outstanding Courses'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'core'
                    ? `Standard course units suggested for your current standing (Year ${studentYear}).`
                    : 'Uncompleted course units from previous years of study.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCourses.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center border border-dashed rounded-lg bg-gray-50/50">
                    {activeTab === 'core'
                      ? `No core courses scheduled for Year ${studentYear} this quarter.`
                      : 'No carryover courses available for you this quarter.'}
                  </p>
                ) : (
                  activeCourses.map(course => {
                    const isEnrolled = enrolledCourseIds.includes(course.id);
                    const isSelected = selectedCourseIds.includes(course.id);
                    
                    return (
                      <div 
                        key={course.id} 
                        className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200 ${
                          isEnrolled ? 'bg-green-50/40 border-green-200' : 
                          isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <Checkbox 
                          id={`course-${course.id}`} 
                          checked={isSelected}
                          disabled={isEnrolled}
                          onCheckedChange={() => toggleCourse(course.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`course-${course.id}`}
                            className="font-semibold flex items-center cursor-pointer text-gray-900"
                          >
                            <span className="text-primary mr-2 font-bold">{course.code}</span>
                            {course.name}
                            {isEnrolled && (
                              <span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Enrolled
                              </span>
                            )}
                          </label>
                          <div className="text-xs text-gray-500 mt-1 flex space-x-4">
                            <span>{course.credit_units} Credits</span>
                            <span>Year {course.year_of_study}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Enrollment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Currently Enrolled:</span>
                  <span className="font-semibold">{enrolledCourseIds.length} courses</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">New Selections:</span>
                  <span className="font-semibold text-primary">{newSelections} courses</span>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={newSelections === 0 || submitting}
                    onClick={handleEnroll}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-5 w-5 mr-2" />
                    )}
                    Confirm Enrollment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      </div>
    </StudentLayout>
  );
}
