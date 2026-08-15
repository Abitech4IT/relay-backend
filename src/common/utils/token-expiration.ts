export function getExpirationDate(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid expiration format: ${expiresIn}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const milliseconds = amount * multipliers[unit];

  return new Date(Date.now() + milliseconds);
}
