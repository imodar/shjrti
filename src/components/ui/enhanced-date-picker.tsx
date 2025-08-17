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

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    if (date) {
      setHijriDate(toHijri(date));
      setOpen(false);
    }
  };

  const handleHijriDateChange = (year: number, month: number, day: number) => {
    const gregorianDate = hijriToGregorian(year, month, day);
    setHijriDate({ year, month, day });
    onChange?.(gregorianDate);
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
        className="w-auto p-0 shadow-2xl border-2 border-amber-200/50 dark:border-amber-700/50 animate-scale-in z-[10020] max-w-[95vw] bg-white dark:bg-gray-800" 
        align="center" 
        sideOffset={10}
        avoidCollisions={true}
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-t-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
              <h4 className="text-white font-semibold text-center">
                {placeholder}
              </h4>
            </div>
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
              locale={ar}
              initialFocus
              className="rounded-md pointer-events-auto p-2 sm:p-4 touch-manipulation"
              disabled={disableFuture ? (date) => date > new Date() : undefined}
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
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
          <div className="p-4 space-y-4 bg-gradient-to-b from-amber-50/30 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/30">
            <div className="text-center">
              <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3">
                التقويم الهجري
              </h5>
            </div>
            
            {/* Hijri Calendar Grid */}
            <div className="space-y-4">
              {/* Header with Month/Year Navigation */}
              <div className="flex items-center justify-center gap-2 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-amber-200/50 dark:border-amber-700/50">
                <Select 
                  value={currentHijri.month.toString()} 
                  onValueChange={(value) => handleHijriDateChange(currentHijri.year, parseInt(value), Math.min(currentHijri.day, 30))}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 focus:ring-amber-500 text-sm pointer-events-auto">
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
                  <SelectTrigger className="w-24 bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 focus:ring-amber-500 text-sm pointer-events-auto">
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

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {HIJRI_DAYS.map((day, index) => (
                  <div key={index} className="text-xs font-medium text-amber-600 dark:text-amber-400 py-2">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const isSelected = day === currentHijri.day;
                  const isToday = (() => {
                    const today = new Date();
                    const todayHijri = toHijri(today);
                    return day === todayHijri.day && 
                           currentHijri.month === todayHijri.month && 
                           currentHijri.year === todayHijri.year;
                  })();
                  
                  return (
                    <Button
                      key={day}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHijriDateChange(currentHijri.year, currentHijri.month, day)}
                      className={cn(
                        "h-8 w-8 p-0 text-sm font-medium rounded-lg transition-all duration-200",
                        isSelected && "bg-amber-500 text-white hover:bg-amber-600 shadow-lg",
                        !isSelected && isToday && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-300 dark:ring-amber-600",
                        !isSelected && !isToday && "hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>

              {/* Current Selection Display */}
              <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                <div className="text-center">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    التاريخ المحدد
                  </p>
                  <p className="text-lg font-bold text-amber-800 dark:text-amber-200 mt-1">
                    {currentHijri.day} {HIJRI_MONTHS[currentHijri.month - 1]} {currentHijri.year} هـ
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {value && format(hijriToGregorian(currentHijri.year, currentHijri.month, currentHijri.day), "dd/MM/yyyy")} (ميلادي)
                  </p>
                </div>
              </div>
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