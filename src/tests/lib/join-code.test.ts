import { describe, it, expect } from 'vitest';
import { generateJoinCode } from '@lib/join-code';

describe('generateJoinCode', () => {
  it('should generate a code in format JOIN-XXXX', () => {
    const code = generateJoinCode();
    expect(code).toMatch(/^JOIN-[A-Z2-9]{4}$/);
  });

  it('should not contain ambiguous characters (I, 1, O, 0) in the random suffix', () => {
    // Generate multiple codes to increase confidence
    for (let i = 0; i < 100; i++) {
      const code = generateJoinCode();
      // Extract the random suffix (after 'JOIN-')
      const suffix = code.slice(5);
      // Check that the suffix doesn't contain any of: I, 1, 0, O
      expect(suffix).not.toContain('I');
      expect(suffix).not.toContain('1');
      expect(suffix).not.toContain('0');
      expect(suffix).not.toContain('O');
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateJoinCode());
    }
    // With 30^4 = 810,000 possibilities, 100 codes should be unique
    expect(codes.size).toBe(100);
  });
});
