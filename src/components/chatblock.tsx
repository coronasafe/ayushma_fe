import { useEffect, useState } from "react";
import { ChatMessage, ChatMessageType } from "@/types/chat";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import rehypeRaw from 'rehype-raw'

type AudioStatus = "unloaded" | "loading" | "playing" | "paused" | "stopped";

export default function ChatBlock(props: { message?: ChatMessage, loading?: boolean, autoplay?: boolean, cursor?: boolean }) {

    const { message, loading, cursor, autoplay } = props;
    const cursorText = cursor ? (message?.original_message?.length || 0) % 2 === 0 ? "|" : "" : "";
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [audioStatus, setAudioStatus] = useState<AudioStatus>("unloaded");
    const [percentagePlayed, setPercentagePlayed] = useState(0);


    const isCompleteLetter = (str: string) => {
        const regex = /^\p{L}$/u;
        return regex.test(str);
    }

    const chatMessage = (message?.message != message?.original_message ? message?.message : message?.original_message) + cursorText;

    const getMessageSegments = (): { highlightText: string; blackText: string } => {
        const messageLength = chatMessage.length || 0;
        const highlightLength = percentagePlayed === 100 ? 0 : Math.floor((percentagePlayed / 100) * messageLength);

        let highlightText = chatMessage.slice(0, highlightLength) || '';
        let blackText = chatMessage.slice(highlightLength) || '';

        while (highlightText && blackText && percentagePlayed < 100 && highlightText.length > 0 && !isCompleteLetter(highlightText.slice(-1))) {
            highlightText += blackText[0];
            blackText = blackText.slice(1);
        }

        return { highlightText, blackText };
    }

    const { highlightText, blackText } = getMessageSegments();


    useEffect(() => {
        if (audio) {
            const interval = setInterval(() => {
                setPercentagePlayed((audio.currentTime / audio.duration) * 100);
            }, 10);
            return () => clearInterval(interval);
        }
    }, [audio]);



    const loadAudio = async () => {
        if (message?.messageType === ChatMessageType.AYUSHMA) {
            setAudioStatus("loading");
            const audio = new Audio(message?.ayushma_audio_url);
            setAudio(audio);
            setAudioStatus("playing");
            audio.play();
            audio.addEventListener("ended", () => {
                setAudioStatus("stopped");
            });
        }
    }

    const togglePlay = () => {
        if (audioStatus === "loading") return;
        if (audioStatus === "unloaded") loadAudio();
        if (audioStatus === "playing") { audio?.pause(); setAudioStatus("paused"); }
        else { audio?.play(); setAudioStatus("playing"); }
    }

    const stopAudio = () => {
        if (!audio) return;
        if (audioStatus === "loading" || audioStatus === "unloaded") return;
        if (audioStatus === "playing" || audioStatus === "paused") {
            audio?.pause();
            audio.currentTime = 0;
            setAudioStatus("stopped");
        }
    }

    useEffect(() => {
        if (autoplay) togglePlay();
    }, []);

    return (
        <div className={`flex flex-col gap-4 p-6 ${message?.messageType === ChatMessageType.USER ? "bg-black/5" : ""}`}>
            <div className="flex gap-6">
                <div>
                    <div className="w-8 text-2xl shrink-0 text-center">
                        {message?.messageType === ChatMessageType.USER && !loading ? "👤" : <>
                            <Image src="/ayushma.svg" alt="Logo" width={100} height={100} />
                        </>}
                    </div>
                </div>
                <div className="w-full">
                    {loading ? "Loading..." :
                        (
                            <div className="flex flex-col justify-center">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} className="markdown-render">
                                    {
                                        (audioStatus === "unloaded" ?
                                            ((message?.message || message?.original_message) + cursorText || "") :
                                            `<span className="text-green-600">${highlightText}</span><span>${blackText}</span>`
                                        ) + (message?.message != message?.original_message ? `<hr className="border-gray-300 my-4"></hr>${message?.original_message || ""}` : "")
                                    }
                                </ReactMarkdown>
                                {message?.messageType === ChatMessageType.AYUSHMA && message?.ayushma_audio_url && (
                                    <div className="flex gap-1 justify-left">
                                        <button onClick={togglePlay} className="text-gray-500 hover:text-gray-700">
                                            {audioStatus === "playing" ? (
                                                <i className="fa-regular fa-circle-pause text-gray-700"></i>
                                            ) : (
                                                <i className="fa-regular fa-circle-play text-black"></i>
                                            )}
                                        </button>
                                        {(audioStatus === "paused" || audioStatus === "playing") && <button onClick={stopAudio} className="text-gray-500 hover:text-gray-700">
                                            <i className="fa-regular fa-circle-stop text-red-400"></i>
                                        </button>}
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div>
            </div>
            {message?.reference_documents && message?.reference_documents.length > 0 && (
                <div className="flex gap-2 pl-14 items-center pb-4">
                    <p className="mr-1 text-sm italic">References:</p>
                    {message?.reference_documents.map((doc, i) => {
                        if (doc.document_type === 1 || doc.document_type === 2)
                            return (
                                <a
                                    key={i}
                                    href={doc.document_type === 1 ? doc.s3_url : doc.text_content}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md hover:bg-gray-300"
                                >
                                    {doc.title}
                                </a>
                            );
                        else if (doc.document_type === 3)
                            return (
                                <div className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md hover:bg-gray-300">
                                    {doc.title}
                                </div>
                            );
                        else return null;
                    })}
                </div>
            )}
        </div>
    );
}