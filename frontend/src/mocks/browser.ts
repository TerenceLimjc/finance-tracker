/**
 * MSW browser worker setup.
 * Imported only in dev mode (see main.tsx).
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
