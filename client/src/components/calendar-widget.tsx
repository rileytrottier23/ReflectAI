import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarWidgetProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const selected = new Date(selectedDate);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  const { data: entries } = useQuery({
    queryKey: ["/api/journal/entries"],
  });

  // Create a set of dates that have entries for quick lookup
  const datesWithEntries = new Set(
    entries?.map((entry: any) => entry.date) || []
  );

  const monthName = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDate.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDate.toISOString().split('T')[0],
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: date.toISOString().split('T')[0],
      });
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextMonthDate.toISOString().split('T')[0],
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-beige-300 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display font-semibold text-black">
            Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="p-2 hover:bg-beige-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </Button>
            <span className="text-sm font-medium text-black px-3 min-w-[120px] text-center">
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="p-2 hover:bg-beige-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSelected = day.fullDate === selectedDate;
            const hasEntry = datesWithEntries.has(day.fullDate);
            const isToday = day.fullDate === new Date().toISOString().split('T')[0];
            
            return (
              <Button
                key={index}
                variant="ghost"
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg hover:bg-beige-100 
                  transition-colors duration-200 relative
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isSelected ? 'bg-sage-500 text-white hover:bg-sage-600' : ''}
                  ${isToday && !isSelected ? 'bg-sage-100 text-sage-800' : ''}
                `}
                onClick={() => onDateSelect(day.fullDate)}
              >
                <span>{day.date}</span>
                {hasEntry && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sage-400 rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-beige-300">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-sage-400 rounded-full mr-2"></div>
              <span>Has Entry</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-sage-500 rounded-full mr-2"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
