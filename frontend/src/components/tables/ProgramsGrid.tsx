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

interface ProgramRow {
  id?: number;
  department_id: number | null;
  department_name?: string;
  code: string;
  name: string;
  type: string;
  duration_years: number;
  description: string;
  status: string;
}

interface ProgramsGridProps {
  initialData: ProgramRow[];
  departments: Array<{ id: number; name: string }>;
  onSave: (data: ProgramRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function ProgramsGrid({
  initialData,
  departments,
  onSave,
  onDelete,
}: ProgramsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<ProgramRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs: ColDef<ProgramRow>[] = [
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
      headerName: 'Department',
      field: 'department_name',
      width: 200,
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
      headerName: 'Type',
      field: 'type',
      width: 150,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['certificate', 'diploma', 'degree', 'masters', 'phd'],
      },
    },
    {
      headerName: 'Duration (Years)',
      field: 'duration_years',
      width: 140,
      editable: true,
      cellEditor: 'agNumberCellEditor',
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
    const newRow: ProgramRow = {
      code: '',
      name: '',
      department_id: null,
      type: 'degree',
      duration_years: 3,
      description: '',
      status: 'active',
    };
    setRowData([...rowData, newRow]);
    setHasChanges(true);
  };

  const handleDelete = async (id: number, rowIndex: number) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        setLoading(true);
        await onDelete(id);
        const newData = [...rowData];
        newData.splice(rowIndex, 1);
        setRowData(newData);
        toast.success('Program deleted successfully');
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
      
      const gridData: ProgramRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        const data = { ...node.data };
        if (typeof data.department_name === 'number') {
           data.department_id = data.department_name;
        } else if (data.department_name && typeof data.department_name === 'string') {
           const dept = departments.find(d => d.name === data.department_name);
           if (dept) data.department_id = dept.id;
        }
        gridData.push(data);
      });

      const validData = gridData.filter(row => row.code && row.name && row.department_id);
      
      await onSave(validData);
      setHasChanges(false);
      toast.success('Programs saved successfully');
    } catch (error: any) {
      // Error details shown by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Programs Directory</CardTitle>
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
