export type BaseModelType = {
    external_id: string,
    created_at: string,
    modified_at: string
}

export type Chat = BaseModelType & {
    title: string,
    namespace: string,
    chats?: ChatMessage[]
}

export enum ChatMessageType {
    USER = 1,
    SYSTEM = 2,
    AYUSHMA = 3
}

export type Document = BaseModelType & {
    title: string,
    description?: string,
    document_type: number,
    text_content?: string,
    file?: string,
}

export type ChatFeedback = {
  chat_message: number;
  liked: boolean;
  message: string;
} | null;

export type ChatMessage = BaseModelType & {
  id: number;
  messageType: ChatMessageType;
  message: string;
  translated_message?: string;
  reference_documents?: Document[];
  audio?: string;
  language: string;
  original_message: string;
  meta?: ChatMessageMeta;
  top_k?: number;
  temperature?: number;
  feedback: ChatFeedback;
};

export type ChatConverseStream = {
    chat: string,
    input: string,
    delta: string,
    message: string,
    stop: boolean,
    ayushma_voice?: string
}

export type ChatMessageMeta = {
    reference_start?: number,
    reference_end?: number,
    response_start?: number,
    response_end?: number,
    translate_start?: number,
    translate_end?: number,
    tts_start?: number,
    tts_end?: number,
    upload_start?: number,
    upload_end?: number,
}