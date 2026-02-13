import { SignatureChainEntry } from '../types';
import CryptoJS from 'crypto-js';

export const validateSignatureChain = (chain: SignatureChainEntry[]): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!chain || chain.length === 0) {
      return { valid: true, errors: [] };
  }

  // Check first signature has no previous hash (or genesis hash)
  if (chain[0]?.previousHash && chain[0].previousHash !== '0') {
    errors.push('Invalid chain start: Genesis block previousHash is not "0".');
  }
  
  for (let i = 1; i < chain.length; i++) {
    // Check sequential hashes
    if (chain[i].previousHash !== chain[i-1].hash) {
      errors.push(`Hash chain broken at index ${i}. Expected previous hash ${chain[i-1].hash} but got ${chain[i].previousHash}.`);
    }
    
    // Check timestamps are sequential
    if (new Date(chain[i].timestamp) < new Date(chain[i-1].timestamp)) {
      errors.push(`Timestamp out of order at index ${i}.`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};