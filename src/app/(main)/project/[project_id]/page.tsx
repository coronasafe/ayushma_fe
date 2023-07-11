"use client";
import ChatBar from "@/components/chatbar";
import ChatBlock from "@/components/chatblock";
import { storageAtom } from "@/store";
import { ChatConverseStream, ChatMessageType } from "@/types/chat";
import { Project } from "@/types/project";
import { API } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Chat(params: { params: { project_id: string } }) {

    const { project_id } = params.params;
    const projectQuery = useQuery(["project", project_id], () => API.projects.get(project_id));
    const project: Project | undefined = projectQuery.data || undefined;
    const [chat, setChat] = useState("");
    const router = useRouter();
    const [storage] = useAtom(storageAtom);
    const queryClient = useQueryClient();
    const [chatMessage, setChatMessage] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [chatID, setChatID] = useState<string>("");

    const openai_key = !storage?.user?.allow_key || storage?.override_api_key ? storage?.openai_api_key : undefined

    useEffect(() => {
        if (!isTyping && chatID) router.push(`/project/${project_id}/chat/${chatID}?autoplay`);
    }, [chatID, isTyping, project_id, router]);

    const streamChatMessage = async (message: ChatConverseStream) => {
        if (chat === "") setChat(message.input);
        setChatMessage(prevChatMessage => {
            const updatedChatMessage = prevChatMessage + message.delta;
            return updatedChatMessage;
        });
        if (message.stop) setIsTyping(false);
    };

    const newChatMutation = useMutation((params: { formdata: FormData }) => API.chat.create(project_id, chat !== "" ? chat.slice(0, 50) : "new chat", storage.openai_api_key), {
        retry: false,
        onSuccess: async (data, vars) => {
            await converseMutation.mutateAsync({ external_id: data.external_id, formdata: vars.formdata });
            setChatID(data.external_id);
        }
    })

    const converseMutation = useMutation((params: { external_id: string, formdata: FormData }) => API.chat.converse(project_id, params.external_id, params.formdata, openai_key, streamChatMessage, 20), {
        retry: false,
        onSuccess: async (data, vars) => {
            await queryClient.invalidateQueries(["chats"]);
        }
    });

    const getFormData = async (blobUrl?: string, text?: string) => {
        const fd = new FormData();
        if (blobUrl) {
            const f = await fetch(blobUrl);
            const blob = await f.blob();
            const file = new File([blob], "audio.wav", { type: "audio/wav" });
            fd.append("audio", file);
        } else if (text) {
            fd.append("text", text);
        }
        fd.append("language", storage.language || "en");
        fd.append("temperature", (storage.temperature || 0.1).toString());
        fd.append("top_k", (storage.top_k || 100).toString());
        return fd;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setIsTyping(true);
        e.preventDefault();
        const fd = await getFormData(undefined, chat);
        newChatMutation.mutate({ formdata: fd });
    }

    const handleAudio = async (blobUrl: string) => {
        setIsTyping(true);
        const fd = await getFormData(blobUrl);
        newChatMutation.mutate({ formdata: fd });
    }

    const samplePrompts = [
        "How does one prepare for advanced airway management, even before the patient has arrived?",
        "How do you assess a ICU patient's need for tracheal intubation?",
        "What are the checks one needs to perform before intubation?",
        "How do you do the initial assessment of the patient before oxygenation or ventilation?",
    ]

    return (
        <div className="flex flex-col h-screen flex-1">
            <div className="flex-1 items-center justify-center w-full overflow-auto">
                {!chatMessage ? (<div className="text-center text-gray-500 w-full">
                    <h1 className="font-black text-4xl text-gray-600 mt-8">
                        Ayushma
                    </h1>
                    <p>
                        Your personal AI medical assistant
                    </p>

                    <h2 className="font-semibold mt-8">
                        Try asking me -
                    </h2>
                    <div className="inline-flex mt-4 flex-wrap justify-center gap-4 w-1/2">
                        {samplePrompts.map((prompt, i) => (
                            <button
                                onClick={async () => {
                                    setChat(prompt)
                                    setIsTyping(true);
                                    const fd = await getFormData(undefined, prompt);
                                    newChatMutation.mutate({ formdata: fd });
                                }}
                                className="bg-white border border-gray-200 rounded-xl p-4 w-64"
                                key={i}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>) : (
                    <>
                        <ChatBlock message={{ messageType: ChatMessageType.USER, message: chat, original_message: chat, language: storage.language || "en", created_at: "", external_id: "", modified_at: "" }} />
                        <ChatBlock cursor={true} message={{ messageType: ChatMessageType.AYUSHMA, message: chatMessage, original_message: chatMessage, language: storage.language || "en", created_at: "", external_id: "", modified_at: "" }} />
                    </>)}
            </div>
            <div className="w-full shrink-0 p-4">
                <ChatBar
                    disabled={project?.archived}
                    chat={chat}
                    onChange={(e) => setChat(e.target.value)}
                    onSubmit={handleSubmit}
                    onAudio={handleAudio}
                    errors={[(newChatMutation.error as any)?.error?.error]}
                    loading={newChatMutation.isLoading || converseMutation.isLoading || isTyping}
                />
            </div>
        </div>
    )
}