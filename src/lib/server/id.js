import crypto from 'crypto';

export function makeId() {
	return crypto.randomUUID();
}
