export type BaseModelType = {
    external_id: string,
    created_at: string,
    modified_at: string
}

export type Chat = BaseModelType & {
    title: string,
    language: string,
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

export type ChatMessage = BaseModelType & {
    messageType: ChatMessageType,
    message: string,
    reference_documents?: Document[],
    ayushma_audio_url?: string,
}

export type ChatConverseStream = {
    chat: string,
    input: string,
    delta: string,
    message: string,
    stop: boolean,
    ayushma_voice?: string
}