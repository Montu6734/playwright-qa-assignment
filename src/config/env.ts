import 'dotenv/config';

export const config = {
  baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
  apiBaseURL: process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com',
  apiTimeoutMs: Number(process.env.API_TIMEOUT_MS ?? 10_000),
  defaultPassword: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
};
