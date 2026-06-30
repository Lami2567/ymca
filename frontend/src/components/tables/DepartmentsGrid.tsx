'use client';

import React, { useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorUtils';

interface DepartmentRow {
  id?: number;
  code: string;
  name: string;
  description: string;
  head_id: number | null;
  head_name?: string;
  status: string;
}

interface DepartmentsGridProps {
  initialData: DepartmentRow[];
  lecturers: Array<{ id: number; name: string }>;
  onSave: (data: DepartmentRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function DepartmentsGrid({
  initialData,
  lecturers,
  onSave,
  onDelete,
}: DepartmentsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<DepartmentRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs: ColDef<DepartmentRow>[] = [
    {
      headerName: 'Code',
      field: 'code',
      pinned: 'left',
      width: 120,
      editable: true,
      cellStyle: { fontWeight: '600' },
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 250,
      editable: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      width: 300,
      editable: true,
    },
    {
      headerName: 'Head of Department',
      field: 'head_name',
      width: 200,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...lecturers.map((l) => l.name)],
      },
      valueParser: (params: any) => {
        if (!params.newValue) return null;
        const lecturer = lecturers.find((l) => l.name === params.newValue);
        return lecturer ? lecturer.id : params.oldValue;
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        if (typeof params.value === 'string') return params.value;
        const lecturer = lecturers.find((l) => l.id === params.value);
        return lecturer ? lecturer.name : '';
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['active', 'inactive'],
      },
      cellStyle: (params: any) => {
        const statusColors: Record<string, any> = {
          active: { backgroundColor: '#dcfce7', color: '#166534' },
          inactive: { backgroundColor: '#f3f4f6', color: '#374151' },
        };
        return statusColors[params.value] || {};
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      editable: false,
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
    const newRow: DepartmentRow = {
      code: '',
      name: '',
      description: '',
      head_id: null,
      status: 'active',
    };
    setRowData([...rowData, newRow]);
    setHasChanges(true);
  };

  const handleDelete = async (id: number, rowIndex: number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        setLoading(true);
        await onDelete(id);
        const newData = [...rowData];
        newData.splice(rowIndex, 1);
        setRowData(newData);
        toast.success('Department deleted successfully');
      } catch (error: any) {
        // Error toast is shown by parent, no need to double-toast
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Extract data directly from the grid to ensure we have the latest parsed values
      const gridData: DepartmentRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        const data = { ...node.data };
        // If head_name has an ID value (from valueParser), map it to head_id
        if (typeof data.head_name === 'number') {
           data.head_id = data.head_name;
        } else if (data.head_name && typeof data.head_name === 'string') {
           const lecturer = lecturers.find(l => l.name === data.head_name);
           if (lecturer) data.head_id = lecturer.id;
        }
        gridData.push(data);
      });

      // Filter out empty rows
      const validData = gridData.filter(row => row.code && row.name);
      
      await onSave(validData);
      setHasChanges(false);
      toast.success('Departments saved successfully');
    } catch (error: any) {
      // Error details already shown by parent via parseApiError
      // Just show a simple fallback if parent didn't toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Departments Directory</CardTitle>
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
