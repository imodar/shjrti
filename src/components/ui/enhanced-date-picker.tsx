import * as React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnhancedDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disableFuture?: boolean;
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "اختر التاريخ",
  disabled = false,
  className,
  fromYear = 1700,
  toYear = new Date().getFullYear(),
  disableFuture = true,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    if (date) {
      setOpen(false); // Close widget when date is selected
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 border-2 border-gray-200/50 dark:border-gray-700/50 justify-start text-right font-normal w-full hover:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl",
            !value && "text-gray-500 dark:text-gray-400",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4 text-amber-500" />
          {value ? format(value, "dd/MM/yyyy", { locale: ar }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-2xl border-2 border-amber-200/50 dark:border-amber-700/50 animate-scale-in" align="start">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-t-lg">
          <div className="flex items-center justify-center gap-2">
            <CalendarIcon className="h-5 w-5 text-white" />
            <h4 className="text-white font-semibold text-center">
              {placeholder}
            </h4>
          </div>
          {value && (
            <p className="text-amber-100 text-xs text-center mt-2">
              {format(value, "EEEE، dd MMMM yyyy", { locale: ar })}
            </p>
          )}
        </div>
        
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={ar}
          initialFocus
          className="rounded-md pointer-events-auto p-4"
          disabled={disableFuture ? (date) => date > new Date() : undefined}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
          classNames={{
            months: "flex flex-col space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-2 pb-4 relative items-center gap-2",
            caption_dropdowns: "flex justify-center gap-3",
            dropdown: "px-3 py-2 text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 min-w-[120px] font-medium text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200",
            caption_label: "hidden",
            nav: "hidden",
            table: "w-full border-collapse space-y-1 mt-4",
            head_row: "flex",
            head_cell: "text-amber-600 dark:text-amber-400 rounded-md w-10 font-semibold text-xs text-center py-2",
            row: "flex w-full mt-2",
            cell: "h-10 w-10 text-center text-sm p-0 relative",
            day: "h-10 w-10 p-0 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all duration-200 hover:scale-105",
            day_selected: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg transform scale-105",
            day_today: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-300 dark:ring-amber-600",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
          }}
        />
        
        {/* Footer with close button */}
        <div className="p-3 border-t border-amber-200/50 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/50">
          <Button
            onClick={() => setOpen(false)}
            variant="ghost"
            size="sm"
            className="w-full text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            إغلاق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}