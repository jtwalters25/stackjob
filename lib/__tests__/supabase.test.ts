import { describe, it, expect } from 'vitest';
import { getDocFlags, getCriticalDocs } from '../supabase';

describe('supabase helpers', () => {
  describe('getDocFlags', () => {
    it('should return Elevator doc flags', () => {
      const flags = getDocFlags('Elevator');
      expect(flags).toHaveLength(3);
      expect(flags).toEqual([
        { key: 'has_prints', label: 'Prints' },
        { key: 'has_proposal', label: 'Proposal' },
        { key: 'has_parts_list', label: 'Parts List' },
      ]);
    });

    it('should return Electrician doc flags', () => {
      const flags = getDocFlags('Electrician');
      expect(flags).toHaveLength(3);
      expect(flags[0].key).toBe('has_permit');
    });

    it('should return General doc flags for unknown trade', () => {
      const flags = getDocFlags('Unknown Trade');
      expect(flags).toEqual(getDocFlags('General'));
    });

    it('should return General doc flags when trade is empty', () => {
      const flags = getDocFlags('');
      expect(flags).toEqual(getDocFlags('General'));
    });
  });

  describe('getCriticalDocs', () => {
    it('should return Elevator critical docs', () => {
      const critical = getCriticalDocs('Elevator');
      expect(critical).toEqual(['has_prints', 'has_proposal']);
    });

    it('should return Electrician critical docs', () => {
      const critical = getCriticalDocs('Electrician');
      expect(critical).toEqual(['has_permit', 'has_proposal']);
    });

    it('should return HVAC critical docs', () => {
      const critical = getCriticalDocs('HVAC');
      expect(critical).toEqual(['has_proposal']);
    });

    it('should return General critical docs for unknown trade', () => {
      const critical = getCriticalDocs('Unknown Trade');
      expect(critical).toEqual(getCriticalDocs('General'));
    });

    it('should always include has_proposal for all trades', () => {
      const trades = ['Elevator', 'Electrician', 'Plumber', 'HVAC', 'Roofing', 'Carpenter', 'Painter'];

      trades.forEach((trade) => {
        const critical = getCriticalDocs(trade);
        expect(critical).toContain('has_proposal');
      });
    });
  });
});
