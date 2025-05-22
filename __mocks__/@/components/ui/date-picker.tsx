// __mocks__/@/components/ui/date-picker.tsx
import React from 'react';
import type { DateRange } from 'react-day-picker';

interface DatePickerWithRangeProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
}

export const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({ date, onDateChange, className }) => (
  <div data-testid="mock-date-picker" className={className}>
    <button data-testid="mock-date-picker-from" onClick={() => onDateChange?.({ from: new Date('2023-01-01T00:00:00.000Z'), to: date?.to })}>
      {date?.from ? date.from.toDateString() : 'Select From Date'}
    </button>
    <button data-testid="mock-date-picker-to" onClick={() => onDateChange?.({ from: date?.from, to: new Date('2023-01-31T23:59:59.999Z') })}>
      {date?.to ? date.to.toDateString() : 'Select To Date'}
    </button>
  </div>
);
