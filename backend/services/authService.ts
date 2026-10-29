import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {findUserByEmail} from './userService.js';

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;

function jwtExpiresIn(): Exclude<jwt.SignOptions['expiresIn'], undefined> {
  const configured = process.env.JWT_EXPIRES_IN?.trim();
  if (!configured) return '7d';
  return configured as Exclude<jwt.SignOptions['expiresIn'], undefined>;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return user;
}

export function generateJwt(user: {id: string; email: string}) {
  const payload = {
    sub: user.id,
    email: user.email,
  };

  const signOptions: jwt.SignOptions = {
    expiresIn: jwtExpiresIn(),
  };

  const token = jwt.sign(payload, JWT_SECRET, signOptions);

  return token;
}
