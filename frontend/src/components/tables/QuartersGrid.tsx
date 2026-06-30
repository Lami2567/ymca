'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodType = 'quarter' | 'semester';

interface QuarterRow {
  id?: number;
  academic_year_id: number | null;
  academic_year_name?: string | number;
  period_type: PeriodType;
  name: string;
  number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

interface QuartersGridProps {
  initialData: QuarterRow[];
  academicYears: Array<{ id: number; name: string }>;
  onSave: (data: QuarterRow[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  quarter:  'Quarter',
  semester: 'Semester',
};

const PERIOD_TYPE_COLORS: Record<PeriodType, { bg: string; text: string }> = {
  quarter:  { bg: '#dbeafe', text: '#1e40af' },
  semester: { bg: '#fce7f3', text: '#9d174d' },
};

const MAX_NUMBER: Record<PeriodType, number> = {
  quarter:  4,
  semester: 2,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Auto-generate a period name like "Semester 1", "Quarter 2", etc. */
function autoName(type: PeriodType, number: number): string {
  return `${PERIOD_TYPE_LABELS[type]} ${number}`;
}

/** Resolve academic_year_id from a row (academic_year_name may hold an ID or name string) */
function resolveAcademicYearId(
  row: any,
  academicYears: Array<{ id: number; name: string }>
): number | null {
  const val = row.academic_year_name;
  if (typeof val === 'number' && val > 0) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const ay = academicYears.find((a) => a.name === val.trim());
    if (ay) return ay.id;
  }
  return row.academic_year_id ?? null;
}

/** Strip time part from a date string (e.g. "2024-01-01T00:00:00" → "2024-01-01") */
function toDateString(value: any): string {
  if (!value) return '';
  const s = String(value);
  return s.includes('T') ? s.split('T')[0] : s;
}

// ─── Custom date cell editor — native <input type="date"> inside AG Grid ──────

class DateCellEditor {
  private eInput!: HTMLInputElement;
  private params!: any;

  init(params: any) {
    this.params = params;
    this.eInput = document.createElement('input');
    this.eInput.type = 'date';
    this.eInput.value = toDateString(params.value);
    this.eInput.style.cssText =
      'width:100%;height:100%;border:none;outline:none;padding:0 4px;font-size:13px;background:transparent;';
    this.eInput.addEventListener('change', () => {
      params.stopEditing();
    });
  }

  getGui() {
    return this.eInput;
  }

  afterGuiAttached() {
    this.eInput.focus();
    // Open the native date picker automatically
    try { this.eInput.showPicker(); } catch (_) { /* not supported in all browsers */ }
  }

  getValue() {
    return this.eInput.value || this.params.value || '';
  }

  isPopup() {
    return false;
  }

  destroy() {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuartersGrid({
  initialData,
  academicYears,
  onSave,
  onDelete,
}: QuartersGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<QuarterRow[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Column Definitions ────────────────────────────────────────────────────

  const columnDefs: ColDef<QuarterRow>[] = useMemo(() => [
    {
      headerName: 'Academic Year',
      field: 'academic_year_name',
      pinned: 'left',
      width: 180,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...academicYears.map((ay) => ay.name)],
      },
      valueParser: (params: any) => params.newValue || '',
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        if (typeof params.value === 'string') return params.value;
        const ay = academicYears.find((a) => a.id === params.value);
        return ay ? ay.name : '';
      },
    },
    {
      headerName: 'Period Type',
      field: 'period_type',
      width: 140,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['quarter', 'semester'],
      },
      valueFormatter: (params: any) => PERIOD_TYPE_LABELS[params.value as PeriodType] ?? params.value,
      cellRenderer: (params: ICellRendererParams) => {
        const type = params.value as PeriodType;
        const colors = PERIOD_TYPE_COLORS[type] ?? { bg: '#f3f4f6', text: '#374151' };
        return (
          <span
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-block',
              marginTop: '6px',
            }}
          >
            {PERIOD_TYPE_LABELS[type] ?? type}
          </span>
        );
      },
    },
    {
      headerName: 'Period Number',
      field: 'number',
      width: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        // Offer 1–2 for semesters, 1–4 for quarters
        const type: PeriodType = params.data?.period_type ?? 'quarter';
        const max = MAX_NUMBER[type] ?? 4;
        return { values: Array.from({ length: max }, (_, i) => i + 1) };
      },
      // Ensure number is always stored as integer (agSelectCellEditor may return string)
      valueParser: (params: any) => {
        const n = parseInt(params.newValue, 10);
        return isNaN(n) ? params.oldValue : n;
      },
      valueFormatter: (params: any) => {
        const type: PeriodType = params.data?.period_type ?? 'quarter';
        return `${PERIOD_TYPE_LABELS[type]} ${params.value}`;
      },
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 180,
      editable: true,
      cellStyle: { fontWeight: '600' },
    },
    {
      headerName: 'Start Date',
      field: 'start_date',
      width: 150,
      editable: true,
      cellEditor: DateCellEditor,
      valueFormatter: (params: any) => toDateString(params.value),
    },
    {
      headerName: 'End Date',
      field: 'end_date',
      width: 150,
      editable: true,
      cellEditor: DateCellEditor,
      valueFormatter: (params: any) => toDateString(params.value),
    },
    {
      headerName: 'Current',
      field: 'is_current',
      width: 100,
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
      cellEditorParams: { values: ['active', 'archived'] },
      cellStyle: (params: any) => {
        const colors: Record<string, any> = {
          active:   { backgroundColor: '#dcfce7', color: '#166534' },
          archived: { backgroundColor: '#f3f4f6', color: '#374151' },
        };
        return colors[params.value] || {};
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 90,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [academicYears]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // ── Cell change handler — auto-update Name when type or number changes ─────

  const handleCellValueChanged = useCallback((params: any) => {
    setHasChanges(true);

    const { field } = params.colDef;
    const rowNode = params.node;
    const data = { ...rowNode.data };

    if (field === 'period_type' || field === 'number') {
      const type: PeriodType = data.period_type ?? 'quarter';
      const num: number = parseInt(data.number, 10) || 1;

      // Only auto-fill name if it looks auto-generated or is empty
      const currentName: string = data.name ?? '';
      const isAutoName = !currentName ||
        Object.values(PERIOD_TYPE_LABELS).some((label) =>
          currentName.startsWith(label + ' ')
        );

      if (isAutoName) {
        rowNode.setDataValue('name', autoName(type, num));
      }

      // If number exceeds max for the new type, clamp it
      if (field === 'period_type') {
        const maxNum = MAX_NUMBER[type] ?? 4;
        if (num > maxNum) {
          rowNode.setDataValue('number', maxNum);
        }
      }
    }
  }, []);

  // ── Add Row ───────────────────────────────────────────────────────────────

  const handleAddRow = useCallback(() => {
    const newRow: QuarterRow = {
      academic_year_id:   null,
      academic_year_name: '',
      period_type:        'quarter',
      name:               'Quarter 1',
      number:             1,
      start_date:         '',   // User picks their own dates
      end_date:           '',
      is_current:         false,
      status:             'active',
    };
    setRowData((prev) => [...prev, newRow]);
    setHasChanges(true);
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number, rowIndex: number) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    try {
      setLoading(true);
      await onDelete(id);
      setRowData((prev) => prev.filter((_, i) => i !== rowIndex));
      toast.success('Period deleted successfully');
    } catch {
      // Error toast shown by parent
    } finally {
      setLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setLoading(true);

      const gridData: QuarterRow[] = [];
      gridRef.current!.api.forEachNode((node) => {
        const raw = { ...node.data };

        // Resolve academic year ID
        raw.academic_year_id = resolveAcademicYearId(raw, academicYears);

        // Normalize period_type
        if (!raw.period_type) raw.period_type = 'quarter';

        // Ensure number is a proper integer (select editor may produce strings)
        raw.number = parseInt(String(raw.number), 10) || 1;

        // Clamp number to max for the period type
        const maxNum = MAX_NUMBER[raw.period_type as PeriodType] ?? 4;
        if (raw.number > maxNum) raw.number = maxNum;

        // Ensure boolean
        raw.is_current = !!raw.is_current;

        // Strip timestamps from dates
        raw.start_date = toDateString(raw.start_date);
        raw.end_date   = toDateString(raw.end_date);

        gridData.push(raw);
      });

      // Validate required fields
      const errors: string[] = [];
      const validData = gridData.filter((row, i) => {
        const missing: string[] = [];
        if (!row.academic_year_id) missing.push('Academic Year');
        if (!row.name)             missing.push('Name');
        if (!row.number)           missing.push('Period Number');
        if (!row.start_date)       missing.push('Start Date');
        if (!row.end_date)         missing.push('End Date');
        if (missing.length > 0) {
          errors.push(`Row ${i + 1}: Missing — ${missing.join(', ')}`);
          return false;
        }
        return true;
      });

      if (errors.length > 0) {
        toast.error(errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ''));
        return;
      }

      if (validData.length === 0) {
        toast.warning('No valid rows to save.');
        return;
      }

      await onSave(validData);
      setHasChanges(false);
      toast.success(`${validData.length} period${validData.length !== 1 ? 's' : ''} saved successfully`);
    } catch {
      // Error toast shown by parent
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Academic Periods</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quarters&nbsp;(4/yr) · Semesters&nbsp;(2/yr)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend pills */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {(Object.entries(PERIOD_TYPE_COLORS) as [PeriodType, { bg: string; text: string }][]).map(
              ([type, colors]) => (
                <span
                  key={type}
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                  className="px-2 py-0.5 rounded-full font-medium"
                >
                  {PERIOD_TYPE_LABELS[type]}
                </span>
              )
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Period
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
            stopEditingWhenCellsLoseFocus={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
