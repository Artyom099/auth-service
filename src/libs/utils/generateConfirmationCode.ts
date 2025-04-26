import { randomBytes } from 'crypto';

export const generateConfirmationCode = (): string => {
  const bytes = randomBytes(3); // 3 байта = 6 шестнадцатеричных цифр
  return bytes.toString('hex').slice(0, 6);
};
