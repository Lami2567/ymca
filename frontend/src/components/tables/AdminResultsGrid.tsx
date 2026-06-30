'use client';

import React, { useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface ResultRow {
  id: number;
  student_number: string;
  student_name: string;
  course_code: string;
  course_name: string;
  quarter_name: string;
  academic_year_name: string;
  total_score: number | null;
  grade: string | null;
  status: string;
}

interface AdminResultsGridProps {
  initialData: ResultRow[];
  onApprove: (id: number) => Promise<void>;
  onPublish: (id: number) => Promise<void>;
  onRefresh: () => void;
  loadingData: boolean;
}

export function AdminResultsGrid({
  initialData,
  onApprove,
  onPublish,
  onRefresh,
  loadingData
}: AdminResultsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<ResultRow[]>(initialData);

  // Update rowData when initialData changes
  React.useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  const columnDefs: ColDef<ResultRow>[] = [
    {
      headerName: 'Student Number',
      field: 'student_number',
      pinned: 'left',
      width: 150,
      filter: true,
    },
    {
      headerName: 'Student Name',
      field: 'student_name',
      width: 200,
      filter: true,
    },
    {
      headerName: 'Course Code',
      field: 'course_code',
      width: 130,
      filter: true,
    },
    {
      headerName: 'Course Name',
      field: 'course_name',
      width: 200,
      filter: true,
    },
    {
      headerName: 'Term',
      valueGetter: (params) => `${params.data?.quarter_name} - ${params.data?.academic_year_name}`,
      width: 200,
      filter: true,
    },
    {
      headerName: 'Total Score',
      field: 'total_score',
      width: 120,
    },
    {
      headerName: 'Grade',
      field: 'grade',
      width: 100,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 130,
      filter: true,
      cellStyle: (params: any) => {
        const statusColors: Record<string, any> = {
          draft: { backgroundColor: '#f3f4f6', color: '#374151' },
          submitted: { backgroundColor: '#e0f2fe', color: '#0369a1' },
          under_review: { backgroundColor: '#fef3c7', color: '#b45309' },
          approved: { backgroundColor: '#dcfce7', color: '#166534' },
          published: { backgroundColor: '#ede9fe', color: '#5b21b6' },
        };
        return statusColors[params.value] || {};
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 150,
      pinned: 'right',
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        const status = params.data.status;
        
        return (
          <div className="flex space-x-1">
            {(status === 'submitted' || status === 'under_review') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                onClick={() => handleAction(params.value, 'approve')}
                title="Approve Result"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            {status === 'approved' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                onClick={() => handleAction(params.value, 'publish')}
                title="Publish Result"
              >
                <UploadCloud className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const defaultColDef = {
    sortable: true,
    resizable: true,
  };

  const handleAction = async (id: number, action: 'approve' | 'publish') => {
    try {
      if (action === 'approve') {
        await onApprove(id);
        toast.success('Result approved successfully');
      } else {
        await onPublish(id);
        toast.success('Result published successfully');
      }
      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${action} result`);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Results Workflow</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="ag-theme-alpine w-full h-full">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
          />
        </div>
      </CardContent>
    </Card>
  );
}
