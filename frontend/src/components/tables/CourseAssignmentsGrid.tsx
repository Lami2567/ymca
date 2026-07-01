'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentRow {
  id?: number;
  course_unit_id: number | null;
  course_code: string;
  course_name: string;
  lecturer_id: number | null;
  lecturer_name: string;
  quarter_id: number | null;
  quarter_name: string;
  academic_year_id: number | null;
  academic_year_name: string;
  status: string;
}

interface CourseAssignmentsGridProps {
  initialData: AssignmentRow[];
  courseUnits: Array<{ id: number; code: string; name: string }>;
  lecturers: Array<{ id: number; name: string }>;
  quarters: Array<{ id: number; name: string; academic_year_id: number }>;
  academicYears: Array<{ id: number; name: string }>;
  onSave: (data: AssignmentRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseAssignmentsGrid({
  initialData,
  courseUnits,
  lecturers,
  quarters,
  academicYears,
  onSave,
  onDelete,
}: CourseAssignmentsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<AssignmentRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync rowData when parent re-fetches data (e.g. after a save)
  React.useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  // Keep latest props in refs so column defs (memoized once) can always read
  // the freshest data without needing to be recreated.
  const quartersRef = useRef(quarters);
  quartersRef.current = quarters;
  const academicYearsRef = useRef(academicYears);
  academicYearsRef.current = academicYears;
  const courseUnitsRef = useRef(courseUnits);
  courseUnitsRef.current = courseUnits;
  const lecturersRef = useRef(lecturers);
  lecturersRef.current = lecturers;

  // ── Column Definitions (memoized once; reads live data via refs) ──────────

  const columnDefs: ColDef<AssignmentRow>[] = useMemo(() => [
    {
      headerName: 'Course Code',
      field: 'course_code',
      pinned: 'left',
      width: 130,
      editable: false,
      cellStyle: { fontWeight: '600', backgroundColor: '#f9fafb' },
    },
    {
      headerName: 'Course Name',
      field: 'course_name',
      width: 240,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: () => ({
        values: ['', ...courseUnitsRef.current.map((c) => c.name)],
      }),
      valueParser: (params: any) => {
        const cu = courseUnitsRef.current.find((c) => c.name === params.newValue);
        if (cu) {
          params.data.course_unit_id = cu.id;
          params.data.course_code = cu.code;
        } else {
          params.data.course_unit_id = null;
          params.data.course_code = '';
        }
        return params.newValue || '';
      },
      valueFormatter: (params: any) => params.value || '',
    },
    {
      headerName: 'Lecturer',
      field: 'lecturer_name',
      width: 180,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: () => ({
        values: ['', ...lecturersRef.current.map((l) => l.name)],
      }),
      valueParser: (params: any) => {
        const l = lecturersRef.current.find((l) => l.name === params.newValue);
        if (l) {
          params.data.lecturer_id = l.id;
        } else {
          params.data.lecturer_id = null;
        }
        return params.newValue || '';
      },
      valueFormatter: (params: any) => params.value || '',
    },
    {
      headerName: 'Academic Year',
      field: 'academic_year_name',
      width: 140,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: () => ({
        values: ['', ...academicYearsRef.current.map((ay) => ay.name)],
      }),
      valueParser: (params: any) => {
        const ay = academicYearsRef.current.find((a) => a.name === params.newValue);
        if (ay) {
          params.data.academic_year_id = ay.id;
        } else {
          params.data.academic_year_id = null;
        }
        return params.newValue || '';
      },
      valueFormatter: (params: any) => params.value || '',
    },
    {
      headerName: 'Period',
      field: 'quarter_name',
      width: 170,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        // Show all quarters; if an academic year is selected on the row,
        // show matching quarters first — but ALWAYS fall back to full list
        // so the dropdown is never empty.
        const ayId = params.data?.academic_year_id;
        const allQuarters = quartersRef.current;
        const filtered = ayId
          ? allQuarters.filter((q) => Number(q.academic_year_id) === Number(ayId))
          : allQuarters;
        // Fall back to full list if the filtered result is empty
        const list = filtered.length > 0 ? filtered : allQuarters;
        return { values: ['', ...list.map((q) => q.name)] };
      },
      valueParser: (params: any) => {
        const q = quartersRef.current.find((q) => q.name === params.newValue);
        if (q) {
          params.data.quarter_id = q.id;
          // Auto-fill academic year from the chosen period if not already set
          if (!params.data.academic_year_id) {
            params.data.academic_year_id = q.academic_year_id;
            const ay = academicYearsRef.current.find((a) => a.id === q.academic_year_id);
            if (ay) params.data.academic_year_name = ay.name;
          }
        } else {
          params.data.quarter_id = null;
        }
        return params.newValue || '';
      },
      valueFormatter: (params: any) => params.value || '',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['active', 'inactive'] },
      cellStyle: (params: any) => {
        const map: Record<string, any> = {
          active:   { backgroundColor: '#dcfce7', color: '#166534' },
          inactive: { backgroundColor: '#f3f4f6', color: '#374151' },
        };
        return map[params.value] ?? { backgroundColor: '#f9fafb' };
      },
    },
    {
      headerName: 'Actions',
      width: 90,
      pinned: 'right',
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        if (!params.data?.id) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleDelete(params.data.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []); // intentionally empty — reads fresh data via refs

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const onCellValueChanged = useCallback(() => setHasChanges(true), []);

  const handleAddRow = useCallback(() => {
    gridRef.current?.api.applyTransaction({
      add: [{
        course_unit_id:     null,
        course_code:        '',
        course_name:        '',
        lecturer_id:        null,
        lecturer_name:      '',
        quarter_id:         null,
        quarter_name:       '',
        academic_year_id:   null,
        academic_year_name: '',
        status:             'active',
      }],
    });
    setHasChanges(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await onDelete(id);
      // Remove the row directly from the grid
      const api = gridRef.current?.api;
      if (api) {
        const node = api.getRowNode(String(id));
        if (node) api.applyTransaction({ remove: [node.data] });
      }
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
  }, [onDelete]);

  const handleRefresh = useCallback(() => {
    setRowData(initialData);
    setHasChanges(false);
    toast.info('Data refreshed');
  }, [initialData]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const api = gridRef.current?.api;
      if (!api) return;

      const collected: AssignmentRow[] = [];
      api.forEachNode((node) => {
        const d = { ...node.data };

        // Resolve course_unit_id
        if (typeof d.course_name === 'number') {
          d.course_unit_id = d.course_name;
        } else if (d.course_name) {
          const cu = courseUnitsRef.current.find((c) => c.name === d.course_name);
          if (cu) d.course_unit_id = cu.id;
        }

        // Resolve lecturer_id
        if (typeof d.lecturer_name === 'number') {
          d.lecturer_id = d.lecturer_name;
        } else if (d.lecturer_name) {
          const l = lecturersRef.current.find((l) => l.name === d.lecturer_name);
          if (l) d.lecturer_id = l.id;
        }

        // Resolve quarter_id
        if (typeof d.quarter_name === 'number') {
          d.quarter_id = d.quarter_name;
        } else if (d.quarter_name) {
          const q = quartersRef.current.find((q) => q.name === d.quarter_name);
          if (q) d.quarter_id = q.id;
        }

        // Resolve academic_year_id
        if (typeof d.academic_year_name === 'number') {
          d.academic_year_id = d.academic_year_name;
        } else if (d.academic_year_name) {
          const ay = academicYearsRef.current.find((a) => a.name === d.academic_year_name);
          if (ay) d.academic_year_id = ay.id;
        }

        collected.push(d);
      });

      const valid = collected.filter(
        (r) => r.course_unit_id && r.lecturer_id && r.quarter_id && r.academic_year_id
      );

      if (valid.length === 0) {
        toast.warning('No complete rows to save. Fill in Course, Lecturer, Period, and Academic Year.');
        return;
      }

      await onSave(valid);
      setHasChanges(false);
      toast.success(`${valid.length} assignment${valid.length !== 1 ? 's' : ''} saved`);
    } catch {
      toast.error('Failed to save assignments');
    } finally {
      setLoading(false);
    }
  }, [onSave]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle>Lecturer Assignments</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
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
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving…' : 'Save Changes'}
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
            rowSelection="multiple"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            stopEditingWhenCellsLoseFocus={false}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
