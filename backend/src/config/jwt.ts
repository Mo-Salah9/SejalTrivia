export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

if (process.env.NODE_ENV === 'production' && jwtConfig.secret === 'change-this-secret-in-production') {
  console.error('❌ FATAL: JWT_SECRET must be set in production!');
  process.exit(1);
}
