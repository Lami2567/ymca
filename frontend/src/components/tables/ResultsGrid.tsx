'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ResultRow {
  id: number;
  student_number: string;
  student_name: string;
  cw1_score: number | null;
  cw2_score: number | null;
  cw3_score: number | null;
  cw4_score: number | null;
  test_score: number | null;
  exam_score: number | null;
  total_score: number;
  grade: string;
}

interface ResultsGridProps {
  courseUnitId: number;
  quarterId: number;
  academicYearId: number;
  initialData: ResultRow[];
  onSave: (data: ResultRow[]) => Promise<void>;
  weights: {
    cw1_weight: number;
    cw2_weight: number;
    cw3_weight: number;
    cw4_weight: number;
    test_weight: number;
    exam_weight: number;
  };
}

export function ResultsGrid({
  courseUnitId,
  quarterId,
  academicYearId,
  initialData,
  onSave,
  weights,
}: ResultsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<ResultRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  // ── Column Definitions — dynamically shown/hidden and custom headers based on weights ──

  const columnDefs = useMemo<ColDef<ResultRow>[]>(() => {
    const cols: ColDef<ResultRow>[] = [
      {
        headerName: 'Student Number',
        field: 'student_number',
        pinned: 'left',
        width: 140,
        editable: false,
        cellStyle: { fontWeight: '600' },
      },
      {
        headerName: 'Student Name',
        field: 'student_name',
        pinned: 'left',
        width: 180,
        editable: false,
      },
    ];

    if (weights.cw1_weight > 0) {
      cols.push({
        headerName: `CW1 (${weights.cw1_weight}%)`,
        field: 'cw1_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.cw1_weight) {
            toast.error(`CW1 score cannot exceed its weight of ${weights.cw1_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    if (weights.cw2_weight > 0) {
      cols.push({
        headerName: `CW2 (${weights.cw2_weight}%)`,
        field: 'cw2_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.cw2_weight) {
            toast.error(`CW2 score cannot exceed its weight of ${weights.cw2_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    if (weights.cw3_weight > 0) {
      cols.push({
        headerName: `CW3 (${weights.cw3_weight}%)`,
        field: 'cw3_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.cw3_weight) {
            toast.error(`CW3 score cannot exceed its weight of ${weights.cw3_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    if (weights.cw4_weight > 0) {
      cols.push({
        headerName: `CW4 (${weights.cw4_weight}%)`,
        field: 'cw4_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.cw4_weight) {
            toast.error(`CW4 score cannot exceed its weight of ${weights.cw4_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    if (weights.test_weight > 0) {
      cols.push({
        headerName: `Test (${weights.test_weight}%)`,
        field: 'test_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.test_weight) {
            toast.error(`Test score cannot exceed its weight of ${weights.test_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    if (weights.exam_weight > 0) {
      cols.push({
        headerName: `Exam (${weights.exam_weight}%)`,
        field: 'exam_score',
        type: 'numericColumn',
        width: 110,
        editable: true,
        valueParser: (params) => {
          const value = parseFloat(params.newValue);
          if (isNaN(value) || value < 0) return null;
          if (value > weights.exam_weight) {
            toast.error(`Exam score cannot exceed its weight of ${weights.exam_weight}%`);
            return null;
          }
          return value;
        },
        cellStyle: (params) => ({
          backgroundColor: params.value !== null ? '#f0fdf4' : '#f9fafb',
        }),
      });
    }

    cols.push(
      {
        headerName: 'Total Score',
        field: 'total_score',
        type: 'numericColumn',
        width: 110,
        editable: false,
        valueFormatter: (params) => params.value?.toFixed(2) || '-',
        cellStyle: { fontWeight: '600', backgroundColor: '#e0f2fe' },
      },
      {
        headerName: 'Grade',
        field: 'grade',
        width: 90,
        editable: false,
        cellStyle: (params) => {
          const map: Record<string, any> = {
            A: { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' },
            B: { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' },
            C: { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold' },
            D: { backgroundColor: '#ffedd5', color: '#c2410c', fontWeight: 'bold' },
            F: { backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
          };
          return map[params.value] || { backgroundColor: '#f9fafb' };
        },
      }
    );

    return cols;
  }, [weights]);

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  // ── Recalculate Totals on Value Change ──

  const onCellValueChanged = useCallback((event: any) => {
    setHasChanges(true);
    
    const node = event.node;
    const data = node.data;
    
    let total = 0;
    if (data.cw1_score !== null && data.cw1_score !== undefined) total += Number(data.cw1_score);
    if (data.cw2_score !== null && data.cw2_score !== undefined) total += Number(data.cw2_score);
    if (data.cw3_score !== null && data.cw3_score !== undefined) total += Number(data.cw3_score);
    if (data.cw4_score !== null && data.cw4_score !== undefined) total += Number(data.cw4_score);
    if (data.test_score !== null && data.test_score !== undefined) total += Number(data.test_score);
    if (data.exam_score !== null && data.exam_score !== undefined) total += Number(data.exam_score);
    
    node.setData({
      ...data,
      total_score: parseFloat(total.toFixed(2)),
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const gridApi = gridRef.current?.api;
      if (!gridApi) return;

      const collected: any[] = [];
      gridApi.forEachNode((node) => collected.push(node.data));

      await onSave(collected);
      setHasChanges(false);
      toast.success('Results saved successfully');
    } catch (error) {
      toast.error('Failed to save results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const gridApi = gridRef.current?.api;
    if (!gridApi) return;

    gridApi.exportDataAsCsv({
      fileName: `results_${courseUnitId}_${quarterId}.csv`,
    });
  };

  const handleRefresh = () => {
    setRowData(initialData);
    setHasChanges(false);
    toast.info('Data refreshed');
  };

  return (
    <Card className="h-[550px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle>Results Entry</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={!hasChanges}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <div className="ag-theme-alpine w-full h-full">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
            rowSelection="single"
            suppressRowClickSelection={true}
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
