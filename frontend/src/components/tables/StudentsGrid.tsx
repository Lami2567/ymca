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

interface StudentRow {
  id?: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: number;
  program_name: string;
  admission_date: string;
  status: string;
}

interface StudentsGridProps {
  initialData: StudentRow[];
  programs: Array<{ id: number; name: string }>;
  onSave: (data: StudentRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function StudentsGrid({
  initialData,
  programs,
  onSave,
  onDelete,
}: StudentsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<StudentRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs = useMemo<ColDef<StudentRow>[]>(() => [
    {
      headerName: 'Student Number',
      field: 'student_number',
      pinned: 'left',
      width: 150,
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
      headerName: 'Program',
      field: 'program_id',
      width: 200,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: programs.map((p) => p.id),
      },
      valueFormatter: (params) => {
        const program = programs.find((p) => p.id === params.value);
        return program ? program.name : '';
      },
      valueParser: (params) => {
        const programId = Number(params.newValue);
        const program = programs.find((p) => p.id === programId);
        if (program) {
          params.data.program_name = program.name;
          return programId;
        }
        return params.oldValue;
      },
    },
    {
      headerName: 'Admission Date',
      field: 'admission_date',
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
        values: ['active', 'graduated', 'suspended', 'withdrawn'],
      },
      cellStyle: (params) => {
        const statusColors: Record<string, any> = {
          active: { backgroundColor: '#dcfce7', color: '#166534' },
          graduated: { backgroundColor: '#dbeafe', color: '#1e40af' },
          suspended: { backgroundColor: '#fee2e2', color: '#991b1b' },
          withdrawn: { backgroundColor: '#f3f4f6', color: '#374151' },
        };
        return statusColors[params.value] || { backgroundColor: '#f9fafb' };
      },
    },
    {
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => {
        if (!params.data.id) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(params.data.id)}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        );
      },
    },
  ], [programs]);

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  };

  const onCellValueChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleAddRow = () => {
    const newRow: StudentRow = {
      student_number: '',
      first_name: '',
      last_name: '',
      email: '',
      program_id: programs[0]?.id || 0,
      program_name: programs[0]?.name || '',
      admission_date: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    const gridApi = gridRef.current?.api;
    gridApi?.applyTransaction({ add: [newRow] });
    setHasChanges(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await onDelete(id);
      const gridApi = gridRef.current?.api;
      const node = gridApi?.getRowNode(String(id));
      gridApi?.applyTransaction({ remove: [node?.data] });
      toast.success('Student deleted successfully');
    } catch (error: any) {
      // Error toast shown by parent
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const gridApi = gridRef.current?.api;
      if (!gridApi) return;

      const rowData: any[] = [];
      gridApi.forEachNode((node) => rowData.push(node.data));

      await onSave(rowData);
      setHasChanges(false);
      toast.success('Students saved successfully');
    } catch (error: any) {
      // Error details shown by parent
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRowData(initialData);
    setHasChanges(false);
    toast.info('Data refreshed');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Students Management</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
            rowSelection="multiple"
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
