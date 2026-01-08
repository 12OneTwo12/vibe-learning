/**
 * Mode Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ModeService } from '../../src/services/mode.service.js';
import { resetDatabase, getDatabaseConnection } from '../../src/db/index.js';

const TEST_DB_DIR = path.join(os.tmpdir(), 'vibe-learning-mode-test-' + Date.now());

describe('ModeService', () => {
  let service: ModeService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    getDatabaseConnection({ dbDir: TEST_DB_DIR });
    service = new ModeService();
  });

  afterEach(() => {
    resetDatabase();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  describe('getMode', () => {
    it('should return default state with both modes enabled', () => {
      const result = service.getMode();

      expect(result.seniorEnabled).toBe(true);
      expect(result.afterEnabled).toBe(true);
      expect(result.pausedUntil).toBeNull();
      expect(result.focusArea).toBeNull();
    });

    it('should include behavior instructions when modes are enabled', () => {
      const result = service.getMode();

      expect(result.seniorBehavior).toContain('Senior');
      expect(result.afterBehavior).toContain('After');
    });
  });

  describe('setSeniorEnabled', () => {
    it('should enable senior mode', () => {
      service.setSeniorEnabled(false); // Disable first
      const result = service.setSeniorEnabled(true);

      expect(result.updated).toBe(true);
      expect(result.seniorEnabled).toBe(true);
      expect(result.message).toContain('enabled');
    });

    it('should disable senior mode', () => {
      const result = service.setSeniorEnabled(false);

      expect(result.updated).toBe(true);
      expect(result.seniorEnabled).toBe(false);
      expect(result.message).toContain('disabled');
    });
  });

  describe('setAfterEnabled', () => {
    it('should enable after mode', () => {
      service.setAfterEnabled(false); // Disable first
      const result = service.setAfterEnabled(true);

      expect(result.updated).toBe(true);
      expect(result.afterEnabled).toBe(true);
    });

    it('should disable after mode', () => {
      const result = service.setAfterEnabled(false);

      expect(result.updated).toBe(true);
      expect(result.afterEnabled).toBe(false);
    });
  });

  describe('setModes', () => {
    it('should set both modes at once', () => {
      const result = service.setModes(false, false);

      expect(result.updated).toBe(true);
      expect(result.seniorEnabled).toBe(false);
      expect(result.afterEnabled).toBe(false);
      expect(result.message).toContain('off');
    });

    it('should show correct message for full learning', () => {
      const result = service.setModes(true, true);
      expect(result.message).toContain('Full learning');
    });

    it('should show correct message for senior only', () => {
      const result = service.setModes(true, false);
      expect(result.message).toContain('Senior mode only');
    });

    it('should show correct message for after only', () => {
      const result = service.setModes(false, true);
      expect(result.message).toContain('After mode only');
    });
  });

  describe('turnOff / turnOnFull', () => {
    it('should turn off all learning', () => {
      const result = service.turnOff();

      expect(result.seniorEnabled).toBe(false);
      expect(result.afterEnabled).toBe(false);
    });

    it('should turn on full learning', () => {
      service.turnOff();
      const result = service.turnOnFull();

      expect(result.seniorEnabled).toBe(true);
      expect(result.afterEnabled).toBe(true);
    });
  });

  describe('pause / resume', () => {
    it('should pause learning', () => {
      const result = service.pause(1);

      expect(result.updated).toBe(true);
      expect(result.message).toContain('Paused');
    });

    it('should resume from pause', () => {
      service.pause(1);
      const result = service.resume();

      expect(result.updated).toBe(true);
      expect(result.message).toContain('Resumed');
    });

    it('should disable modes when paused', () => {
      service.pause(1);
      const mode = service.getMode();

      expect(mode.seniorEnabled).toBe(false);
      expect(mode.afterEnabled).toBe(false);
    });
  });

  describe('setFocusArea', () => {
    it('should set focus area', () => {
      const result = service.setFocusArea('caching');

      expect(result.updated).toBe(true);
      expect(result.message).toContain('caching');
    });

    it('should clear focus area', () => {
      service.setFocusArea('caching');
      const result = service.setFocusArea(null);

      expect(result.updated).toBe(true);
      expect(result.message).toContain('cleared');
    });
  });

  describe('helper methods', () => {
    it('should check if learning is active', () => {
      expect(service.isLearningActive()).toBe(true);
      service.turnOff();
      expect(service.isLearningActive()).toBe(false);
    });

    it('should check if senior is active', () => {
      expect(service.isSeniorActive()).toBe(true);
      service.setSeniorEnabled(false);
      expect(service.isSeniorActive()).toBe(false);
    });

    it('should check if after is active', () => {
      expect(service.isAfterActive()).toBe(true);
      service.setAfterEnabled(false);
      expect(service.isAfterActive()).toBe(false);
    });

    it('should return max rounds for senior mode', () => {
      expect(service.getSeniorModeMaxRounds()).toBe(3);
      service.setSeniorEnabled(false);
      expect(service.getSeniorModeMaxRounds()).toBe(0);
    });
  });
});
