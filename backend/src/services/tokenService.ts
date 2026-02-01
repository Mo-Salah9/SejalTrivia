import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface JWTPayload {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, jwtConfig.secret) as JWTPayload;
};
