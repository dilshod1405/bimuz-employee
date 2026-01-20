// API configuration and service functions

import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite loop during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        // Redirect to login or clear auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(error);
      }

      try {
        // Use axios directly (not axiosInstance) to avoid interceptor loop
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/token/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { access } = response.data;
        
        // Update tokens in localStorage
        localStorage.setItem('access_token', access);
        
        // Update tokens in Zustand store if it exists
        try {
          const authStore = (await import('@/stores/authStore')).useAuthStore.getState();
          if (authStore.tokens) {
            authStore.tokens.access = access;
          }
        } catch {
          // Store might not be available, ignore
        }

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Process queued requests
        processQueue(null, access);
        isRefreshing = false;

        // Retry original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        try {
          const authStore = (await import('@/stores/authStore')).useAuthStore.getState();
          authStore.logout();
        } catch {
          // Store might not be available, ignore
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Tokens {
  refresh: string;
  access: string;
}

export interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  professionality?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    employee: Employee;
    tokens: Tokens;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface EmployeeListResponse {
  success?: boolean;
  message?: string;
  data?: Employee[];
  // Pagination response format
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Employee[];
}

export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

export interface CreateEmployeeData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  full_name: string;
  role: string;
  professionality?: string | null;
  avatar?: File | null;
  is_active?: boolean;
}

export interface UpdateEmployeeData {
  full_name?: string;
  role?: string;
  professionality?: string | null;
  is_active?: boolean;
  avatar?: File | null;
}

export interface Student {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  passport_serial_number: string;
  birth_date: string;
  source: string;
  source_display: string;
  address?: string | null;
  inn?: string | null;
  pinfl?: string | null;
  group?: number | null;
  group_name?: string | null;
  contract_signed?: boolean;
  contract_url?: string | null;
  certificate_url?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentListResponse {
  success?: boolean;
  message?: string;
  data?: Student[];
  // Pagination response format
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Student[];
}

export interface StudentResponse {
  success: boolean;
  message: string;
  data: Student;
}

export interface CreateStudentData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  phone: string;
  passport_serial_number: string;
  birth_date: string;
  source: string;
  address: string;
  inn: string;
  pinfl: string;
}

export interface UpdateStudentData {
  full_name?: string;
  phone?: string;
  passport_serial_number?: string;
  birth_date?: string;
  source?: string;
  address?: string;
  inn?: string;
  pinfl?: string;
  group?: number | null;
  certificate?: File | null;
  is_active?: boolean;
}

export interface Group {
  id: number;
  speciality_id: string;
  speciality_display: string;
  dates: string;
  dates_display: string;
  time: string;
  starting_date?: string | null;
  finish_date?: string | null;
  total_lessons?: number | null;
  current_lesson_number?: number;
  seats: number;
  current_students_count?: number;
  available_seats?: number;
  is_planned?: boolean;
  is_active: boolean;
  price: string;
  mentor?: number | null;
  mentor_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupListResponse {
  success?: boolean;
  message?: string;
  data?: Group[];
  // Pagination response format
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Group[];
}

export interface GroupResponse {
  success: boolean;
  message: string;
  data: Group;
}

export interface CreateGroupData {
  speciality_id: string;
  dates: string;
  time: string;
  starting_date?: string | null;
  seats: number;
  price: string;
  total_lessons?: number | null;
  mentor?: number | null;
}

export interface UpdateGroupData {
  speciality_id?: string;
  dates?: string;
  time?: string;
  starting_date?: string | null;
  seats?: number;
  price?: string;
  total_lessons?: number | null;
  mentor?: number | null;
  is_active?: boolean;
}

export interface Invoice {
  id: number;
  student: number;
  student_name: string;
  student_phone: string;
  group: number;
  group_name: string;
  amount: string;
  status: string;
  status_display: string;
  is_paid: boolean;
  multicard_uuid?: string | null;
  multicard_invoice_id?: string | null;
  checkout_url?: string | null;
  receipt_url?: string | null;
  payment_time?: string | null;
  payment_method?: string | null;
  card_pan?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResponse {
  success?: boolean;
  message?: string;
  data?: Invoice[];
  // Pagination response format
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Invoice[];
}

// Attendance interfaces
export interface AttendanceParticipant {
  id: number;
  full_name: string;
  phone?: string | null;
}

export interface Attendance {
  id: number;
  group: number;
  group_name: string;
  date: string;
  time: string;
  mentor?: number | null;
  mentor_name?: string | null;
  participants: number[];
  participants_count?: number;
  participants_list?: AttendanceParticipant[];
  created_at: string;
  updated_at: string;
}

export interface AttendanceListResponse {
  success?: boolean;
  message?: string;
  data?: Attendance[];
  // Pagination response format
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Attendance[];
}

export interface AttendanceResponse {
  success?: boolean;
  message?: string;
  data: Attendance;
}

export interface CreateAttendanceData {
  group: number;
  date: string;
  mentor?: number | null;
  participants?: number[];
}

export interface UpdateAttendanceData {
  group?: number;
  date?: string;
  mentor?: number | null;
  participants?: number[];
}

async function apiRequest<T>(
  endpoint: string,
  config: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await axiosInstance.request<T>({
      url: endpoint,
      ...config,
    });
    return response.data;
  } catch (error) {
    // Check if it's an Axios error
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      // If we have a response from the server, use it
      if (axiosError.response) {
        throw {
          status: axiosError.response.status,
          ...axiosError.response.data,
        } as ApiError & { status: number };
      }
      
      // Network error or connection issues (no response from server)
      throw {
        success: false,
        message: axiosError.message.includes('Network Error') || axiosError.code === 'ERR_NETWORK'
          ? 'Internet aloqasi bilan muammo yuz berdi. Iltimos, qayta urinib ko\'ring.'
          : 'So\'rovni bajarishda xatolik yuz berdi.',
        status: 0,
      } as ApiError & { status: number };
    }
    
    // Non-Axios errors
    throw {
      success: false,
      message: 'Noma\'lum xatolik yuz berdi.',
      status: 0,
    } as ApiError & { status: number };
  }
}

export const api = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/v1/auth/login/', {
      method: 'POST',
      data: credentials,
    });
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    return apiRequest<{ access: string }>('/api/v1/auth/token/refresh/', {
      method: 'POST',
      data: { refresh: refreshToken },
    });
  },

  // Employee CRUD operations
  async getEmployees(search?: string): Promise<EmployeeListResponse> {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const queryString = params.toString();
    const url = `/api/v1/auth/employees/${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<EmployeeListResponse>(url, {
      method: 'GET',
    });
  },

  async getEmployee(id: number): Promise<EmployeeResponse> {
    return apiRequest<EmployeeResponse>(`/api/v1/auth/employees/${id}/`, {
      method: 'GET',
    });
  },

  async createEmployee(data: CreateEmployeeData): Promise<EmployeeResponse> {
    const isFormData = !!data.avatar;
    
    if (isFormData) {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('password', data.password);
      formData.append('password_confirm', data.password_confirm);
      formData.append('full_name', data.full_name);
      formData.append('role', data.role);
      if (data.professionality) {
        formData.append('professionality', data.professionality);
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }
      if (data.avatar) {
        formData.append('avatar', data.avatar);
      }

      return apiRequest<EmployeeResponse>('/api/v1/auth/register/', {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return apiRequest<EmployeeResponse>('/api/v1/auth/register/', {
        method: 'POST',
        data: {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          password: data.password,
          password_confirm: data.password_confirm,
          full_name: data.full_name,
          role: data.role,
          professionality: data.professionality || null,
          ...(data.is_active !== undefined && { is_active: data.is_active }),
        },
      });
    }
  },

  async updateEmployee(id: number, data: UpdateEmployeeData): Promise<EmployeeResponse> {
    const isFormData = !!data.avatar;
    
    if (isFormData) {
      const formData = new FormData();
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.role) formData.append('role', data.role);
      if (data.professionality !== undefined) {
        formData.append('professionality', data.professionality || '');
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }
      if (data.avatar) {
        formData.append('avatar', data.avatar);
      }

      return apiRequest<EmployeeResponse>(`/api/v1/auth/employees/${id}/`, {
        method: 'PATCH',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return apiRequest<EmployeeResponse>(`/api/v1/auth/employees/${id}/`, {
        method: 'PATCH',
        data,
      });
    }
  },

  async deleteEmployee(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/api/v1/auth/employees/${id}/`, {
      method: 'DELETE',
    });
  },

  // Student CRUD operations (for employees)
  async getStudents(search?: string): Promise<StudentListResponse> {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const queryString = params.toString();
    const url = `/api/v1/auth/students/${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<StudentListResponse>(url, {
      method: 'GET',
    });
  },

  async getStudent(id: number): Promise<StudentResponse> {
    return apiRequest<StudentResponse>(`/api/v1/auth/students/${id}/`, {
      method: 'GET',
    });
  },

  async createStudent(data: CreateStudentData): Promise<StudentResponse> {
    return apiRequest<StudentResponse>('/api/v1/auth/students/', {
      method: 'POST',
      data,
    });
  },

  async updateStudent(id: number, data: UpdateStudentData): Promise<StudentResponse> {
    const isFormData = !!data.certificate;
    
    if (isFormData) {
      const formData = new FormData();
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.phone) formData.append('phone', data.phone);
      if (data.passport_serial_number) formData.append('passport_serial_number', data.passport_serial_number);
      if (data.birth_date) formData.append('birth_date', data.birth_date);
      if (data.source) formData.append('source', data.source);
      if (data.address !== undefined) formData.append('address', data.address);
      if (data.inn !== undefined) formData.append('inn', data.inn || '');
      if (data.pinfl !== undefined) formData.append('pinfl', data.pinfl || '');
      if (data.group !== undefined) formData.append('group', data.group?.toString() || '');
      if (data.certificate) {
        formData.append('certificate', data.certificate);
      }

      return apiRequest<StudentResponse>(`/api/v1/auth/students/${id}/`, {
        method: 'PATCH',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return apiRequest<StudentResponse>(`/api/v1/auth/students/${id}/`, {
        method: 'PATCH',
        data,
      });
    }
  },

  async deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/api/v1/auth/students/${id}/`, {
      method: 'DELETE',
    });
  },

  // Group CRUD operations
  async getGroups(): Promise<GroupListResponse> {
    return apiRequest<GroupListResponse>('/api/v1/education/groups/', {
      method: 'GET',
    });
  },

  async getGroup(id: number): Promise<GroupResponse> {
    return apiRequest<GroupResponse>(`/api/v1/education/groups/${id}/`, {
      method: 'GET',
    });
  },

  async createGroup(data: CreateGroupData): Promise<GroupResponse> {
    return apiRequest<GroupResponse>('/api/v1/education/groups/', {
      method: 'POST',
      data,
    });
  },

  async updateGroup(id: number, data: UpdateGroupData): Promise<GroupResponse> {
    return apiRequest<GroupResponse>(`/api/v1/education/groups/${id}/`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteGroup(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/api/v1/education/groups/${id}/`, {
      method: 'DELETE',
    });
  },

  // Invoice operations (for employees)
  async getInvoices(search?: string, status?: string, ordering?: string, page?: number): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    params.append('page_size', '30'); // 30 items per page
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (status && status.trim()) {
      params.append('status', status.trim());
    }
    if (ordering && ordering.trim()) {
      params.append('ordering', ordering.trim());
    }
    if (page) {
      params.append('page', page.toString());
    }
    
    const queryString = params.toString();
    const url = `/api/v1/payment/employee-invoices/?${queryString}`;
    
    return apiRequest<InvoiceListResponse>(url, {
      method: 'GET',
    });
  },

  // Attendance operations
  async getAttendances(search?: string, group?: number, mentor?: number, date?: string, page?: number): Promise<AttendanceListResponse> {
    const params = new URLSearchParams();
    params.append('page_size', '50'); // 50 items per page
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (group) {
      params.append('group', group.toString());
    }
    if (mentor) {
      params.append('mentor', mentor.toString());
    }
    if (date && date.trim()) {
      params.append('date', date.trim());
    }
    if (page) {
      params.append('page', page.toString());
    }
    
    const queryString = params.toString();
    const url = `/api/v1/education/attendances/${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AttendanceListResponse>(url, {
      method: 'GET',
    });
  },

  async getAttendance(id: number): Promise<AttendanceResponse> {
    return apiRequest<AttendanceResponse>(`/api/v1/education/attendances/${id}/`, {
      method: 'GET',
    });
  },

  async createAttendance(data: CreateAttendanceData): Promise<AttendanceResponse> {
    return apiRequest<AttendanceResponse>('/api/v1/education/attendances/', {
      method: 'POST',
      data,
    });
  },

  async updateAttendance(id: number, data: UpdateAttendanceData): Promise<AttendanceResponse> {
    return apiRequest<AttendanceResponse>(`/api/v1/education/attendances/${id}/`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteAttendance(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/api/v1/education/attendances/${id}/`, {
      method: 'DELETE',
    });
  },
};

export default api;
