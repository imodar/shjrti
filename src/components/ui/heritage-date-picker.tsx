import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type PickerView = 'calendar' | 'months' | 'years';

interface HeritageDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disableFuture?: boolean;
  lang?: 'ar' | 'en';
}

export function HeritageDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  fromYear = 550,
  toYear = new Date().getFullYear(),
  disableFuture = true,
  lang = 'ar',
}: HeritageDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<PickerView>('calendar');
  const [displayMonth, setDisplayMonth] = React.useState(() => value ? value.getMonth() : new Date().getMonth());
  const [displayYear, setDisplayYear] = React.useState(() => value ? value.getFullYear() : new Date().getFullYear());
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const y = value ? value.getFullYear() : new Date().getFullYear();
    return Math.floor(y / 20) * 20;
  });
  const yearGridRef = React.useRef<HTMLDivElement>(null);

  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
  const days = lang === 'ar' ? DAYS_AR : DAYS_EN;
  const isRTL = lang === 'ar';
  const today = new Date();

  // Reset view when opening
  React.useEffect(() => {
    if (open) {
      setView('calendar');
      if (value) {
        setDisplayMonth(value.getMonth());
        setDisplayYear(value.getFullYear());
        setYearPageStart(Math.floor(value.getFullYear() / 20) * 20);
      }
    }
  }, [open, value]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDayClick = (day: number) => {
    const selected = new Date(displayYear, displayMonth, day);
    if (disableFuture && selected > today) return;
    onChange?.(selected);
    setOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setDisplayMonth(monthIndex);
    setView('calendar');
  };

  const handleYearSelect = (year: number) => {
    setDisplayYear(year);
    setView('months');
  };

  const navigateMonth = (delta: number) => {
    let newMonth = displayMonth + delta;
    let newYear = displayYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newYear >= fromYear && newYear <= toYear) {
      setDisplayMonth(newMonth);
      setDisplayYear(newYear);
    }
  };

  const navigateYearPage = (delta: number) => {
    const newStart = yearPageStart + delta * 20;
    if (newStart >= fromYear - 20 && newStart <= toYear) {
      setYearPageStart(newStart);
    }
  };

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

  const formatDisplayDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Generate calendar grid
  const calendarRows: (number | null)[][] = [];
  let currentDay = 1;
  for (let week = 0; week < 6; week++) {
    const row: (number | null)[] = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (week === 0 && dayOfWeek < firstDay) {
        row.push(null);
      } else if (currentDay > daysInMonth) {
        row.push(null);
      } else {
        row.push(currentDay);
        currentDay++;
      }
    }
    calendarRows.push(row);
    if (currentDay > daysInMonth) break;
  }

  // Year grid for selection
  const yearGrid: number[] = [];
  for (let i = 0; i < 20; i++) {
    const y = yearPageStart + i;
    if (y >= fromYear && y <= toYear) yearGrid.push(y);
  }

  const isSelectedDay = (day: number) => {
    if (!value) return false;
    return value.getDate() === day && value.getMonth() === displayMonth && value.getFullYear() === displayYear;
  };

  const isFutureDay = (day: number) => {
    if (!disableFuture) return false;
    const d = new Date(displayYear, displayMonth, day);
    return d > today;
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-start flex items-center gap-2 cursor-pointer",
          !value && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 truncate">
          {value ? formatDisplayDate(value) : (placeholder || (lang === 'ar' ? 'اختر التاريخ' : 'Select date'))}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 gap-0 max-w-[min(95vw,380px)] rounded-2xl overflow-hidden border-0 shadow-2xl z-[80]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="bg-[hsl(var(--primary)/0.08)] dark:bg-[hsl(var(--primary)/0.15)] px-5 pt-5 pb-4">
            {view === 'calendar' && (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {lang === 'ar' ? 'اختر الشهر' : 'SELECT MONTH'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setView('months')}
                    className="text-2xl sm:text-3xl font-serif font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {months[displayMonth]}
                    <ChevronRight className={cn("h-4 w-4 mt-1 text-muted-foreground", isRTL && "rotate-180")} />
                  </button>
                </div>
                <div className={cn("text-end", isRTL && "text-start")}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {lang === 'ar' ? 'السنة' : 'ERA'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setYearPageStart(Math.floor(displayYear / 20) * 20);
                      setView('years');
                    }}
                    className="text-3xl sm:text-4xl font-serif font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {displayYear}
                  </button>
                </div>
              </div>
            )}
            {view === 'months' && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                  {lang === 'ar' ? 'اختر الشهر' : 'SELECT MONTH'}
                </p>
                <p className="text-2xl font-serif font-bold text-foreground">{displayYear}</p>
              </div>
            )}
            {view === 'years' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {lang === 'ar' ? 'اختر السنة' : 'SELECT YEAR'}
                  </p>
                  <p className="text-2xl font-serif font-bold text-foreground">
                    {yearPageStart} - {Math.min(yearPageStart + 19, toYear)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => navigateYearPage(isRTL ? 1 : -1)}
                    disabled={isRTL ? yearPageStart + 20 > toYear : yearPageStart <= fromYear}
                    className="h-8 w-8 rounded-full"
                  >
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => navigateYearPage(isRTL ? -1 : 1)}
                    disabled={isRTL ? yearPageStart <= fromYear : yearPageStart + 20 > toYear}
                    className="h-8 w-8 rounded-full"
                  >
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="p-4">
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(isRTL ? 1 : -1)} className="h-8 w-8 rounded-full">
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  {months[displayMonth]} {displayYear}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(isRTL ? -1 : 1)} className="h-8 w-8 rounded-full">
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {days.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              {calendarRows.map((row, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {row.map((day, di) => (
                    <div key={di} className="aspect-square flex items-center justify-center">
                      {day !== null ? (
                        <button
                          type="button"
                          disabled={isFutureDay(day)}
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-all",
                            isSelectedDay(day)
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-accent text-foreground",
                            isFutureDay(day) && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {day}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Months Grid View */}
          {view === 'months' && (
            <div className="p-4 grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMonthSelect(i)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-medium transition-all",
                    displayMonth === i
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Years Grid View */}
          {view === 'years' && (
            <div ref={yearGridRef} className="p-4 grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
              {yearGrid.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearSelect(y)}
                  className={cn(
                    "py-3 rounded-xl text-sm font-medium transition-all",
                    displayYear === y
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent text-foreground",
                    disableFuture && y > today.getFullYear() && "opacity-30 cursor-not-allowed"
                  )}
                  disabled={disableFuture && y > today.getFullYear()}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          {view === 'calendar' && (
            <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground italic hidden sm:block">
                {lang === 'ar' ? '"نحفظ تاريخنا، يومًا بيوم"' : '"Preserving our history, one date at a time."'}
              </p>
              <Button
                onClick={() => {
                  if (value) {
                    onChange?.(value);
                    setOpen(false);
                  }
                }}
                disabled={!value}
                size="sm"
                className="rounded-lg font-bold uppercase tracking-wider text-xs px-6"
              >
                {lang === 'ar' ? 'تأكيد' : 'CONFIRM ENTRY'}
              </Button>
            </div>
          )}

          {/* Back button for month/year views */}
          {view !== 'calendar' && (
            <div className="px-4 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(view === 'years' ? 'months' : 'calendar')}
                className="w-full text-muted-foreground"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
