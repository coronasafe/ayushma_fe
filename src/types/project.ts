import { BaseModelType } from "./chat";

export type Project = BaseModelType & {
    title: string,
    description: string,
    is_default: boolean,
    prompt?: string,
    stt_engine: number,
    model: number,
    archived: boolean,
}

export enum DocumentType {
    FILE = 1,
    URL = 2,
    TEXT = 3
}

export const STT_ENGINES = [
    { id: 1, label: 'OpenAI Whisper' },
    { id: 2, label: 'Google Speech to Text' },
]

export const MODELS = [
    { id: 1, label: 'GPT-3.5' },
    { id: 2, label: 'GPT-3.5-16k' },
    { id: 3, label: 'GPT-4' },
    { id: 4, label: 'GPT-4-32k' },
]

export type Document = BaseModelType & {
    title: string,
    description: string,
    file: File,
    text_content: string,
    document_type: DocumentType,
}