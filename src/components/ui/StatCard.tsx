import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
    title: string;
    value: number;
    color: string; 
    onClick?: () => void; 
}

const StatCard = ({ title, value, color, onClick }: StatCardProps) => {
    return (
        <Paper
            sx={{
                p: 1, 
                textAlign: 'center',
                backgroundColor: color, 
                color: 'white',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? { opacity: 0.8 } : {},
            }}
            onClick={onClick}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Paper>
    );
};

export default StatCard;