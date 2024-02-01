"use client";

import { Chat } from "@/types/chat";
import { API } from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { CheckBox, Input } from "../ui/interactive";
import { useState, useEffect } from "react";
import { storageAtom } from "@/store";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import Modal from "../modal";
import Slider from "../ui/slider";
import InfiniteScroll from "react-infinite-scroller";
import { useInfiQuery } from "@/utils/hooks/useInfiQuery";
import { useDebounce } from "@/utils/hooks/useDebounce";
import useIsIOS from "@/utils/hooks/useIsIOS";

export default function ChatSideBar(props: { project_id?: string }) {
  const isIOS = useIsIOS();
  const { project_id } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const chatsQuery = useInfiQuery({
    queryKey: ["search", debouncedSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await API.chat.list(
        project_id || "",
        {
          offset: pageParam,
          search: debouncedSearchQuery
        },
      );
      return { ...res, offset: pageParam };
    },
    enabled: !!project_id,
  },
  );

  const nonChatRoutes = ["/profile"];

  const [storage, setStorage] = useAtom(storageAtom);
  const router = useRouter();
  const path = usePathname();
  const [settingsModal, setSettingsModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    external_id: "",
  });

  const onSettingsClose = () => {
    setSettingsModal(false);
  };

  const onDeleteClose = () => {
    setDeleteModal({ ...deleteModal, open: false });
  };

  const buttons = [
    {
      icon: "user-circle",
      text: "Profile",
      onclick: () => {
        router.push("/profile");
      },
    },
    {
      icon: "cog",
      text: "Settings",
      onclick: () => {
        setSettingsModal(true);
      },
    },
    ...(storage?.user?.is_staff
      ? [
        {
          icon: "user-shield",
          text: "Admin",
          onclick: () => {
            router.push("/admin");
          },
        },
      ]
      : []),
    {
      icon: "sign-out-alt",
      text: "Logout",
      onclick: () =>
        setStorage({ ...storage, user: undefined, auth_token: undefined }),
    },
  ];

  const deleteChatMutation = useMutation(
    {
      mutationFn: (external_id: string) => API.chat.delete(project_id || "", external_id),
      onSuccess: async (data, external_id) => {
        chatsQuery.refetch();
        if (path === `/project/${project_id}/chat/${external_id}`)
          router.push(`/project/${project_id}`);
      },
    },
  );

  const deleteChat = (external_id: string) => {
    deleteChatMutation.mutate(external_id);
  };

  return (
    <>
      <div className="bg-white bg-cover bg-top w-64 shrink-0 flex flex-col h-screen justify-between">
        <div className="flex flex-col flex-1 overflow-auto">
          <div className="flex flex-col p-3">
            <Link
              href={project_id ? `/project/${project_id}` : "/"}
              className="cursor-pointer p-4"
            >
              <div className="flex flex-col items-end justify-center">
                <img
                  src={process.env.NEXT_PUBLIC_LOGO_URL ?? "/logo_text.svg"}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
            <Link
              href={project_id ? `/project/${project_id}` : "/"}
              className="bg-gray-100 py-1 px-4 rounded-lg border border-gray-200 hover:bg-gray-200 transition-all text-center mb-2"
            >
              <i className="fad fa-pen-to-square" />
              &nbsp; New Chat
            </Link>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="border-gray-200 py-1 px-4 rounded-lg border-2 hover:bg-gray-100 transition-all"
            />
          </div>
          {!nonChatRoutes.includes(path || "") && (

            <div id="scrollableDiv" className="overflow-y-auto px-2 hover-scrollbar">
              <InfiniteScroll
                loadMore={() => {
                  chatsQuery.fetchNextPage();
                }}
                hasMore={chatsQuery.hasNextPage ? true : false}
                useWindow={false}
                threshold={10}
                loader={
                  <div
                    className={`${chatsQuery.isFetching ? "" : "hidden"
                      } flex justify-center items-center mt-2 h-full`}
                  >
                    <div
                      className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    >
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                      </span>
                    </div>
                  </div>
                }
              >
                <div className="flex flex-col">
                  {project_id && (
                    chatsQuery.fullData?.map((chat: Chat, j: number) => (
                      <div
                        key={j}
                        className="w-full group hover:bg-gray-100 hover:border-gray-200 rounded-lg overflow-hidden flex justify-between transition-all"
                      >
                        <Link
                          href={`/project/${project_id}/chat/${chat.external_id}`}
                          className="w-full p-2 text-left truncate text-sm"
                          title={chat.title}
                        >
                          {chat.title}
                        </Link>
                        <button
                          className="py-2 px-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              external_id: chat.external_id,
                            })
                          }
                        >
                          <i className="fad fa-trash-alt" />
                        </button>
                      </div>
                    )))}
                </div>
              </InfiniteScroll>
            </div>
          )}
        </div>
        <div className="p-2 flex justify-around">
          <div className="flex flex-1 gap-2">
            {buttons.map((button, i) => (
              <button
                key={i}
                onClick={button.onclick}
                className="flex-1 py-2 px-4 border flex flex-col rounded-lg items-center text-lg justify-center transition-all hover:bg-gray-200 border-gray-200 bg-gray-100 text-gray-500"
              >
                <i className={`fad fa-${button.icon}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <Modal
        onClose={onDeleteClose}
        show={deleteModal.open}
        className="w-[500px]"
      >
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this chat</p>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <button
              className="bg-gray-300 hover:bg-gray-400 px-4 p-2 rounded-lg"
              onClick={onDeleteClose}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 px-4 text-white p-2 rounded-lg"
              onClick={() => {
                deleteChat(deleteModal.external_id);
                onDeleteClose();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        onClose={onSettingsClose}
        show={settingsModal}
        className="w-full md:w-[800px] h-full md:h-[500px]"
      >
        <div>
          Your OpenAI API key
          <Input
            type="text"
            placeholder="OpenAI key"
            value={storage?.openai_api_key}
            onChange={(e) =>
              setStorage({
                ...storage,
                openai_api_key: e.target.value,
              })
            }
          />
          <br />
          <br />
          {storage?.user?.allow_key && (
            <div>
              <CheckBox
                label="Override key"
                type="checkbox"
                checked={storage?.override_api_key}
                onChange={(e) =>
                  setStorage({
                    ...storage,
                    override_api_key: e.target.checked,
                  })
                }
              />
              {storage?.override_api_key && (
                <p className="text-gray-700 text-xs">
                  Your key will be used instead of Ayushma&apos;s Key
                </p>
              )}
            </div>
          )}
          <br />
          <CheckBox
            label="Show stats for nerds"
            type="checkbox"
            checked={storage?.show_stats}
            onChange={(e) =>
              setStorage({
                ...storage,
                show_stats: e.target.checked,
              })
            }
          />
          <br />
          <CheckBox
            disabled={isIOS}
            label="Autoplay responses text to speech"
            type="checkbox"
            checked={isIOS ? false : storage?.tts_autoplay}
            onChange={(e) =>
              setStorage({
                ...storage,
                tts_autoplay: e.target.checked,
              })
            }
          />
          <br />
          <CheckBox
            label="Show Original English Responses"
            type="checkbox"
            checked={storage?.show_english}
            onChange={(e) =>
              setStorage({
                ...storage,
                show_english: e.target.checked,
              })
            }
          />
          <br />
          <br />
          Chat Temperature
          <br />
          <Slider
            left="More Factual"
            right="More Creative"
            value={storage?.temperature || 0.1}
            step={0.1}
            max={1}
            onChange={(val) =>
              setStorage({
                ...storage,
                temperature: val,
              })
            }
          />
          <br />
          <br />
          References
          <br />
          <Slider
            left="Short and Crisp"
            right="Long and Detailed"
            value={storage?.top_k || 100}
            step={1}
            max={100}
            onChange={(val) =>
              setStorage({
                ...storage,
                top_k: val,
              })
            }
          />
        </div>
      </Modal>
    </>
  );
}
