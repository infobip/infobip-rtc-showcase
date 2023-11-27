export interface Message {
  type: MessageType;
  date: Date;
  text: string;
  messageId?: string;
  to?: string;
  status?: string;
  from?: string;
  isDirect?: boolean;
}

export type MessageType =
  'received_message' | 'sent_message' | 'received_broadcast'
