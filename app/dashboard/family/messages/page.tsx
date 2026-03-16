'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Message } from '@/types';
import { canEducatorCreateConversation } from '@/lib/subscription-utils';
import { moderateMessage, generateWarningMessage } from '@/lib/moderation';
import { useToast } from '@/components/Toast';

export default function FamilyMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && profile) {
      fetchConversations();

      const educatorId = searchParams.get('educator');
      if (educatorId) {
        initializeConversation(educatorId);
      }
    }
  }, [currentUser, profile, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead();

      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(session.user);
      setUserId(session.user.id);

      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!familyProfile) {
        router.push('/auth/login');
        return;
      }

      setProfile(familyProfile);
      setFamilyId(familyProfile.id);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const initializeConversation = async (educatorId: string) => {
    if (!profile) return;

    try {
      let { data: conv, error } = await supabase
        .from('conversations')
        .select('*, educator_profiles(*), family_profiles(*)')
        .eq('educator_id', educatorId)
        .eq('family_id', profile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const conversationCheck = await canEducatorCreateConversation(educatorId);
        if (!conversationCheck.canCreate) {
          showToast(`Cet éducateur a atteint sa limite de conversations actives (${conversationCheck.limit}). Il doit passer Premium pour accepter plus de conversations.`, 'info');
          return;
        }

        const { data: newConv, error: insertError } = await supabase
          .from('conversations')
          .insert({
            educator_id: educatorId,
            family_id: profile.id,
            status: 'pending',
          })
          .select('*, educator_profiles(*), family_profiles(*)')
          .single();

        if (insertError) {
          console.error('Erreur création conversation:', insertError);
          throw insertError;
        }

        conv = newConv;
      } else if (error) {
        console.error('Erreur lors de la recherche de conversation:', error);
        throw error;
      }

      if (conv) {
        setSelectedConversation(conv);
        await fetchConversations();
      }
    } catch (error) {
      console.error('Erreur initializeConversation:', error);
      showToast('Impossible de créer la conversation. Vérifiez la console pour plus de détails.', 'error');
    }
  };

  const fetchConversations = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          educator_profiles(*),
          family_profiles(*)
        `)
        .eq('family_id', profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation || !currentUser) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', selectedConversation.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const isFirstMessage = selectedConversation.status === 'pending' || messages.length === 0;
    const moderationResult = moderateMessage(newMessage.trim(), isFirstMessage);

    if (!moderationResult.isAcceptable) {
      setModerationWarning(generateWarningMessage(moderationResult));
      return;
    }

    setModerationWarning(null);

    if (selectedConversation.status === 'pending') {
      try {
        const { error } = await supabase
          .from('conversations')
          .update({ request_message: newMessage.trim() })
          .eq('id', selectedConversation.id);

        if (error) throw error;

        setNewMessage('');
        setSelectedConversation({ ...selectedConversation, request_message: newMessage.trim() });
        showToast('Votre demande de contact a été envoyée ! L\'éducateur doit l\'accepter avant que vous puissiez échanger des messages.');
        fetchConversations();
      } catch (error) {
        console.error('Erreur:', error);
      }
      return;
    }

    if (selectedConversation.status !== 'accepted') {
      showToast('Cette conversation doit être acceptée avant de pouvoir échanger des messages.', 'info');
      return;
    }

    const receiverId = selectedConversation.educator_profiles.user_id;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      fetchConversations();
      fetchMessages();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getEducator = (conversation: any) => {
    return conversation.educator_profiles;
  };

  // Helper pour obtenir l'icône de profil (basé sur l'ID pour la consistance)
  const getEducatorIcon = (id?: string) => {
    return (id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  const Avatar = ({ participant, size = 'md' }: { participant: any; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16'
    };

    const fullName = `${participant?.first_name || 'Utilisateur'} ${participant?.last_name || ''}`.trim();

    if (participant?.avatar_url) {
      return (
        <img
          src={participant.avatar_url}
          alt={`Photo de profil de ${fullName}`}
          className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}
        style={{ background: 'linear-gradient(135deg, #027e7e 0%, #3a9e9e 100%)' }}
        aria-label={`Avatar de ${fullName}`}
        role="img"
      >
        <img
          src={getEducatorIcon(participant?.id)}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#027e7e' }} role="status" aria-label="Chargement en cours"></div>
          <p className="text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Flèche retour et en-tête avec icône - visible uniquement sur mobile quand on voit la liste */}
        {showConversationList && (
          <div className="lg:hidden py-4 px-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
              aria-label="Retour à la page précédente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Retour</span>
            </button>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#027e7e' }}>
                <img src="/images/icons/5.svg" alt="" className="w-full h-full" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Mes messages</h1>
            </div>
          </div>
        )}

        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 pb-3 sm:pb-4 overflow-hidden">
          <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden">
            {/* Liste des conversations */}
            <div className={`w-full lg:w-1/3 border-r border-gray-100 flex flex-col ${selectedConversation && !showConversationList ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100 hidden lg:block">
                {/* Flèche retour desktop */}
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
                  aria-label="Retour à la page précédente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Retour</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center p-0.5" style={{ backgroundColor: '#027e7e' }}>
                    <img src="/images/icons/5.svg" alt="" className="w-full h-full" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#e6f4f4' }}>
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Aucune conversation</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const educator = getEducator(conv);
                    if (!educator) return null;
                    if (conv.status === 'rejected') return null;
                    const isPending = conv.status === 'pending';
                    const isSelected = selectedConversation?.id === conv.id;

                    return (
                      <div
                        key={conv.id}
                        className={`w-full p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                          isSelected ? '' : 'hover:bg-gray-50'
                        } ${isPending && !isSelected ? 'bg-amber-50' : ''}`}
                        style={isSelected ? { backgroundColor: '#e6f4f4' } : {}}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setShowConversationList(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 relative">
                            <Avatar participant={educator} size="md" />
                            {isPending && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center" aria-label="Demande en attente">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {educator.first_name || 'Utilisateur'} {educator.last_name || ''}
                              </p>
                              {isPending && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                  En attente
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {isPending ? (conv.request_message || 'Demande de contact') : (educator.location || 'Localisation non renseignée')}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-1 h-10 rounded-full" style={{ backgroundColor: '#027e7e' }}></div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Zone de conversation */}
            <div className={`flex-1 flex flex-col ${!selectedConversation || showConversationList ? 'hidden lg:flex' : 'flex'} w-full lg:w-auto`}>
              {!selectedConversation ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e6f4f4' }}>
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm">Sélectionnez une conversation</p>
                </div>
              ) : (
                <>
                  {/* En-tête de la conversation */}
                  <div className="p-4 border-b border-gray-100">
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="lg:hidden mb-3 flex items-center font-medium"
                      style={{ color: '#027e7e' }}
                      aria-label="Retour à la liste des conversations"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Retour aux conversations
                    </button>
                    {(() => {
                      const educator = getEducator(selectedConversation);
                      const profileUrl = `/educator/${educator?.id}`;
                      const appointmentUrl = `/educator/${educator?.id}/book-appointment`;

                      return (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar participant={educator} size="lg" />
                            <div>
                              <Link href={profileUrl}>
                                <h3 className="text-lg font-semibold text-gray-900 hover:opacity-80 cursor-pointer transition-colors" style={{ color: '#027e7e' }}>
                                  {educator?.first_name || 'Utilisateur'}{' '}
                                  {educator?.last_name || ''}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-500">
                                {educator?.location || 'Localisation non renseignée'}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={appointmentUrl}
                            className="inline-flex items-center px-3 py-2 sm:px-4 text-white rounded-xl hover:opacity-90 font-medium transition-colors text-xs sm:text-sm"
                            style={{ backgroundColor: '#f0879f' }}
                            aria-label="Demander un rendez-vous"
                          >
                            <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden sm:inline">Demander un rendez-vous</span>
                            <span className="sm:hidden">RDV</span>
                          </Link>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Messages ou zone de demande en attente */}
                  {selectedConversation.status === 'pending' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
                        <div className="text-center max-w-lg mx-auto pb-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4" aria-hidden="true">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                            {(selectedConversation.request_message || selectedConversation.questionnaire_data) ? 'Demande envoyée' : 'Envoyez votre demande'}
                          </h3>
                          {selectedConversation.request_message || selectedConversation.questionnaire_data ? (
                            <>
                              <p className="text-sm sm:text-base text-gray-600 mb-4">
                                Votre demande de contact est en attente de validation par l'éducateur.
                              </p>
                              {selectedConversation.questionnaire_data && (
                                <div className="rounded-xl p-3 sm:p-4 mb-4 text-left" style={{ backgroundColor: '#e6f4f4', border: '1px solid #c9eaea' }}>
                                  <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#027e7e' }}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Votre demande envoyée
                                  </p>
                                  <div className="space-y-2 text-xs sm:text-sm">
                                    {selectedConversation.questionnaire_data.child_name && (
                                      <p className="break-words"><span className="text-gray-500">Pour :</span> <span className="font-medium">{selectedConversation.questionnaire_data.child_name}</span></p>
                                    )}
                                    {selectedConversation.questionnaire_data.needs?.accompaniment_types?.length > 0 && (
                                      <p className="break-words"><span className="text-gray-500">Accompagnement :</span> <span className="font-medium">{selectedConversation.questionnaire_data.needs.accompaniment_types.map((t: string) => t.replace('_', ' ')).join(', ')}</span></p>
                                    )}
                                    {selectedConversation.questionnaire_data.modalities?.location && (
                                      <p><span className="text-gray-500">Lieu :</span> <span className="font-medium">
                                        {selectedConversation.questionnaire_data.modalities.location === 'domicile' ? 'À domicile' :
                                         selectedConversation.questionnaire_data.modalities.location === 'cabinet' ? 'En cabinet' :
                                         selectedConversation.questionnaire_data.modalities.location === 'ecole' ? 'À l\'école' : 'Peu importe'}
                                      </span></p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {selectedConversation.request_message && (
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-left">
                                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Votre message :</p>
                                  <p className="text-gray-800 italic text-sm sm:text-base break-words">"{selectedConversation.request_message}"</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm sm:text-base text-gray-600">
                              Présentez-vous à l'éducateur pour qu'il puisse accepter votre demande de contact.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Formulaire d'envoi pour les demandes en attente */}
                      {!selectedConversation.request_message && !selectedConversation.questionnaire_data && (
                        <div className="p-3 sm:p-4 border-t border-gray-100">
                          <form onSubmit={sendMessage} className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Présentez-vous..."
                              className="flex-1 border border-gray-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 text-sm sm:text-base"
                              style={{ '--tw-ring-color': '#027e7e' } as any}
                            />
                            <button
                              type="submit"
                              className="px-4 sm:px-6 py-2.5 text-white rounded-xl hover:opacity-90 focus:outline-none font-medium text-sm sm:text-base w-full sm:w-auto transition"
                              style={{ backgroundColor: '#027e7e' }}
                            >
                              Envoyer
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Messages normaux pour les conversations acceptées */}
                      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" aria-live="polite" aria-atomic="false">
                        {messages.map((message) => {
                          const isSender = message.sender_id === currentUser?.id;
                          const educator = getEducator(selectedConversation);
                          return (
                            <div
                              key={message.id}
                              className={`flex items-end gap-1.5 sm:gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isSender && <Avatar participant={educator} size="sm" />}

                              <div
                                className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                                  isSender
                                    ? 'text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                                style={isSender ? { backgroundColor: '#027e7e' } : {}}
                              >
                                <p className="text-sm sm:text-base break-words">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isSender ? 'text-white/70' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Formulaire d'envoi */}
                      <div className="p-3 sm:p-4 border-t border-gray-100">
                        {moderationWarning && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2" role="alert" aria-live="assertive">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm text-red-700">{moderationWarning}</p>
                              <button
                                onClick={() => setModerationWarning(null)}
                                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                                aria-label="Fermer l'avertissement"
                              >
                                Fermer
                              </button>
                            </div>
                          </div>
                        )}
                        <form onSubmit={sendMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              if (moderationWarning) setModerationWarning(null);
                            }}
                            placeholder="Message..."
                            className={`flex-1 border rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 text-sm sm:text-base min-w-0 ${
                              moderationWarning ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                            style={{ '--tw-ring-color': '#027e7e' } as any}
                          />
                          <button
                            type="submit"
                            className="px-3 sm:px-6 py-2.5 text-white rounded-xl hover:opacity-90 focus:outline-none flex-shrink-0 text-sm sm:text-base transition"
                            style={{ backgroundColor: '#027e7e' }}
                            aria-label="Envoyer le message"
                          >
                            <span className="hidden sm:inline">Envoyer</span>
                            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer teal */}
      <div className="flex-shrink-0" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
