import { message } from 'antd';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface User {
  key: React.Key;
  no: number;
  id: string;
  name: string;
  password?: string;
  company: string;
  department: string;
  title: string;
  phone?: string;
  email?: string;
  startDate: string;
  joinDate: string;
  employmentType: string;
  contract: string;
  status: string;
  level: string;
  auth: number;
}

export const updateUser = async (username: string, userData: User, token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${username}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (response.status === 401) {
      throw new Error('Token hết hạn hoặc không hợp lệ');
    }
    
    if (response.status === 403) {
      throw new Error('Không có quyền thực hiện thao tác này');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi cập nhật');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};