import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('has access to jsdom globals', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});