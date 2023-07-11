"use client";

import ChatBar from "@/components/chatbar";
import ChatBlock from "@/components/chatblock";
import { storageAtom } from "@/store";
import { Chat, ChatConverseStream, ChatMessageType } from "@/types/chat";
import { Project } from "@/types/project";
import { API } from "@/utils/api";
import { getFormData } from "@/utils/converse";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Chat(params: { params: { project_id: string, chat_id: string } }) {

    const { project_id, chat_id } = params.params;
    const projectQuery = useQuery(["project", project_id], () => API.projects.get(project_id));
    const project: Project | undefined = projectQuery.data || undefined;
    const searchParams = useSearchParams();
    const shouldAutoPlay = searchParams?.get("autoplay") !== null;
    const [newChat, setNewChat] = useState("");
    const [chatMessage, setChatMessage] = useState<string>("");
    const [storage] = useAtom(storageAtom);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const chatQuery = useQuery(["chat", chat_id], () => API.chat.get(project_id, chat_id), {
        refetchOnWindowFocus: false,
    });
    const chat: Chat | undefined = chatQuery.data;

    const openai_key = !storage?.user?.allow_key || storage?.override_api_key ? storage?.openai_api_key : undefined

    useEffect(() => {
        const uri = window.location.toString();
        if (uri.indexOf("?") > 0) window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf("?")));
    }, [])

    const streamChatMessage = async (message: ChatConverseStream) => {
        if (newChat === "") setNewChat(message.input);
        setChatMessage(prevChatMessage => {
            const updatedChatMessage = prevChatMessage + message.delta;
            return updatedChatMessage;
        });
        if (message.stop) {
            await chatQuery.refetch();
            setNewChat("");
            setIsTyping(false);
            setChatMessage("");
        }
    };

    const converseMutation = useMutation((params: { formdata: FormData }) => API.chat.converse(project_id, chat_id, params.formdata, openai_key, streamChatMessage, 20), {
        retry: false,
        // onSuccess: async (data, vars) => {
        //     await chatQuery.refetch();
        // }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setIsTyping(true);
        e.preventDefault();
        const fd = await getFormData(storage, undefined, newChat);
        converseMutation.mutate({ formdata: fd });
    }

    const handleAudio = async (blobUrl: string) => {
        setIsTyping(true);
        const fd = await getFormData(storage, blobUrl);
        converseMutation.mutate({ formdata: fd });
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
                    <ChatBlock message={message} key={message.external_id} autoplay={(!!chatMessage || shouldAutoPlay) && (i === (chat?.chats?.length || 0) - 1)} />
                ))}

               {chatMessage && (
                    <>
                        <ChatBlock message={{ messageType: ChatMessageType.USER, message: newChat, original_message: newChat, language: storage.language || "en", created_at: "", external_id: "", modified_at: "" }} />
                        <ChatBlock cursor={true} message={{ messageType: ChatMessageType.AYUSHMA, message: chatMessage, original_message: chatMessage, language: storage.language || "en", created_at: "", external_id: "", modified_at: "" }} />
                    </>
                )
                }
            </div >
            <div className="w-full shrink-0 p-4">
                <ChatBar
                    disabled={project?.archived}
                    chat={newChat || ""}
                    onChange={(e) => setNewChat(e.target.value)}
                    onSubmit={handleSubmit}
                    onAudio={handleAudio}
                    errors={[
                        (converseMutation.error as any)?.error?.error,
                    ]}
                    loading={converseMutation.isLoading || isTyping}
                />
            </div>
        </div >
    )
}