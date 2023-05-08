"use client";

import ChatBar from "@/components/chatbar";
import ChatBlock from "@/components/chatblock";
import { storageAtom } from "@/store";
import { Chat, ChatConverseStream, ChatMessageType } from "@/types/chat";
import { API } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

export default function Chat(params: { params: { project_id: string, chat_id: string } }) {

    const { project_id, chat_id } = params.params;
    const [newChat, setNewChat] = useState("");
    const [chatMessage, setChatMessage] = useState<string>("");
    const [storage] = useAtom(storageAtom);

    const chatQuery = useQuery(["chat", chat_id], () => API.chat.get(project_id, chat_id));
    const chat: Chat | undefined = chatQuery.data;

    const openai_key = !storage?.user?.allow_key || storage?.override_api_key ? storage?.openai_api_key : undefined

    const streamChatMessage = async (message: ChatConverseStream) => {
        if(newChat === "") setNewChat(message.input);
        setChatMessage(prevChatMessage => {
            const updatedChatMessage = prevChatMessage + message.delta;
            return updatedChatMessage;
        });
    };

    const converseMutation = useMutation(() => API.chat.converse(project_id, chat_id, newChat, openai_key, streamChatMessage), {
        onSuccess: async () => {
            await chatQuery.refetch();
            setNewChat("");
            setChatMessage("");
        }
    });

    const audioConverseMutation = useMutation((params: { formdata: FormData }) => API.chat.audio_converse(project_id, chat_id, params.formdata, openai_key, streamChatMessage), {
        onSuccess: async () => {
            await chatQuery.refetch();
            setNewChat("");
            setChatMessage("");
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        converseMutation.mutate();
    }

    const handleAudio = async (blobUrl: string) => {
        const fd = new FormData();
        //create a file object from blob url
        await fetch(blobUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "audio.wav", { type: "audio/wav" });
                fd.append("audio", file);
            })
        audioConverseMutation.mutate({ formdata: fd });
    }

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, [chatMessage]);

    return (
        <div className="h-screen flex flex-col flex-1">
            <div className="flex-1 overflow-auto" ref={messagesContainerRef}>
                {chat?.chats?.map((message, i) => (
                    <ChatBlock message={message} key={i} />
                ))}
                {chatMessage && (<>
                    <ChatBlock message={{ messageType: ChatMessageType.USER, message: newChat, created_at: "", external_id: "", modified_at: "" }} />
                    <ChatBlock message={{ messageType: ChatMessageType.AYUSHMA, message: chatMessage, created_at: "", external_id: "", modified_at: "" }} />
                </>)}
            </div>
            <div className="w-full shrink-0 p-4">
                <ChatBar
                    chat={newChat || ""}
                    onChange={(e) => setNewChat(e.target.value)}
                    onSubmit={handleSubmit}
                    onAudio={handleAudio}
                    errors={[
                        (converseMutation.error as any)?.error?.error,
                        (audioConverseMutation.error as any)?.error?.error
                    ]}
                    loading={converseMutation.isLoading || audioConverseMutation.isLoading}
                />
            </div>
        </div>
    )
}