import { describe, it, expect } from 'vitest';
import {
  formatDateForDatabase,
  parseDateFromDatabase,
  createLocalDate,
} from '@/lib/dateUtils';

describe('dateUtils', () => {
  describe('formatDateForDatabase', () => {
    it('returns null for null/undefined', () => {
      expect(formatDateForDatabase(null)).toBeNull();
      expect(formatDateForDatabase(undefined)).toBeNull();
    });

    it('formats a Date as YYYY-MM-DD using local time', () => {
      const d = new Date(2024, 0, 5); // 5 Jan 2024 local
      expect(formatDateForDatabase(d)).toBe('2024-01-05');
    });

    it('zero-pads month and day', () => {
      const d = new Date(2024, 8, 9); // 9 Sep 2024
      expect(formatDateForDatabase(d)).toBe('2024-09-09');
    });
  });

  describe('parseDateFromDatabase', () => {
    it('returns null for null/undefined/empty', () => {
      expect(parseDateFromDatabase(null)).toBeNull();
      expect(parseDateFromDatabase(undefined)).toBeNull();
    });

    it('parses YYYY-MM-DD into a local Date', () => {
      const d = parseDateFromDatabase('2024-03-15');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(2);
      expect(d!.getDate()).toBe(15);
    });
  });

  describe('createLocalDate', () => {
    it('creates a date at midnight local time', () => {
      const d = createLocalDate(2024, 6, 1);
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(5);
      expect(d.getDate()).toBe(1);
      expect(d.getHours()).toBe(0);
    });
  });

  describe('round-trip', () => {
    it('format then parse yields the same calendar day', () => {
      const original = new Date(2025, 10, 30);
      const str = formatDateForDatabase(original)!;
      const parsed = parseDateFromDatabase(str)!;
      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });
  });
});