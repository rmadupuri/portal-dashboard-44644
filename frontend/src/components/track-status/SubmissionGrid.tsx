
import { AgGridReact } from "ag-grid-react";
import { ColDef, ColGroupDef, RowClickedEvent, IsFullWidthRowParams, CellClickedEvent } from "ag-grid-community";
import { useState } from "react";
import { Submission } from "@/types/submission";
import { SubmissionFlowTracker } from "./SubmissionFlowTracker";

interface SubmissionGridProps {
  rowData: Submission[];
  columnDefs: (ColDef | ColGroupDef)[];
  onRowSelected?: (submission: Submission) => void;
  trackType?: 'suggested-papers' | 'submitted-data';
}

export const SubmissionGrid = ({ rowData, columnDefs, onRowSelected, trackType = 'suggested-papers' }: SubmissionGridProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const paginationPageSize = 10;

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 100,
    suppressSizeToFit: true,
    cellClass: 'cell-wrap-ellipsis',
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px'
    }
  };

  // Prepare row data with expanded rows inserted and trackType
  const preparedRowData = rowData.flatMap(row => {
    const submissionId = row.submissionId || row.id;
    const rowWithTrackType = { ...row, trackType };
    const rows = [rowWithTrackType];
    
    if (submissionId && expandedRows.has(submissionId)) {
      rows.push({
        ...rowWithTrackType,
        isExpansionRow: true,
        submissionId: `${submissionId}_expansion`
      });
    }
    
    return rows;
  });

  // Check if the row is a full-width row
  const isFullWidthRow = (params: IsFullWidthRowParams) => {
    return params.rowNode.data?.isExpansionRow === true;
  };

  // Renderer for the full-width row
  const fullWidthCellRenderer = (params: any) => {
    return (
      <div className="w-full p-4 bg-slate-50 border-t border-gray-200 mb-2">
        <SubmissionFlowTracker currentStatus={params.data.status} trackType={trackType} />
      </div>
    );
  };

  // Handle cell click to toggle expanded state only for submission ID column
  const handleCellClicked = (event: CellClickedEvent) => {
    // Only handle clicks on the submissionId column and not on expansion rows
    if (event.colDef.field !== 'submissionId' || event.data?.isExpansionRow) return;
    
    const submissionId = event.data?.submissionId || event.data?.id;
    if (!submissionId) return;

    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });

    if (onRowSelected) {
      onRowSelected(event.data);
    }
  };

  // Ensure expansion rows are not selectable
  const isRowSelectable = (params: any) => {
    return !params.data?.isExpansionRow;
  };

  return (
    <div className="ag-theme-alpine w-full">
      <style>{`
        .cell-wrap-ellipsis {
          display: flex !important;
          align-items: center !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }

        .cell-wrap-ellipsis > div {
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .ag-cell {
          display: flex !important;
          align-items: center !important;
          padding: 8px 12px !important;
        }

        .ag-cell-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        .ag-cell-value {
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .ag-header-cell-label {
          display: flex;
          align-items: center;
        }

        .ag-row-selected {
          background-color: #e3f2fd !important;
        }

        .ag-full-width-row {
          background-color: transparent !important;
          margin-bottom: 8px !important;
        }

        .ag-full-width-row .ag-cell {
          padding: 0 !important;
          border: none !important;
          background-color: transparent !important;
        }

        .ag-center-cols-viewport {
          padding-bottom: 20px !important;
        }

        .ag-header-container {
          min-width: 100% !important;
        }

        .ag-header-cell {
          overflow: visible !important;
        }

        .ag-header-cell-text {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }

        /* Force text truncation for all text elements */
        .ag-cell span,
        .ag-cell div,
        .ag-cell a {
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
      `}</style>

      <AgGridReact
        rowData={preparedRowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={paginationPageSize}
        rowSelection="single"
        enableCellTextSelection={true}
        animateRows={true}
        domLayout="autoHeight"
        className="w-full rounded-md overflow-hidden"
        rowHeight={60}
        onCellClicked={handleCellClicked}
        isFullWidthRow={isFullWidthRow}
        fullWidthCellRenderer={fullWidthCellRenderer}
        isRowSelectable={isRowSelectable}
        suppressColumnVirtualisation={true}
        suppressAutoSize={true}
        skipHeaderOnAutoSize={true}
        context={{ trackType }}
        getRowHeight={(params) => {
          if (params.data?.isExpansionRow) {
            return 280; // Increased height for better visibility
          }
          return 60; // Normal row height
        }}
      />
    </div>
  );
};
