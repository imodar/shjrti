export type AuthEmailType = 'signup' | 'reset' | 'magiclink' | 'resend';

export interface AuthEmailOptions {
  type: AuthEmailType;
  email: string;
  password?: string;
  userData?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
  };
  onProgress?: (message: string) => void;
}

export interface AuthServiceResult {
  error?: Error | null;
  data?: any;
}
