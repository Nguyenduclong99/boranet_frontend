import React from 'react';
import { TextField, Grid } from '@mui/material';
import { format } from 'date-fns';

interface DatePickerProps {
    label: string;
    date: Date | null;
    setDate: (date: Date | null) => void;
}

const DatePicker = ({ label, date, setDate }: DatePickerProps) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = event.target.value ? new Date(event.target.value) : null;
        setDate(newDate);
    };

    return (
        <TextField
            label={label}
            type="date"
            value={date ? format(date, 'yyyy-MM-dd') : ''}
            onChange={handleChange}
            InputLabelProps={{
                shrink: true,
            }}
            size="small" 
            sx={{
                '& .MuiInputBase-input': { 
                    padding: '6px 8px',
                },
                '& .MuiInputLabel-shrink': { 
                    transform: 'translate(14px, -4px) scale(0.75)',
                },
            }}
        />
    );
};

export default DatePicker;