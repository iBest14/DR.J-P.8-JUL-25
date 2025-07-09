// src/components/calendar/CalendarHeader.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Grid3x3, List, Plus, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';

interface CalendarHeaderProps {
  currentDate: Date;
  view: 'day' | 'week' | 'month' | 'year';
  onViewChange: (view: 'day' | 'week' | 'month' | 'year') => void;
  onDateChange: (date: Date) => void;
  onAddEvent: () => void;
  use24HourFormat: boolean;
  onToggle24Hour: () => void;
  useDotBadge: boolean;
  onToggleDotBadge: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onAddEvent,
  use24HourFormat,
  onToggle24Hour,
  useDotBadge,
  onToggleDotBadge,
  darkMode,
  onToggleDarkMode,
}) => {
  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: view === 'day' ? 'numeric' : undefined,
    };
    
    if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    onDateChange(newDate);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
      {/* Left Section - Navigation */}
      <div className="flex items-center gap-4">
        {/* Month/Year Display with Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {formatHeaderDate()}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className="hidden sm:flex"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>

      {/* Center Section - View Toggles */}
      <div className="flex items-center gap-2">
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as any)}>
          <ToggleGroupItem value="day" aria-label="Day view">
            <span className="text-xs font-medium">DAY</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week view">
            <Grid3x3 className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">WEEK</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month view">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">MONTH</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="year" aria-label="Year view">
            <Grid3x3 className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">YEAR</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Add Event Button */}
        <Button onClick={onAddEvent} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="text-sm font-medium">
              Calendar settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={darkMode}
              onCheckedChange={onToggleDarkMode}
            >
              Use dark mode
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={useDotBadge}
              onCheckedChange={onToggleDotBadge}
            >
              Use dot badge
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={use24HourFormat}
              onCheckedChange={onToggle24Hour}
            >
              Use 24 hour format
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">
              Default view
            </DropdownMenuItem>
            <div className="px-2 py-1">
              <select className="w-full px-2 py-1 text-sm border rounded">
                <option>Day</option>
                <option>Week</option>
                <option>Month</option>
                <option selected>Year</option>
                <option>Agenda</option>
              </select>
            </div>
            <DropdownMenuItem className="text-sm">
              Agenda view group by
            </DropdownMenuItem>
            <div className="px-2 py-1">
              <select className="w-full px-2 py-1 text-sm border rounded">
                <option selected>Date</option>
                <option>Color</option>
              </select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Additional Actions */}
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" className="text-xs">
            All
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Clock className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-xs text-muted-foreground">24</span>
          </div>
        </div>
      </div>
    </div>
  );
};