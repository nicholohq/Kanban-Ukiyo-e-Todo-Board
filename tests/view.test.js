import { describe, test, expect } from 'vitest';
import { VIEWS, normalizeView } from '../src/lib/utils/view.js';

describe('normalizeView', () => {
	test('accepts the three views', () => {
		expect(VIEWS).toEqual(['board', 'list', 'notes']);
		expect(normalizeView('notes')).toBe('notes');
		expect(normalizeView('list')).toBe('list');
		expect(normalizeView('board')).toBe('board');
	});

	test('falls back to board for anything else', () => {
		expect(normalizeView('gallery')).toBe('board');
		expect(normalizeView(undefined)).toBe('board');
		expect(normalizeView(null)).toBe('board');
	});
});
