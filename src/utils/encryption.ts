import CryptoJS from 'crypto-js';

const SECRET_KEY = 'slide-generator-secret-key-2024';

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

export const saveEncryptedApiKey = (apiKey: string): void => {
  const encrypted = encryptData(apiKey);
  localStorage.setItem('geminiApiKey', encrypted);
};

export const getDecryptedApiKey = (): string => {
  const encrypted = localStorage.getItem('geminiApiKey');
  if (!encrypted) return '';
  return decryptData(encrypted);
};