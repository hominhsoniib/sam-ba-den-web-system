import { api } from "./api";
import type { User } from "./types";

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  description: string | null;
  permission_ids: string[];
}

export interface RoleUpdate {
  name: string;
  description: string | null;
  permission_ids: string[];
}

export const rbacApi = {
  listPermissions: async () => {
    const res = await api.get<{ data: Permission[] }>("/admin/permissions");
    return res.data.data;
  },

  listRoles: async () => {
    const res = await api.get<{ data: Role[] }>("/admin/roles");
    return res.data.data;
  },

  createRole: async (data: RoleCreate) => {
    const res = await api.post<{ data: Role }>("/admin/roles", data);
    return res.data.data;
  },

  updateRole: async (id: string, data: RoleUpdate) => {
    const res = await api.put<{ data: Role }>(`/admin/roles/${id}`, data);
    return res.data.data;
  },

  deleteRole: async (id: string) => {
    const res = await api.delete(`/admin/roles/${id}`);
    return res.data;
  },

  listUsers: async () => {
    const res = await api.get<{ data: User[] }>("/admin/users");
    return res.data.data;
  },

  updateUserRoles: async (userId: string, roleIds: string[]) => {
    const res = await api.put<{ data: User }>(`/admin/users/${userId}/roles`, {
      role_ids: roleIds,
    });
    return res.data.data;
  },
};
