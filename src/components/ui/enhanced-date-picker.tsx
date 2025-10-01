import * as React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Calendar as CalendarLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatePreference } from "@/contexts/DatePreferenceContext";

// Hijri calendar conversion utilities
const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

const HIJRI_DAYS = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

// Enhanced Hijri conversion function
const toHijri = (gregorianDate: Date) => {
  const greg = new Date(gregorianDate);
  const julianDay = Math.floor((greg.getTime() / 86400000) + 2440587.5);
  
  // Accurate Hijri conversion algorithm
  const a = julianDay - 1948440.5;
  const b = Math.floor((a * 30) / 10631);
  const c = a - Math.floor((b * 10631) / 30);
  const d = Math.floor((c * 11) / 325);
  const e = c - Math.floor((d * 325) / 11);
  const f = Math.floor(e / 30);
  
  const hijriYear = Math.floor(b) + 1;
  const hijriMonth = Math.floor(d) + Math.floor(f) + 1;
  const hijriDay = Math.floor(e - (f * 30)) + 1;
  
  // Adjust for valid ranges
  const finalMonth = ((hijriMonth - 1) % 12) + 1;
  const finalYear = hijriYear + Math.floor((hijriMonth - 1) / 12);
  
  return {
    day: Math.max(1, Math.min(30, hijriDay)),
    month: Math.max(1, Math.min(12, finalMonth)),
    year: Math.max(1, finalYear)
  };
};

const formatHijriDate = (date: Date) => {
  const hijri = toHijri(date);
  const monthName = HIJRI_MONTHS[hijri.month - 1];
  return `${hijri.day} ${monthName} ${hijri.year} هـ`;
};

// Convert Hijri date back to Gregorian
const hijriToGregorian = (hijriYear: number, hijriMonth: number, hijriDay: number) => {
  const julianDay = Math.floor((hijriYear - 1) * 354.367) + Math.floor((hijriMonth - 1) * 29.53) + hijriDay + 1948440.5;
  const gregorianDate = new Date((julianDay - 2440587.5) * 86400000);
  return gregorianDate;
};

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
  const { datePreference, setDatePreference } = useDatePreference();
  const [hijriDate, setHijriDate] = React.useState(() => value ? toHijri(value) : null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Force center positioning after Radix applies its styles
  React.useEffect(() => {
    if (open && contentRef.current) {
      const applyStyles = () => {
        if (contentRef.current) {
          contentRef.current.style.position = 'fixed';
          contentRef.current.style.left = '50%';
          contentRef.current.style.top = '50%';
          contentRef.current.style.transform = 'translate(-50%, -50%)';
          contentRef.current.style.margin = '0';
          contentRef.current.style.inset = 'auto';
        }
      };
      
      // Apply immediately and after a small delay to override Radix
      applyStyles();
      setTimeout(applyStyles, 0);
      setTimeout(applyStyles, 10);
    }
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Create a new date in local timezone to avoid timezone issues
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange?.(localDate);
      setHijriDate(toHijri(localDate));
      setOpen(false);
    } else {
      onChange?.(date);
    }
  };

  const handleHijriDateChange = (year: number, month: number, day: number) => {
    const gregorianDate = hijriToGregorian(year, month, day);
    // Create a new date in local timezone to avoid timezone issues
    const localDate = new Date(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate());
    setHijriDate({ year, month, day });
    onChange?.(localDate);
    setOpen(false);
  };

  const currentHijri = hijriDate || (value ? toHijri(value) : { year: 1445, month: 1, day: 1 });
  const hijriYears = Array.from({ length: 100 }, (_, i) => 1400 + i);
  const hijriDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 text-sm border-2 border-gray-200/50 dark:border-gray-700/50 justify-end text-right font-normal w-full hover:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-4",
            !value && "text-gray-500 dark:text-gray-400",
            className
          )}
        >
          <span className="text-sm mr-2">
            {value ? (datePreference === 'hijri' ? formatHijriDate(value) : format(value, "dd/MM/yyyy", { locale: ar })) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={contentRef}
        align="center"
        side="top"
        sideOffset={0}
        className="p-0 shadow-2xl border-2 border-amber-200/50 dark:border-amber-700/50 animate-scale-in bg-white dark:bg-gray-800 !z-[9999] !fixed !left-[50%] !top-[50%] !-translate-x-1/2 !-translate-y-1/2 !w-auto !max-w-[min(95vw,400px)] !max-h-[90vh] !overflow-auto !m-0 !pointer-events-auto" 
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-t-lg">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CalendarIcon className="h-5 w-5 text-white" />
              <h4 className="text-white font-semibold">
                {placeholder}
              </h4>
            </div>
            
            <div className="flex justify-center">
              <Select 
                value={datePreference} 
                onValueChange={(value: 'gregorian' | 'hijri') => setDatePreference(value)}
              >
                <SelectTrigger className="w-24 h-7 bg-white/20 border-white/30 text-white text-xs hover:bg-white/30 focus:ring-white/50 pointer-events-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 min-w-[100px] z-[10050] pointer-events-auto">
                  <SelectItem value="gregorian" className="text-right cursor-pointer">
                    ميلادي
                  </SelectItem>
                  <SelectItem value="hijri" className="text-right cursor-pointer">
                    هجري
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {value && (
            <p className="text-amber-100 text-xs text-center mt-1">
              {datePreference === 'hijri' ? formatHijriDate(value) : format(value, "EEEE، dd MMMM yyyy", { locale: ar })}
            </p>
          )}
        </div>
        
        
        {datePreference === 'gregorian' ? (
          <div className="[&_.rdp-vhidden]:hidden">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleSelect}
              initialFocus
              defaultMonth={value || new Date()}
              className="rounded-md pointer-events-auto p-2 sm:p-4 touch-manipulation"
              disabled={disableFuture ? (date) => date > new Date() : undefined}
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
              formatters={{
                formatMonthCaption: (date) => String(date.getMonth() + 1).padStart(2, '0'),
              }}
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-2 pb-4 relative items-center gap-2",
                caption_dropdowns: "flex justify-center gap-2 sm:gap-3 flex-wrap",
                dropdown: "px-2 sm:px-3 py-2 text-xs sm:text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 min-w-[90px] sm:min-w-[120px] font-medium text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer touch-manipulation appearance-none [&>option]:text-right [&>option]:cursor-pointer [&>option]:bg-white [&>option]:dark:bg-gray-800",
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
          </div>
        ) : (
          <div className="p-2 sm:p-4 space-y-4 bg-white dark:bg-gray-800">
            {/* Month/Year Selectors - matching Gregorian style */}
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap pt-2 pb-4">
              <Select 
                value={currentHijri.month.toString()} 
                onValueChange={(value) => handleHijriDateChange(currentHijri.year, parseInt(value), Math.min(currentHijri.day, 30))}
              >
                <SelectTrigger className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 min-w-[90px] sm:min-w-[120px] font-medium text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer touch-manipulation pointer-events-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 z-[10060] pointer-events-auto">
                  {HIJRI_MONTHS.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()} className="text-right cursor-pointer">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={currentHijri.year.toString()} 
                onValueChange={(value) => handleHijriDateChange(parseInt(value), currentHijri.month, currentHijri.day)}
              >
                <SelectTrigger className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 min-w-[90px] sm:min-w-[120px] font-medium text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer touch-manipulation pointer-events-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 z-[10060] pointer-events-auto max-h-48">
                  {hijriYears.map(year => (
                    <SelectItem key={year} value={year.toString()} className="text-right cursor-pointer">
                      {year} هـ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Table - matching Gregorian style */}
            <div className="w-full border-collapse space-y-1 mt-4">
              {/* Days of Week Header - matching Gregorian style */}
              <div className="flex">
                {HIJRI_DAYS.map((day, index) => (
                  <div key={index} className="text-amber-600 dark:text-amber-400 rounded-md w-10 font-semibold text-xs text-center py-2">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid - matching Gregorian style */}
              {Array.from({ length: Math.ceil(30 / 7) }, (_, weekIndex) => (
                <div key={weekIndex} className="flex w-full mt-2">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const day = weekIndex * 7 + dayIndex + 1;
                    if (day > 30) return <div key={dayIndex} className="h-10 w-10 text-center text-sm p-0 relative" />;
                    
                    const isSelected = day === currentHijri.day;
                    
                    return (
                      <div key={dayIndex} className="h-10 w-10 text-center text-sm p-0 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHijriDateChange(currentHijri.year, currentHijri.month, day)}
                          className={cn(
                            "h-10 w-10 p-0 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all duration-200 hover:scale-105",
                            isSelected && "bg-amber-500 text-white hover:bg-amber-600 shadow-lg transform scale-105",
                            !isSelected && "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {day}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        
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