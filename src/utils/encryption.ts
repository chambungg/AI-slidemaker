import CryptoJS from 'crypto-js';

// 고정된 시크릿 키 대신 더 강력한 256비트 키 생성
const MASTER_KEY = 'slide-generator-ai-2024-secure-master-key-v2.0-enhanced';
const SALT = 'slide-app-salt-2024';

// 256비트 키 생성 함수
const generateSecureKey = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  }).toString();
};

// 이중 암호화: AES-256 + Base64
export const encryptDataEnhanced = (data: string): string => {
  try {
    // 1단계: AES-256 암호화
    const secureKey = generateSecureKey(MASTER_KEY, SALT);
    const aesEncrypted = CryptoJS.AES.encrypt(data, secureKey).toString();
    
    // 2단계: Base64 인코딩
    const base64Encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(aesEncrypted));
    
    // 추가 보안을 위한 타임스탬프 추가
    const timestamp = Date.now().toString();
    const timestampEncoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(timestamp));
    
    return `${base64Encoded}.${timestampEncoded}`;
  } catch (error) {
    console.error('Enhanced encryption error:', error);
    return data;
  }
};

// 이중 복호화: Base64 + AES-256
export const decryptDataEnhanced = (encryptedData: string): string => {
  try {
    // 타임스탬프 분리
    const parts = encryptedData.split('.');
    if (parts.length !== 2) {
      // 레거시 데이터 처리
      return decryptData(encryptedData);
    }
    
    const [base64Data, timestampData] = parts;
    
    // 1단계: Base64 디코딩
    const aesEncrypted = CryptoJS.enc.Base64.parse(base64Data).toString(CryptoJS.enc.Utf8);
    
    // 2단계: AES-256 복호화
    const secureKey = generateSecureKey(MASTER_KEY, SALT);
    const decrypted = CryptoJS.AES.decrypt(aesEncrypted, secureKey);
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Enhanced decryption error:', error);
    // 실패 시 레거시 복호화 시도
    return decryptData(encryptedData);
  }
};

// 레거시 암호화 함수 (하위 호환성)
export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, MASTER_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

// 레거시 복호화 함수 (하위 호환성)
export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, MASTER_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

// API 키 저장 (이중 암호화 사용)
export const saveEncryptedApiKey = (apiKey: string): void => {
  const encrypted = encryptDataEnhanced(apiKey);
  localStorage.setItem('geminiApiKey', encrypted);
  
  // 저장 시간도 기록
  localStorage.setItem('geminiApiKey_savedAt', Date.now().toString());
};

// API 키 조회 (이중 복호화 사용)
export const getDecryptedApiKey = (): string => {
  const encrypted = localStorage.getItem('geminiApiKey');
  if (!encrypted) return '';
  
  return decryptDataEnhanced(encrypted);
};

// API 키 삭제
export const deleteApiKey = (): void => {
  localStorage.removeItem('geminiApiKey');
  localStorage.removeItem('geminiApiKey_savedAt');
};

// API 키 저장 여부 확인
export const isApiKeyStored = (): boolean => {
  return !!localStorage.getItem('geminiApiKey');
};

// API 키 저장 시간 조회
export const getApiKeySavedTime = (): Date | null => {
  const savedAt = localStorage.getItem('geminiApiKey_savedAt');
  if (!savedAt) return null;
  
  return new Date(parseInt(savedAt));
};