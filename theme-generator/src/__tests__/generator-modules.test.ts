/**
 * Basic smoke test for generator modules
 */

import { describe, it, expect } from 'vitest';
import { generateBlockTemplates } from '../generator/blockTemplates';
import { generatePHPSections } from '../generator/phpSections';
import { generateBlockPatterns } from '../generator/patterns';
import { copyAssets, generateAssetMap } from '../generator/assets';
import { generateReports } from '../generator/reports';

describe('Generator Modules', () => {
  it('should export generateBlockTemplates function', () => {
    expect(generateBlockTemplates).toBeDefined();
    expect(typeof generateBlockTemplates).toBe('function');
  });

  it('should export generatePHPSections function', () => {
    expect(generatePHPSections).toBeDefined();
    expect(typeof generatePHPSections).toBe('function');
  });

  it('should export generateBlockPatterns function', () => {
    expect(generateBlockPatterns).toBeDefined();
    expect(typeof generateBlockPatterns).toBe('function');
  });

  it('should export copyAssets function', () => {
    expect(copyAssets).toBeDefined();
    expect(typeof copyAssets).toBe('function');
  });

  it('should export generateAssetMap function', () => {
    expect(generateAssetMap).toBeDefined();
    expect(typeof generateAssetMap).toBe('function');
  });

  it('should export generateReports function', () => {
    expect(generateReports).toBeDefined();
    expect(typeof generateReports).toBe('function');
  });
});
