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

interface CourseUnitRow {
  id?: number;
  department_id: number | null;
  department_name?: string;
  program_id: number | null;
  program_name?: string;
  year_of_study: number;
  quarter_id: number | null;
  quarter_name?: string;
  code: string;
  name: string;
  credit_units: number;
  description: string;
  prerequisites: string;
  status: string;
}

interface CourseUnitsGridProps {
  initialData: CourseUnitRow[];
  departments: Array<{ id: number; name: string }>;
  programs: Array<{ id: number; name: string }>;
  quarters: Array<{ id: number; name: string }>;
  onSave: (data: CourseUnitRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function CourseUnitsGrid({
  initialData,
  departments,
  programs,
  quarters,
  onSave,
  onDelete,
}: CourseUnitsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<CourseUnitRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs: ColDef<CourseUnitRow>[] = [
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
      pinned: 'left',
      width: 250,
      editable: true,
    },
    {
      headerName: 'Department',
      field: 'department_name',
      width: 180,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...departments.map((d) => d.name)],
      },
      valueParser: (params: any) => {
        if (!params.newValue) return null;
        const dept = departments.find((d) => d.name === params.newValue);
        return dept ? dept.id : params.oldValue;
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        if (typeof params.value === 'string') return params.value;
        const dept = departments.find((d) => d.id === params.value);
        return dept ? dept.name : '';
      }
    },
    {
      headerName: 'Program',
      field: 'program_name',
      width: 200,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...programs.map((p) => p.name)],
      },
      valueParser: (params: any) => {
        if (!params.newValue) return null;
        const prog = programs.find((p) => p.name === params.newValue);
        return prog ? prog.id : params.oldValue;
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        if (typeof params.value === 'string') return params.value;
        const prog = programs.find((p) => p.id === params.value);
        return prog ? prog.name : '';
      }
    },
    {
      headerName: 'Year of Study',
      field: 'year_of_study',
      width: 130,
      editable: true,
      cellEditor: 'agNumberCellEditor',
    },
    {
      headerName: 'Period (Q / Sem / Trim)',
      field: 'quarter_name',
      width: 175,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...quarters.map((q) => q.name)],
      },
      valueParser: (params: any) => {
        if (!params.newValue) return null;
        const q = quarters.find((quarter) => quarter.name === params.newValue);
        return q ? q.id : params.oldValue;
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        if (typeof params.value === 'string') return params.value;
        const q = quarters.find((quarter) => quarter.id === params.value);
        return q ? q.name : '';
      }
    },
    {
      headerName: 'Credits',
      field: 'credit_units',
      width: 100,
      editable: true,
      cellEditor: 'agNumberCellEditor',
    },
    {
      headerName: 'Prerequisites',
      field: 'prerequisites',
      width: 150,
      editable: true,
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
    const newRow: CourseUnitRow = {
      department_id: null,
      program_id: null,
      quarter_id: null,
      year_of_study: 1,
      code: '',
      name: '',
      credit_units: 3,
      description: '',
      prerequisites: '',
      status: 'active',
    };
    setRowData([...rowData, newRow]);
    setHasChanges(true);
  };

  const handleDelete = async (id: number, rowIndex: number) => {
    if (confirm('Are you sure you want to delete this course unit?')) {
      try {
        setLoading(true);
        await onDelete(id);
        const newData = [...rowData];
        newData.splice(rowIndex, 1);
        setRowData(newData);
        toast.success('Course Unit deleted successfully');
      } catch (error: any) {
        // Error toast shown by parent
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const gridData: CourseUnitRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        const data = { ...node.data };
        
        if (typeof data.department_name === 'number') {
           data.department_id = data.department_name;
        } else if (data.department_name && typeof data.department_name === 'string') {
           const dept = departments.find(d => d.name === data.department_name);
           if (dept) data.department_id = dept.id;
        }
        
        if (typeof data.program_name === 'number') {
           data.program_id = data.program_name;
        } else if (data.program_name && typeof data.program_name === 'string') {
           const p = programs.find(p => p.name === data.program_name);
           if (p) data.program_id = p.id;
        }
        
        if (typeof data.quarter_name === 'number') {
           data.quarter_id = data.quarter_name;
        } else if (data.quarter_name && typeof data.quarter_name === 'string') {
           const q = quarters.find(q => q.name === data.quarter_name);
           if (q) data.quarter_id = q.id;
        }

        gridData.push(data);
      });

      const validData = gridData.filter(row => row.code && row.name && row.program_id && row.quarter_id && row.department_id);
      
      await onSave(validData);
      setHasChanges(false);
      toast.success('Course Units saved successfully');
    } catch (error: any) {
      // Error details shown by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Course Units Directory</CardTitle>
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
