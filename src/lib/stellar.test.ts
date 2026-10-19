import { describe, it, expect } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  buildRewardQuizArgs,
  buildMintBadgeArgs,
  computeXPPercent,
  buildMeetsRequirementArgs,
  meetsXPRequirement,
} from './stellar';

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

  describe('buildMeetsRequirementArgs (Issue #38 on-chain gating)', () => {
    it('throws error when userPublicKey is empty', () => {
      expect(() => buildMeetsRequirementArgs('', 50)).toThrow('userPublicKey cannot be empty');
      expect(() => buildMeetsRequirementArgs('   ', 50)).toThrow('userPublicKey cannot be empty');
    });

    it('throws error when minXp is negative', () => {
      expect(() => buildMeetsRequirementArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', -10)).toThrow('minXp cannot be negative');
    });

    it('returns valid ScVal array for valid address and positive minXp', () => {
      const args = buildMeetsRequirementArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 50);
      expect(args.length).toBe(2);
      expect(args[0]).toBeInstanceOf(StellarSdk.xdr.ScVal);
      expect(args[1]).toBeInstanceOf(StellarSdk.xdr.ScVal);
    });

    it('accepts bigint for minXp', () => {
      const args = buildMeetsRequirementArgs('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', BigInt(100));
      expect(args.length).toBe(2);
    });
  });

  describe('meetsXPRequirement pure validation checks', () => {
    it('returns false when userPublicKey is empty', async () => {
      const res = await meetsXPRequirement('', 50);
      expect(res).toBe(false);
    });

    it('returns true when minXp is 0 or negative without querying contract', async () => {
      const res = await meetsXPRequirement('GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC', 0);
      expect(res).toBe(true);
    });
  });
});

