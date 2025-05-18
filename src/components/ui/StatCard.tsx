import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
    title: string;
    value: number;
    color: string; // Allow any color string
    onClick?: () => void; // Optional onClick handler
}

const StatCard = ({ title, value, color, onClick }: StatCardProps) => {
    return (
        <Paper
            sx={{
                p: 1, // Reduced padding
                textAlign: 'center',
                backgroundColor: color, // Set background color
                color: 'white', // Text color always white
                cursor: onClick ? 'pointer' : 'default', // Add pointer if clickable
                '&:hover': onClick ? { opacity: 0.8 } : {}, // Slight opacity change on hover
            }}
            onClick={onClick}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Paper>
    );
};

export default StatCard;