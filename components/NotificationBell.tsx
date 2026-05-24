'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'message' | 'appointment' | 'invoice' | 'contact_request';
  title: string;
  description: string;
  link: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  educatorId: string;
  userId: string;
  position?: 'left' | 'right';
}

export default function NotificationBell({ educatorId, userId, position = 'right' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Charger les notifications lues depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`readNotifs_${educatorId}`);
    if (stored) {
      setReadNotifIds(new Set(JSON.parse(stored)));
    }
  }, [educatorId]);

  useEffect(() => {
    fetchNotifications();

    // Polling toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [educatorId, userId, readNotifIds]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestion du clavier pour l'accessibilité
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen) {
        if (event.key === 'Escape') {
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const notifs: Notification[] = [];

      // 1. Messages non lus
      const { data: unreadMessages, error: msgError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id
        `)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!msgError && unreadMessages) {
        unreadMessages.forEach((msg: any) => {
          const senderName = 'Nouveau message';
          notifs.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: 'Nouveau message',
            description: `${senderName}: ${msg.content?.substring(0, 50)}${msg.content?.length > 50 ? '...' : ''}`,
            link: '/messagerie',
            time: formatTime(msg.created_at),
            read: false,
          });
        });
      }

      // 2. Demandes de contact en attente (non vues par l'éducateur)
      const { data: pendingContacts, error: contactError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          questionnaire_data,
          educator_seen_at,
          family:family_profiles(first_name, last_name)
        `)
        .eq('educator_id', educatorId)
        .eq('status', 'pending')
        .is('educator_seen_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!contactError && pendingContacts) {
        pendingContacts.forEach((contact: any) => {
          const familyName = contact.family ?
            `${contact.family.first_name || ''} ${contact.family.last_name || ''}`.trim() :
            'Une famille';
          const childName = contact.questionnaire_data?.child_name || '';
          notifs.push({
            id: `contact-${contact.id}`,
            type: 'contact_request',
            title: 'Nouvelle demande de contact',
            description: childName
              ? `${familyName} pour ${childName}`
              : `${familyName} souhaite vous contacter`,
            link: '/messagerie',
            time: formatTime(contact.created_at),
            read: false,
          });
        });
      }

      // 3. Nouvelles factures (dernières 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentInvoices, error: invError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          created_at
        `)
        .eq('educator_id', educatorId)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (!invError && recentInvoices) {
        recentInvoices.forEach((inv: any) => {
          notifs.push({
            id: `inv-${inv.id}`,
            type: 'invoice',
            title: 'Nouvelle facture',
            description: `Facture ${inv.invoice_number} - ${inv.amount?.toFixed(2)}€`,
            link: '/dashboard/educator/invoices',
            time: formatTime(inv.created_at),
            read: false,
          });
        });
      }

      // Trier par date
      notifs.sort((a, b) => {
        // Les plus récents en premier (basé sur l'ordre d'ajout)
        return 0;
      });

      // Filtrer les notifications déjà lues
      const unreadNotifs = notifs.filter(n => !readNotifIds.has(n.id));

      setNotifications(unreadNotifs.slice(0, 10));
      setUnreadCount(unreadNotifs.length);
    } catch (error) {
      console.error('Erreur notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = (notifId: string) => {
    const newReadIds = new Set(readNotifIds);
    newReadIds.add(notifId);
    setReadNotifIds(newReadIds);
    localStorage.setItem(`readNotifs_${educatorId}`, JSON.stringify([...newReadIds]));

    // Retirer immédiatement de la liste affichée
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'contact_request':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fde8ec' }}>
            <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
            <svg className="w-4 h-4" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'appointment':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'invoice':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:opacity-80 rounded-full transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-describedby={unreadCount > 0 ? "notification-count" : undefined}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge nombre de notifications */}
        {unreadCount > 0 && (
          <span
            id="notification-count"
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full animate-pulse"
            style={{ backgroundColor: '#f0879f' }}
            aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Région live pour annoncer les changements de notifications */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {unreadCount > 0 && `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}`}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 ${
            position === 'left' ? 'left-0' : 'right-0'
          }`}
          role="region"
          aria-label="Panneau de notifications"
        >
          {/* Header */}
          <div className="px-4 py-3 text-white" style={{ backgroundColor: '#41005c' }}>
            <h3 className="font-semibold" id="notifications-heading">Notifications</h3>
            <p className="text-sm text-white/80">
              {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle'}
            </p>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#41005c' }} aria-hidden="true"></div>
                <span className="sr-only">Chargement des notifications</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f3e8ff' }}>
                  <svg className="w-6 h-6" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Aucune notification</p>
                <p className="text-gray-400 text-xs mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100" role="list" aria-label="Liste des notifications">
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <Link
                      href={notif.link}
                      onClick={() => {
                        markAsRead(notif.id);
                        setIsOpen(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      aria-label={`${notif.title}: ${notif.description}, ${notif.time}`}
                    >
                      {getIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                        <p className="text-sm text-gray-500 truncate">{notif.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: '#41005c' }} aria-label="Non lu"></div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
              <div className="flex gap-2">
                <Link
                  href="/messagerie"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center text-sm font-medium py-2 rounded-xl transition hover:opacity-80"
                  style={{ color: '#41005c' }}
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard/educator/appointments"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center text-sm font-medium py-2 rounded-xl transition hover:opacity-80"
                  style={{ color: '#41005c' }}
                >
                  Rendez-vous
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
