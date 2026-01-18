import { apiClient } from '../client';

export interface ContactSubmission {
  full_name: string;
  email: string;
  description: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  id: string;
}

export const contactApi = {
  /**
   * Submit a contact form
   */
  submit: async (data: ContactSubmission): Promise<ContactSubmissionResponse> => {
    return apiClient.post<ContactSubmissionResponse>('/api-contact', data);
  },
};
