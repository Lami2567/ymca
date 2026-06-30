'use client';

import React, { useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LecturerRow {
  id?: number;
  user_id?: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number | null;
  department_name?: string | number;
  title: string;
  specialization: string;
  qualification: string;
  hire_date: string;
  status: string;
}

interface LecturersGridProps {
  initialData: LecturerRow[];
  departments: Array<{ id: number; name: string }>;
  onSave: (data: LecturerRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function LecturersGrid({
  initialData,
  departments,
  onSave,
  onDelete,
}: LecturersGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<LecturerRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs: ColDef<LecturerRow>[] = [
    {
      headerName: 'Emp Number',
      field: 'employee_number',
      pinned: 'left',
      width: 130,
      editable: true,
      cellStyle: { fontWeight: '600' },
    },
    {
      headerName: 'First Name',
      field: 'first_name',
      width: 150,
      editable: true,
    },
    {
      headerName: 'Last Name',
      field: 'last_name',
      width: 150,
      editable: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 200,
      editable: true,
    },
    {
      headerName: 'Title',
      field: 'title',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'],
      },
      valueParser: (params: any) => {
        if (!params.newValue) return 'mr';
        return params.newValue.toLowerCase().replace('.', '');
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const titles: Record<string, string> = {
          mr: 'Mr.',
          ms: 'Ms.',
          mrs: 'Mrs.',
          dr: 'Dr.',
          prof: 'Prof.'
        };
        return titles[params.value] || params.value;
      }
    },
    {
      headerName: 'Department',
      field: 'department_name',
      width: 200,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...departments.map((d) => d.name)],
      },
      // Store the department NAME as a string so we can look up the ID at save time
      valueParser: (params: any) => {
        return params.newValue || '';
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        // If it's already a department name string, return it
        if (typeof params.value === 'string') return params.value;
        // If it's a number (department_id), look up the name
        const dept = departments.find((d) => d.id === params.value);
        return dept ? dept.name : '';
      }
    },
    {
      headerName: 'Specialization',
      field: 'specialization',
      width: 180,
      editable: true,
    },
    {
      headerName: 'Qualification',
      field: 'qualification',
      width: 150,
      editable: true,
    },
    {
      headerName: 'Hire Date',
      field: 'hire_date',
      width: 130,
      editable: true,
      cellEditor: 'agDateCellEditor',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['active', 'inactive', 'on_leave'],
      },
      cellStyle: (params: any) => {
        const statusColors: Record<string, any> = {
          active: { backgroundColor: '#dcfce7', color: '#166534' },
          inactive: { backgroundColor: '#fee2e2', color: '#b91c1c' },
          on_leave: { backgroundColor: '#fef3c7', color: '#b45309' },
        };
        return statusColors[params.value] || {};
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      editable: false,
      pinned: 'right',
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger hover:bg-danger/10 h-8 w-8 p-0"
            onClick={() => handleDelete(params.value, params.node.rowIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  const handleCellValueChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleAddRow = () => {
    const newRow: LecturerRow = {
      employee_number: '',
      first_name: '',
      last_name: '',
      email: '',
      department_id: null,
      department_name: '',
      title: 'mr',
      specialization: '',
      qualification: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setRowData([...rowData, newRow]);
    setHasChanges(true);
  };

  const handleDelete = async (id: number, rowIndex: number) => {
    if (confirm('Are you sure you want to delete this lecturer?')) {
      try {
        setLoading(true);
        await onDelete(id);
        const newData = [...rowData];
        newData.splice(rowIndex, 1);
        setRowData(newData);
        toast.success('Lecturer deleted successfully');
      } catch (error: any) {
        // Error toast shown by parent
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Resolve department_id from the row data.
   * The department_name field may hold either:
   *   - A string (department name) → look up ID from the departments list
   *   - A number (already a dept ID stored there by old valueParser) → use directly
   *   - The original department_id on the row if department_name is empty
   */
  const resolveDeptId = (row: any): number | null => {
    const deptName = row.department_name;

    if (typeof deptName === 'number' && deptName > 0) {
      return deptName;
    }
    if (typeof deptName === 'string' && deptName.trim() !== '') {
      const dept = departments.find((d) => d.name === deptName.trim());
      if (dept) return dept.id;
    }
    // Fall back to original department_id
    return row.department_id ?? null;
  };

  /** Normalize title value to DB enum format: 'Dr.' / 'DR' / 'dr.' → 'dr' */
  const normalizeTitle = (val: any): string => {
    if (!val) return 'mr';
    return String(val).toLowerCase().replace(/\./g, '').trim();
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const gridData: LecturerRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        const raw = { ...node.data };
        raw.department_id = resolveDeptId(raw);
        // Normalize title to DB enum: 'Mr.' → 'mr', 'Dr.' → 'dr', etc.
        raw.title = normalizeTitle(raw.title);
        // Ensure hire_date is a plain date string (strip any timestamp)
        if (raw.hire_date && raw.hire_date.includes('T')) {
          raw.hire_date = raw.hire_date.split('T')[0];
        }
        gridData.push(raw);
      });

      // Validate required fields and collect errors
      const validationErrors: string[] = [];
      const validData = gridData.filter((row, i) => {
        const missing: string[] = [];
        if (!row.employee_number) missing.push('Employee Number');
        if (!row.first_name && !row.user_id) missing.push('First Name');
        if (!row.email && !row.user_id) missing.push('Email');
        if (!row.department_id) missing.push('Department');
        if (!row.hire_date) missing.push('Hire Date');

        if (missing.length > 0) {
          validationErrors.push(`Row ${i + 1}: Missing required fields — ${missing.join(', ')}`);
          return false;
        }
        return true;
      });

      if (validationErrors.length > 0) {
        toast.error(validationErrors[0] + (validationErrors.length > 1 ? ` (+${validationErrors.length - 1} more)` : ''));
        return;
      }

      if (validData.length === 0) {
        toast.warning('No valid rows to save. Please fill required fields (Employee Number, Name, Email, Department, Hire Date).');
        return;
      }

      await onSave(validData);
      setHasChanges(false);
      toast.success(`${validData.length} lecturer${validData.length !== 1 ? 's' : ''} saved successfully`);
    } catch (error: any) {
      // Error details shown by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Lecturers Directory</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
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
            onCellValueChanged={handleCellValueChanged}
            animateRows={true}
            rowSelection="multiple"
            stopEditingWhenCellsLoseFocus={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
