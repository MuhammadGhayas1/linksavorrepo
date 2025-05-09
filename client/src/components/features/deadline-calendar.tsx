import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDay, addMonths, subMonths, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "@shared/schema";

interface DeadlineCalendarProps {
  links: Link[];
}

export function DeadlineCalendar({ links }: DeadlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Get all deadline dates
  const deadlineDates = links
    .filter(link => link.deadline)
    .map(link => new Date(link.deadline!));
  
  // Create calendar days array
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const rows = [];
  
  let days = [];
  let day = startDate;
  let formattedDate = "";
  
  // Create days of the week header
  const daysOfWeek = [];
  const dayOfWeekFormat = "EEE";
  
  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(
      <div key={i} className="text-xs text-center font-medium text-gray-500">
        {format(addDays(startDate, i), dayOfWeekFormat).substring(0, 1)}
      </div>
    );
  }
  
  // Create calendar days
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Check if day has a deadline
      const hasDeadline = deadlineDates.some(deadlineDate => isSameDay(deadlineDate, cloneDay));
      
      // Determine deadline proximity if it has a deadline
      let deadlineClass = "";
      if (hasDeadline) {
        const today = new Date();
        const daysUntil = Math.floor((cloneDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 3 && daysUntil >= 0) {
          deadlineClass = "bg-red-100 text-red-800 font-semibold";
        } else if (daysUntil <= 7 && daysUntil > 3) {
          deadlineClass = "bg-orange-100 text-orange-800 font-semibold";
        } else if (daysUntil > 7) {
          deadlineClass = "bg-blue-100 text-blue-800 font-semibold";
        }
      }
      
      days.push(
        <div key={day.toString()} className="aspect-square p-1">
          <div 
            className={cn(
              "h-full rounded-full text-center flex flex-col justify-center text-xs",
              !isSameMonth(day, monthStart) && "text-gray-400",
              isSameDay(day, new Date()) && !hasDeadline && "font-semibold bg-gray-200 text-gray-800",
              hasDeadline && deadlineClass
            )}
          >
            {formattedDate}
          </div>
          {hasDeadline && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-red-500"></div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
    days = [];
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Deadline Calendar</h2>
        <div className="flex">
          <button 
            onClick={prevMonth}
            className="h-8 w-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100"
          >
            <FontAwesomeIcon icon="chevron-left" />
          </button>
          <button 
            onClick={nextMonth}
            className="h-8 w-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100"
          >
            <FontAwesomeIcon icon="chevron-right" />
          </button>
        </div>
      </div>
      
      <div className="text-center mb-3">
        <h3 className="text-md font-semibold text-gray-700">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek}
      </div>
      
      {rows}
      
      <div className="mt-4 flex justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span className="text-xs text-gray-600">Urgent (1-3 days)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-xs text-gray-600">Soon (4-7 days)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-xs text-gray-600">Upcoming (8+ days)</span>
        </div>
      </div>
    </div>
  );
}
