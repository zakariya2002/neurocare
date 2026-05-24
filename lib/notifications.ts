import { supabase } from './supabase';

export type NotificationType =
  | 'contact_request'
  | 'message'
  | 'appointment'
  | 'appointment_accepted'
  | 'appointment_rejected'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Crée une nouvelle notification pour un utilisateur
 */
export async function createNotification(input: CreateNotificationInput): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        content: input.content || null,
        link: input.link || null,
        metadata: input.metadata || null,
      });

    if (error) {
      console.error('Erreur création notification:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur création notification:', error);
    return { success: false, error };
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Récupère le nombre de notifications non lues
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur comptage notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    return 0;
  }
}

/**
 * Marque une notification comme lue
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur marquage notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    return false;
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur marquage notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    return false;
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur suppression notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    return false;
  }
}

// === Fonctions helper pour créer des notifications spécifiques ===

/**
 * Crée une notification de demande de contact
 */
export async function notifyContactRequest(
  educatorUserId: string,
  familyName: string,
  conversationId: string
): Promise<{ success: boolean; error?: any }> {
  return createNotification({
    user_id: educatorUserId,
    type: 'contact_request',
    title: 'Nouvelle demande de contact',
    content: `${familyName} souhaite vous contacter pour un accompagnement.`,
    link: '/messagerie',
    metadata: {
      conversation_id: conversationId,
      sender_name: familyName,
    },
  });
}

/**
 * Crée une notification de nouveau message
 */
export async function notifyNewMessage(
  receiverUserId: string,
  senderName: string,
  conversationId: string,
  messagePreview: string
): Promise<{ success: boolean; error?: any }> {
  return createNotification({
    user_id: receiverUserId,
    type: 'message',
    title: `Nouveau message de ${senderName}`,
    content: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    link: '/messagerie',
    metadata: {
      conversation_id: conversationId,
      sender_name: senderName,
    },
  });
}

/**
 * Crée une notification de rendez-vous accepté
 */
export async function notifyAppointmentAccepted(
  familyUserId: string,
  educatorName: string,
  appointmentDate: string,
  appointmentId: string
): Promise<{ success: boolean; error?: any }> {
  return createNotification({
    user_id: familyUserId,
    type: 'appointment_accepted',
    title: 'Rendez-vous confirmé',
    content: `Votre rendez-vous avec ${educatorName} le ${appointmentDate} a été accepté.`,
    link: '/dashboard/family/appointments',
    metadata: {
      appointment_id: appointmentId,
      educator_name: educatorName,
    },
  });
}

/**
 * Crée une notification de rendez-vous refusé
 */
export async function notifyAppointmentRejected(
  familyUserId: string,
  educatorName: string,
  appointmentDate: string,
  appointmentId: string
): Promise<{ success: boolean; error?: any }> {
  return createNotification({
    user_id: familyUserId,
    type: 'appointment_rejected',
    title: 'Rendez-vous non disponible',
    content: `Votre demande de rendez-vous avec ${educatorName} le ${appointmentDate} n'a pas pu être acceptée.`,
    link: '/dashboard/family/appointments',
    metadata: {
      appointment_id: appointmentId,
      educator_name: educatorName,
    },
  });
}
