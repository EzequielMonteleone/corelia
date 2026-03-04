import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {findUserByEmail} from './userService.js';

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as
  | jwt.SignOptions['expiresIn']
  | undefined;

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

  const signOptions: jwt.SignOptions = {};
  if (JWT_EXPIRES_IN !== undefined) {
    signOptions.expiresIn = JWT_EXPIRES_IN;
  }

  const token = jwt.sign(payload, JWT_SECRET, signOptions);

  return token;
}
