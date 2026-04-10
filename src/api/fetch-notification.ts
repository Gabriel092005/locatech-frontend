import { api } from "@/lib/axios";

// 1. Representa um objeto de notificação individual
interface Notification {
  id: number;
  content: string;
  userId: number;
  created_at: string; // O formato "2026-04-10T..." chega como string
}

// 2. Representa o objeto exato que você postou (o "envelope")
interface NotificationResponse {
  notifications: Notification[];
}

interface FetchNotificationParams {
  userId: number;
}

export async function FetchNotification({ userId }: FetchNotificationParams) {
  try {
    
    const response = await api.get<NotificationResponse>('/notif');
    console.log('OLAAAAAAAAAAA', response.data);

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    throw error;
  }
}