import type { PowerAction } from './types';

export const ACTION_CONFIG: Record<PowerAction, { path: string; success: (name: string) => string; failure: string }> = {
  wake: {
    path: 'api/wake',
    success: (name) => `Sent Wake command to ${name}.`,
    failure: 'Failed to send Wake command.'
  },
  shutdown: {
    path: 'api/shutdown',
    success: (name) => `Sent Shutdown command to ${name}.`,
    failure: 'Failed to send Shutdown command.'
  },
  reboot: {
    path: 'api/reboot',
    success: (name) => `Sent Reboot command to ${name}.`,
    failure: 'Failed to send Reboot command.'
  }
};

export const ACTION_LABELS: Record<PowerAction, string> = {
  wake: 'Wake',
  shutdown: 'Shutdown',
  reboot: 'Reboot'
};

export const PORTAL_URL = '/';
