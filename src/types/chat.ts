import { Timestamp } from "firebase/firestore";

export type UserProfilePhotoDocument = {
  base64?: string;
  mimeType?: string;
  width?: number;
  height?: number;
} | null;

export type UserProfileChatDocument = {
  name?: string;
  username?: string;
  email?: string;
  profilePhoto?: UserProfilePhotoDocument;
};

export type ChatConversationDocument = {
  animalId?: string;
  proprietarioId?: string;
  interessadoUserId?: string;
  interessasdoUserId?: string;
  proprietarioUserName?: string;
  ownerUserName?: string;
  proprietarioName?: string;
  ownerName?: string;
  interessadoUserName?: string;
  interestedUserName?: string;
  interessadoName?: string;
  interestedName?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp | null;
  lastMessageSenderId?: string;
  ownerLastReadAt?: Timestamp | null;
  interestedLastReadAt?: Timestamp | null;
  visibleToInterested?: boolean;
  adoptionRequestActive?: boolean;
  finalizedAt?: Timestamp | null;
  finalizedBy?: string;
};

export type ChatMessageDocument = {
  senderId?: string;
  text?: string;
  createdAt?: Timestamp | null;
};

export type ConversaChat = {
  id: string;
  animalId: string;
  proprietarioId: string;
  interessadoUserId: string;
  otherUserId: string;
  otherUserName: string;
  petName: string;
  lastMessage: string;
  lastMessageTime: string;
  avatarUrl?: string;
  unreadCount?: number;
  hasUnread?: boolean;
  isProcessActive?: boolean;
};
