import React from 'react';
import {
    TableHead,
    TableRow,
    TableCell,
    TableSortLabel,
    Box,
    Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { Key } from 'react'; // Import the Key type

interface EnhancedTableHeadProps<T> {
    onRequestSort: (property: keyof T) => (event: React.MouseEvent<unknown>) => void;
    order: 'asc' | 'desc';
    orderBy: keyof T;
    headCells: { id: keyof T & (string | number); label: string }[]; // Explicitly type 'id'
}

const EnhancedTableHead = <T extends object>(props: EnhancedTableHeadProps<T>) => {
    const { onRequestSort, order, orderBy, headCells } = props;
    const createSortHandler = (property: keyof T) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(property)(event);
    };

    return (
        <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
            <TableRow>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id as Key} // Explicitly cast 'id' to Key
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{
                            padding: '8px 16px',
                            '&:last-child': { pr: 0 },
                        }}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {headCell.label}
                            </Typography>
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

export default EnhancedTableHead;