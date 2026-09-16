// Centralized Frontend API Client SDK

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
  return data as T;
}

export const apiClient = {
  auth: {
    login: (username: string, password: string) =>
      request<{ success: boolean; user: any; redirectTo: string; message: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
  },
  employees: {
    getAll: (search?: string, siteId?: string) => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (siteId) params.append("siteId", siteId);
      return request<{ employees: any[] }>(`/api/employees?${params.toString()}`);
    },
    getById: (id: string) => request<{ employee: any }>(`/api/employees/${id}`),
    create: (data: any) =>
      request<{ employee: any; message: string }>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ employee: any; message: string }>(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/api/employees/${id}`, { method: "DELETE" }),
  },
  sites: {
    getAll: () => request<{ sites: any[] }>("/api/sites"),
    getById: (id: string) => request<{ site: any }>(`/api/sites/${id}`),
    create: (data: any) =>
      request<{ site: any; message: string }>("/api/sites", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ site: any; message: string }>(`/api/sites/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/api/sites/${id}`, { method: "DELETE" }),
  },
  leaves: {
    getAll: (employeeId?: string, status?: string) => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employeeId", employeeId);
      if (status) params.append("status", status);
      return request<{ leaves: any[] }>(`/api/leaves?${params.toString()}`);
    },
    create: (data: any) =>
      request<{ leave: any; message: string }>("/api/leaves", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: "APPROVED" | "REJECTED", approvedBy?: string) =>
      request<{ leave: any; message: string }>(`/api/leaves/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, approvedBy }),
      }),
  },
  payroll: {
    getByPeriod: (period: string, employeeId?: string) => {
      const params = new URLSearchParams({ period });
      if (employeeId) params.append("employeeId", employeeId);
      return request<{ payslips: any[]; period: string }>(`/api/payroll?${params.toString()}`);
    },
    calculate: (period: string, siteId?: string) =>
      request<{ payslips: any[]; message: string }>("/api/payroll", {
        method: "POST",
        body: JSON.stringify({ period, siteId }),
      }),
  },
  attendance: {
    getLogs: (siteId?: string, status?: string, date?: string) => {
      const params = new URLSearchParams();
      if (siteId) params.append("siteId", siteId);
      if (status) params.append("status", status);
      if (date) params.append("date", date);
      return request<{ attendances: any[] }>(`/api/admin/attendance?${params.toString()}`);
    },
    approveOrReject: (ids: string[], action: "APPROVE" | "REJECT", approvedBy?: string) =>
      request<{ message: string }>("/api/admin/attendance", {
        method: "PUT",
        body: JSON.stringify({ ids, action, approvedBy }),
      }),
  },
};
