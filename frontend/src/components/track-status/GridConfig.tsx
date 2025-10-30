
import { ColDef, ColGroupDef } from "ag-grid-community";
import { getStatusCellRenderer } from "@/types/submission";
import React from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";

type ColumnDef = ColDef | ColGroupDef;

// Custom header component with sort icon
const SortableHeader = (params: any) => {
  const onSortRequested = () => {
    params.progressSort();
  };

  return React.createElement('div', {
    className: 'flex items-center justify-between w-full gap-2 cursor-pointer',
    onClick: onSortRequested
  }, [
    React.createElement('span', { key: 'label' }, params.displayName),
    React.createElement(ArrowUpDown, { 
      key: 'icon',
      className: 'h-4 w-4 text-gray-400 flex-shrink-0'
    })
  ]);
};

const baseColumn: Partial<ColDef> = {
  sortable: true,
  filter: true,
  resizable: true,
  suppressSizeToFit: true,
  cellClass: 'cell-wrap-ellipsis',
  cellStyle: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px'
  },
  headerComponent: SortableHeader
};

// Generic cell renderer with ellipsis for all text content
const ellipsisRenderer = (params: any) => {
  return React.createElement('div', {
    className: 'w-full truncate',
    style: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    },
    title: params.value // Show full text on hover
  }, params.value);
};

// Cell renderer for clickable datahub links
const datahubLinkRenderer = (params: any) => {
  const issueNumber = params.value;
  const url = params.data.url;
  
  if (url && issueNumber) {
    return React.createElement('a', {
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'text-blue-600 hover:text-blue-800 underline w-full block truncate',
      style: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        maxWidth: '100%'
      },
      title: issueNumber,
      onClick: (e: Event) => {
        e.stopPropagation(); // Prevent row expansion when clicking the link
      }
    }, issueNumber);
  }
  return React.createElement('div', {
    className: 'w-full truncate',
    style: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    },
    title: issueNumber
  }, issueNumber);
};

// Cell renderer for submission ID with expand arrow next to the number
const submissionIdRenderer = (params: any) => {
  return React.createElement('div', {
    className: 'flex items-center gap-1 cursor-pointer hover:text-blue-600 w-full',
    style: {
      maxWidth: '100%'
    },
    title: params.value
  }, [
    React.createElement('span', { 
      key: 'id',
      className: 'truncate',
      style: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }, params.value),
    React.createElement(ChevronDown, { 
      key: 'arrow',
      className: 'h-4 w-4 text-gray-500 flex-shrink-0'
    })
  ]);
};

export const usePaperColumnDefs = (): ColumnDef[] => [
  { 
    field: 'submissionId', 
    headerName: 'Submission ID', 
    width: 160,
    minWidth: 160,
    maxWidth: 160,
    cellRenderer: submissionIdRenderer,
    suppressNavigable: false,
    ...baseColumn 
  },
  { 
    field: 'issueNumber', 
    headerName: 'Track on DataHub', 
    width: 180,
    minWidth: 180,
    maxWidth: 180,
    cellRenderer: datahubLinkRenderer,
    suppressNavigable: true,
    ...baseColumn 
  },
  { 
    field: 'status', 
    headerName: 'Status', 
    cellRenderer: getStatusCellRenderer, 
    width: 320,
    minWidth: 300,
    maxWidth: 400,
    suppressNavigable: true,
    ...baseColumn 
  },
  { 
    field: 'title', 
    headerName: 'Title', 
    flex: 1,
    minWidth: 200,
    cellRenderer: ellipsisRenderer,
    suppressNavigable: true,
    ...baseColumn
  },
  { 
    field: 'createdAt', 
    headerName: 'Submission Date', 
    width: 180,
    minWidth: 180,
    maxWidth: 180,
    cellRenderer: ellipsisRenderer,
    suppressNavigable: true,
    ...baseColumn 
  }
];

export const useDataColumnDefs = (): ColumnDef[] => [
  { 
    field: 'submissionId', 
    headerName: 'Submission ID', 
    width: 160,
    minWidth: 160,
    maxWidth: 160,
    cellRenderer: submissionIdRenderer,
    suppressNavigable: false,
    ...baseColumn 
  },
  { 
    field: 'issueNumber', 
    headerName: 'Track on DataHub', 
    width: 180,
    minWidth: 180,
    maxWidth: 180,
    cellRenderer: datahubLinkRenderer,
    suppressNavigable: true,
    ...baseColumn 
  },
  { 
    field: 'status', 
    headerName: 'Status', 
    cellRenderer: getStatusCellRenderer, 
    width: 320,
    minWidth: 300,
    maxWidth: 400,
    suppressNavigable: true,
    ...baseColumn 
  },
  { 
    field: 'title', 
    headerName: 'Title', 
    flex: 1,
    minWidth: 200,
    cellRenderer: ellipsisRenderer,
    suppressNavigable: true,
    ...baseColumn
  },
  { 
    field: 'createdAt', 
    headerName: 'Submission Date', 
    width: 180,
    minWidth: 180,
    maxWidth: 180,
    cellRenderer: ellipsisRenderer,
    suppressNavigable: true,
    ...baseColumn 
  }
];
