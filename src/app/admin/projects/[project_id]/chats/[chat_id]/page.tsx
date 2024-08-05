"use client";

import Loading from "@/components/ui/loading";
import { ChatMessageType } from "@/types/chat";
import { Project } from "@/types/project";
import { API } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Modal from "@/components/modal";
import { Feedback } from "@/types/test";

export default function Page({
  params,
}: {
  params: { project_id: string; chat_id: string };
}) {
  const { project_id, chat_id } = params;
  const chatQuery = useQuery({
    queryKey: ["chat", project_id, chat_id],
    queryFn: () => API.chat.get(project_id, chat_id),
  });

  const projectQuery = useQuery({
    queryKey: ["project", project_id],
    queryFn: () => API.projects.get(project_id),
  });
  const project: Project = projectQuery.data;
  const chats: any | undefined = chatQuery.data;

  const feedbackQuery = useQuery({
    queryKey: ["project", project_id, "chat", chat_id],
    queryFn: () => API.feedback.list(project_id, chat_id),
  });
  const feedbacks = feedbackQuery.data;
  const feedbacksMap = feedbacks?.data
    .map((feedback: any) => ({ [feedback.chat_message]: feedback }))
    .reduce(
      (acc: string, feedbackObj: any) => Object.assign(acc, feedbackObj),
      {},
    );

  const [showFeedBackModal, setShowFeedBackModal] = useState({
    open: false,
    feedback: {
      external_id: "",
      chat_message: "",
      liked: true,
      message: "",
      created_at: "",
      modified_at: "",
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">{project?.title}</h1>
      {chatQuery.isLoading ? (
        <div className="mt-5 w-full flex justify-center items-center">
          <Loading />
        </div>
      ) : chats ? (
        <div>
          <div className="flex flex-col mt-6 md:flex-row justify-between items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Chat: {chats?.title}</h2>
            <div className="flex justify-center items-center">
              {chats?.username && (
                <Link
                  href={`/admin/users/${chats?.username}`}
                  className="bg-slate-200 flex items-center gap-2 justify-center hover:bg-slate-300 m-2 p-2 rounded-xl px-6"
                >
                  <i className="fa fa-user"></i>
                  {chats?.username}
                </Link>
              )}
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-4 mt-8">
              {chats && chats?.chats?.length > 0 ? (
                chats?.chats.map((chat: any, i: number) => (
                  <div key={i}>
                    {chat.messageType === ChatMessageType.USER ? (
                      <div className="border border-gray-300 hover:bg-secondary bg-primary rounded-lg p-4 flex gap-3 items-center">
                        <div className="flex items-center justify-center w-10 h-10 text-2xl shrink-0 text-center bg-[#ffc688] rounded-full">
                          <Image
                            className="p-1.5"
                            src="/person.svg"
                            alt="User icon"
                            width={100}
                            height={100}
                          />
                        </div>
                        {chat.message}
                      </div>
                    ) : chat.messageType === ChatMessageType.AYUSHMA ? (
                      <div className="border border-gray-300 hover:bg-secondary bg-secondaryActive rounded-lg p-4 flex justify-between gap-3 items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 text-2xl shrink-0 text-center rounded-full">
                            <Image
                              className="p-0.5"
                              src="/logo.svg"
                              alt="Logo"
                              width={100}
                              height={100}
                            />
                          </div>
                          {chat.message}
                        </div>
                        <div>
                          {Object.keys(feedbacksMap[chat.external_id] || {})
                            .length !== 0 && (
                            <div className="flex gap-2">
                              {feedbacksMap[chat.external_id].liked ? (
                                <i className="fas fa-thumbs-up p-1 rounded text-green-900 bg-green-100" />
                              ) : (
                                <i className="fas fa-thumbs-down p-1 rounded text-red-900 bg-red-100" />
                              )}
                              <p
                                onClick={() =>
                                  setShowFeedBackModal({
                                    open: true,
                                    feedback: feedbacksMap[chat.external_id],
                                  })
                                }
                              >
                                <i className="fa fa-eye"></i>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 text-2xl shrink-0 text-center bg-gray-300 rounded-full">
                        <i className="fa-solid fa-circle-exclamation"></i>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex justify-center bg-primary rounded-xl p-3">
                  No Chats Found
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center text-gray-500 text-2xl font-medium mt-6">
          Chat not found
        </div>
      )}
      <Modal
        onClose={() =>
          setShowFeedBackModal({ ...showFeedBackModal, open: false })
        }
        show={showFeedBackModal.open}
        className="w-[500px]"
      >
        <div className="flex flex-col gap-2 p-6">
          <div className="flex items-center gap-3">
            <p className="font-bold text-xl">Feedback</p>
            <div>
              {showFeedBackModal.feedback.liked ? (
                <i className="fas fa-thumbs-up p-1 rounded text-green-900 bg-green-100" />
              ) : (
                <i className="fas fa-thumbs-down p-1 rounded text-red-900 bg-red-100" />
              )}
            </div>
          </div>
          <p>Message: {showFeedBackModal.feedback.message}</p>
        </div>
      </Modal>
    </div>
  );
}
