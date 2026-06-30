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

interface AcademicYearRow {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

interface AcademicYearsGridProps {
  initialData: AcademicYearRow[];
  onSave: (data: AcademicYearRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function AcademicYearsGrid({
  initialData,
  onSave,
  onDelete,
}: AcademicYearsGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<AcademicYearRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const columnDefs: ColDef<AcademicYearRow>[] = [
    {
      headerName: 'Name',
      field: 'name',
      pinned: 'left',
      width: 200,
      editable: true,
      cellStyle: { fontWeight: '600' },
    },
    {
      headerName: 'Start Date',
      field: 'start_date',
      width: 150,
      editable: true,
      cellEditor: 'agDateCellEditor',
    },
    {
      headerName: 'End Date',
      field: 'end_date',
      width: 150,
      editable: true,
      cellEditor: 'agDateCellEditor',
    },
    {
      headerName: 'Current Year',
      field: 'is_current',
      width: 150,
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['active', 'archived'],
      },
      cellStyle: (params: any) => {
        const statusColors: Record<string, any> = {
          active: { backgroundColor: '#dcfce7', color: '#166534' },
          archived: { backgroundColor: '#f3f4f6', color: '#374151' },
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
    const newRow: AcademicYearRow = {
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      is_current: false,
      status: 'active',
    };
    setRowData([...rowData, newRow]);
    setHasChanges(true);
  };

  const handleDelete = async (id: number, rowIndex: number) => {
    if (confirm('Are you sure you want to delete this academic year?')) {
      try {
        setLoading(true);
        await onDelete(id);
        const newData = [...rowData];
        newData.splice(rowIndex, 1);
        setRowData(newData);
        toast.success('Academic Year deleted successfully');
      } catch (error) {
        toast.error('Failed to delete academic year');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const gridData: AcademicYearRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        gridData.push({ ...node.data });
      });

      const validData = gridData.filter(row => row.name && row.start_date && row.end_date);
      
      await onSave(validData);
      setHasChanges(false);
      toast.success('Academic Years saved successfully');
    } catch (error) {
      toast.error('Failed to save academic years');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Academic Years Directory</CardTitle>
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
