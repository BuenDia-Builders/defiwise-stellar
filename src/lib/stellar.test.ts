import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRewardQuizArgs, buildMintBadgeArgs, computeXPPercent, checkXPRequirement } from './stellar';
import * as StellarSdk from '@stellar/stellar-sdk';

// ─── mock queryContract so checkXPRequirement never hits the network ───
vi.mock('./stellar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./stellar')>();
  return {
    ...actual,
    queryContract: vi.fn(),
  };
});

import { queryContract } from './stellar';

describe('stellar validations', () => {
  describe('buildRewardQuizArgs', () => {
    it('throws error when userPublicKey is empty', () => {
      expect(() => buildRewardQuizArgs('', 'challenge1', 5, 10, 50)).toThrow('userPublicKey cannot be empty');
      expect(() => buildRewardQuizArgs('   ', 'challenge1', 5, 10, 50)).toThrow('userPublicKey cannot be empty');
    });

    it('throws error when challengeId is empty', () => {
      expect(() => buildRewardQuizArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', '', 5, 10, 50)).toThrow('challengeId cannot be empty');
    });

    it('throws error when maxXp is not a positive integer', () => {
      expect(() => buildRewardQuizArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'challenge1', 5, 10, 0)).toThrow('xpAmount must be a positive integer');
      expect(() => buildRewardQuizArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'challenge1', 5, 10, -10)).toThrow('xpAmount must be a positive integer');
      expect(() => buildRewardQuizArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'challenge1', 5, 10, 5.5)).toThrow('xpAmount must be a positive integer');
    });

    it('returns valid args', () => {
      const args = buildRewardQuizArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'challenge1', 5, 10, 50);
      expect(args.length).toBe(5);
      expect(args[0]).toBeInstanceOf(StellarSdk.xdr.ScVal);
    });
  });

  describe('buildMintBadgeArgs', () => {
    it('throws error when userPublicKey is empty', () => {
      expect(() => buildMintBadgeArgs('', 'mod1', 'Title', 50, 100)).toThrow('userPublicKey cannot be empty');
    });

    it('throws error when moduleId is empty', () => {
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', '', 'Title', 50, 100)).toThrow('moduleId cannot be empty');
    });

    it('throws error when moduleTitle is empty', () => {
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', '   ', 50, 100)).toThrow('moduleTitle cannot be empty');
    });

    it('throws error when xpEarned is not a positive integer', () => {
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', 0, 100)).toThrow('xpAmount must be a positive integer');
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', -5, 100)).toThrow('xpAmount must be a positive integer');
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', 5.5, 100)).toThrow('xpAmount must be a positive integer');
    });

    it('throws error when score is invalid', () => {
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', 50, -1)).toThrow('score must be between 0 and 100');
      expect(() => buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', 50, 101)).toThrow('score must be between 0 and 100');
    });

    it('returns valid args', () => {
      const args = buildMintBadgeArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 'mod1', 'Title', 50, 100);
      expect(args.length).toBe(5);
      expect(args[0]).toBeInstanceOf(StellarSdk.xdr.ScVal);
    });
  });

  describe('computeXPPercent (on-chain progress)', () => {
    it('returns 0 when maxXP is zero or negative', () => {
      expect(computeXPPercent(BigInt(100), 0)).toBe(0);
      expect(computeXPPercent(BigInt(100), -5)).toBe(0);
    });

    it('returns 0 for zero or negative xp', () => {
      expect(computeXPPercent(BigInt(0), 200)).toBe(0);
      expect(computeXPPercent(-50, 200)).toBe(0);
    });

    it('computes the correct percentage from a bigint balance', () => {
      expect(computeXPPercent(BigInt(100), 200)).toBe(50);
      expect(computeXPPercent(BigInt(50), 200)).toBe(25);
    });

    it('accepts plain numbers too', () => {
      expect(computeXPPercent(150, 200)).toBe(75);
    });

    it('clamps to 100 when xp exceeds maxXP', () => {
      expect(computeXPPercent(BigInt(500), 200)).toBe(100);
    });
  });
});

describe('checkXPRequirement', () => {
  const VALID_KEY = 'GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC';

  beforeEach(() => {
    vi.mocked(queryContract).mockReset();
  });

  it('returns false for empty public key without calling the contract', async () => {
    const result = await checkXPRequirement('', 100);
    expect(result).toBe(false);
    expect(queryContract).not.toHaveBeenCalled();
  });

  it('returns true immediately when minXp <= 0 (no threshold)', async () => {
    const result = await checkXPRequirement(VALID_KEY, 0);
    expect(result).toBe(true);
    expect(queryContract).not.toHaveBeenCalled();
  });

  it('returns true when contract returns true (historical balance meets threshold)', async () => {
    // Simulate the contract returning ScBool true
    vi.mocked(queryContract).mockResolvedValueOnce(
      StellarSdk.nativeToScVal(true, { type: 'bool' })
    );
    const result = await checkXPRequirement(VALID_KEY, 50);
    expect(result).toBe(true);
    expect(queryContract).toHaveBeenCalledWith(
      expect.any(String),   // contract address
      'meets_requirement',
      expect.any(Array)
    );
  });

  it('returns false when contract returns false (insufficient historical XP)', async () => {
    vi.mocked(queryContract).mockResolvedValueOnce(
      StellarSdk.nativeToScVal(false, { type: 'bool' })
    );
    const result = await checkXPRequirement(VALID_KEY, 200);
    expect(result).toBe(false);
  });

  it('returns false when contract returns undefined (account not found)', async () => {
    vi.mocked(queryContract).mockResolvedValueOnce(undefined);
    const result = await checkXPRequirement(VALID_KEY, 100);
    expect(result).toBe(false);
  });

  it('uses meets_requirement (historical balance), not balance — gating invariant', async () => {
    vi.mocked(queryContract).mockResolvedValueOnce(
      StellarSdk.nativeToScVal(true, { type: 'bool' })
    );
    await checkXPRequirement(VALID_KEY, 100);
    // Verify we called meets_requirement, not balance or historical_balance directly
    expect(vi.mocked(queryContract).mock.calls[0][1]).toBe('meets_requirement');
  });
});
