import axios from 'axios';

const PRINTFUL_API_BASE = 'https://api.printful.com';
const apiKey = process.env.PRINTFUL_API_KEY;
const storeId = process.env.PRINTFUL_STORE_ID || '16414489';

if (!apiKey) {
  throw new Error('PRINTFUL_API_KEY environment variable is not set.');
}

export const printful = axios.create({
  baseURL: PRINTFUL_API_BASE,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'X-PF-Store-Id': storeId,
  },
  timeout: 15000, // 15 second timeout
});
