import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;

function getSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error('JWT_SECRET environment variable is required');
	return secret;
}

export function hashPassword(password) {
	return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password, hash) {
	return bcrypt.compareSync(password, hash);
}

export function createToken(user) {
	return jwt.sign({ userId: user.id, username: user.username }, getSecret(), {
		expiresIn: TOKEN_EXPIRY
	});
}

export function verifyToken(token) {
	try {
		return jwt.verify(token, getSecret());
	} catch {
		return null;
	}
}
