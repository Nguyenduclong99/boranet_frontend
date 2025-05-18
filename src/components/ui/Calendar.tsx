import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface DateRange {
  from?: Date;
  to?: Date;
}

const Calendar = ({
  mode = "single",
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
}: {
  mode?: "single" | "range";
  selected?: Date | DateRange;
  onSelect?: (date: Date | DateRange | undefined) => void;
  numberOfMonths?: number;
  className?: string;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localSelected, setLocalSelected] = useState<Date | DateRange | undefined>(selected);

  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  const getYear = (date: Date) => {
    return date.getFullYear();
  };

  // Type predicate to check if a value is a DateRange
  const isDateRange = (range: Date | DateRange | undefined): range is DateRange => {
    return (range as DateRange)?.from !== undefined;
  };

  const isDateObject = (date: Date | DateRange | undefined): date is Date => {
    return date instanceof Date;
  }


  const isDateInRange = (date: Date, range: Date | DateRange | undefined) => {
    if (!range) return false;

    if (isDateObject(range)) {
      return date.getTime() === range.getTime();
    }

    if (isDateRange(range)) {
      if (range.from && !range.to) {
        return date.getTime() === range.from.getTime();
      }
      if (range.from && range.to) {
        return date >= range.from && date <= range.to;
      }
    }

    return false;
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day);

    if (mode === 'single') {
      onSelect?.(selectedDate);
      setLocalSelected(selectedDate);
    } else if (mode === 'range') {
      if (!localSelected?.from) {
        onSelect?.({ from: selectedDate });
        setLocalSelected({ from: selectedDate });
      } else if (!localSelected.to) {
        if (isDateRange(localSelected)) { // Safely access .from
          let newRange: DateRange = { from: localSelected.from, to: selectedDate };
          if (selectedDate < localSelected.from) {
            newRange = { from: selectedDate, to: localSelected.from }
          }
          onSelect?.(newRange);
          setLocalSelected(newRange);
        }
      } else {
        onSelect?.({ from: selectedDate, to: undefined }); // Start a new range
        setLocalSelected({ from: selectedDate, to: undefined });
      }
    }
  };


  const renderMonth = (monthIndex: number) => {
    const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthIndex);
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDayOfMonth = getFirstDayOfMonth(displayMonth);
    const monthName = getMonthName(displayMonth);
    const year = getYear(displayMonth);

    let dayCounter = 1;
    const weeks = [];
    for (let i = 0; i < 6; i++) { // Max 6 weeks
      const days = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDayOfMonth) || dayCounter > daysInMonth) {
          days.push(<td key={`${monthIndex}-${i}-${j}`} className="p-2"></td>);
        } else {
          const dayDate = new Date(year, displayMonth.getMonth(), dayCounter);
          const isSelected = isDateInRange(dayDate, localSelected);
          const isToday = dayDate.toDateString() === new Date().toDateString();
          days.push(
            <td
              key={`${monthIndex}-${i}-${j}`}
              className={cn(
                "p-2 rounded-md transition-colors duration-200",
                "cursor-pointer",
                isSelected
                  ? mode === 'range' && isDateRange(localSelected) && localSelected.from && localSelected.to
                    ? (dayDate >= localSelected.from && dayDate <= localSelected.to)
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-blue-500/50 text-white hover:bg-blue-600/50"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  : isToday
                    ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    : "hover:bg-gray-100",
                "text-center",
              )}
              onClick={() => handleDayClick(dayCounter, displayMonth.getMonth(), year)}
            >
              {dayCounter}
            </td>
          );
          dayCounter++;
        }
      }
      weeks.push(<tr key={`${monthIndex}-${i}`}>{days}</tr>);
      if (dayCounter > daysInMonth) break;
    }

    return (
      <div className="mx-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">{monthName} {year}</h2>
        </div>
        <table className="table-auto">
          <thead>
            <tr>
              <th className="p-1 text-center">Sun</th>
              <th className="p-1 text-center">Mon</th>
              <th className="p-1 text-center">Tue</th>
              <th className="p-1 text-center">Wed</th>
              <th className="p-1 text-center">Thu</th>
              <th className="p-1 text-center">Fri</th>
              <th className="p-1 text-center">Sat</th>
            </tr>
          </thead>
          <tbody>
            {weeks}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={cn("flex", numberOfMonths > 1 ? "flex-row" : "", className)}>
      {Array.from({ length: numberOfMonths }).map((_, index) => (
        <div key={index}>
          {renderMonth(index)}
        </div>
      ))}
    </div>
  );
};

export default Calendar;