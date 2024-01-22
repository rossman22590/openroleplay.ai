"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../convex/_generated/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import { Id } from "../convex/_generated/dataModel";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  BookMarked,
  CircleUserRound,
  ClipboardIcon,
  Delete,
  Headphones,
  Languages,
  MoreHorizontal,
  Pause,
  Plus,
  Repeat,
  Send,
  Share,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useInView } from "framer-motion";
import { Button, Tooltip } from "@repo/ui/src/components";
import { CodeBlock } from "@repo/ui/src/components/codeblock";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/src/components/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/src/components/alert-dialog";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/src/components/popover";
import { useRouter } from "next/navigation";
import { MemoizedReactMarkdown } from "./markdown";
import ModelBadge from "../components/characters/model-badge";
import { Crystal } from "@repo/ui/src/components/icons";
import Spinner from "@repo/ui/src/components/spinner";
import useMyUsername from "./lib/hooks/use-my-username";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@repo/ui/src/components/badge";
import { useLanguage } from "./lang-select";

export const FormattedMessage = ({
  message,
  username,
}: {
  message: any;
  username?: string;
}) => {
  const { t } = useTranslation();
  const baseText = message?.text?.startsWith("Not enough crystals.")
    ? `${message?.text} [${t("Crystal Top-up")}](/crystals)`
    : message?.text;
  const translationText = message?.translation
    ? `\n${message?.translation}`
    : "";
  const textContent = translationText ? translationText : baseText;
  return (
    <MemoizedReactMarkdown
      className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words "
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        a({ children, href, target, rel }) {
          return (
            <a href={href} rel={rel} target={target} className="underline">
              {children}
            </a>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return (
            <CodeBlock
              key={Math.random()}
              language={(match && match[1]) || ""}
              value={String(children).replace(/\n$/, "")}
              {...props}
            />
          );
        },
      }}
    >
      {textContent?.replace("{{user}}", username)}
    </MemoizedReactMarkdown>
  );
};

export const Message = ({
  name,
  message,
  cardImageUrl,
  username = "You",
  chatId,
}: {
  name: string;
  message: any;
  cardImageUrl: string;
  username?: string;
  chatId?: Id<"chats">;
}) => {
  const { currentLanguage: targetLanguage } = useLanguage();
  const { t } = useTranslation();
  const regenerate = useMutation(api.messages.regenerate);
  const react = useMutation(api.messages.react);
  const speech = useMutation(api.speeches.generate);
  const translate = useMutation(api.messages.translate);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [thinkingDots, setThinkingDots] = useState("");
  const [thinkingMessage, setThinkingMessage] = useState(t("Thinking"));

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setThinkingDots((prevDots) => {
        if (prevDots.length < 3) {
          return prevDots + ".";
        } else {
          return "";
        }
      });
      if (Date.now() - startTime >= 3000) {
        setThinkingMessage(t("Warming up AI"));
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex flex-col gap-2 ${
        message?.characterId ? "self-start" : "self-end"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-sm font-medium ${
          message?.characterId ? "justify-start" : "justify-end"
        }`}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage
            alt={`Character card of ${name}`}
            src={message?.characterId ? cardImageUrl : "undefined"}
            className="object-cover"
          />
          <AvatarFallback>
            {message?.characterId ? name[0] : username[0]}
          </AvatarFallback>
        </Avatar>
        {message?.characterId ? <>{name}</> : <>{username}</>}
      </div>
      {message?.text === "" ? (
        <div
          className={
            "max-w-[20rem] animate-pulse whitespace-pre-wrap rounded-xl px-3 py-2 md:max-w-[30rem] lg:max-w-[40rem]" +
            (message?.characterId
              ? " rounded-tl-none bg-muted "
              : " rounded-tr-none bg-muted text-muted ")
          }
        >
          {thinkingMessage}
          {thinkingDots}
        </div>
      ) : (
        <>
          <div
            className={
              "relative max-w-[20rem] whitespace-pre-wrap rounded-xl px-3 py-2 md:max-w-[30rem] lg:max-w-[40rem]" +
              (message?.characterId
                ? " rounded-tl-none bg-muted "
                : " rounded-tr-none bg-muted text-muted ")
            }
          >
            <FormattedMessage message={message} username={username} />
          </div>
          {message?.characterId && chatId && !isRegenerating && (
            <div className="flex w-fit items-center justify-start rounded-full bg-foreground/10 p-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full p-1 hover:bg-foreground/10 disabled:opacity-90"
                disabled={message?.reaction === "like"}
                onClick={async () => {
                  await react({
                    messageId: message?._id as Id<"messages">,
                    type: "like",
                  });
                }}
              >
                {message?.reaction === "like" ? (
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full p-1 hover:bg-foreground/10 disabled:opacity-90"
                disabled={message?.reaction === "dislike"}
                onClick={async () => {
                  await react({
                    messageId: message?._id as Id<"messages">,
                    type: "dislike",
                  });
                  setIsRegenerating(true);
                  await regenerate({
                    messageId: message?._id as Id<"messages">,
                    chatId,
                    characterId: message?.characterId,
                  });
                  setIsRegenerating(false);
                }}
              >
                {isRegenerating ? (
                  <Spinner className="h-4 w-4" />
                ) : message?.reaction === "dislike" ? (
                  <ThumbsDown className="h-4 w-4 text-rose-500" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
              </Button>
              <Tooltip
                content={
                  <span className="flex gap-1 p-2 text-xs text-muted-foreground">
                    {t("Play audio")} (<Crystal className="h-4 w-4" /> x 10 )
                  </span>
                }
                desktopOnly={true}
              >
                <Button
                  variant="ghost"
                  className="h-6 rounded-full p-1 hover:bg-foreground/10 disabled:opacity-90"
                  onClick={async () => {
                    if (isSpeaking) {
                      setIsSpeaking(false);
                    } else {
                      await speech({
                        messageId: message?._id as Id<"messages">,
                        characterId: message?.characterId,
                        text: message?.translation
                          ? message?.translation
                          : message?.text,
                      });
                      setIsSpeaking(true);
                    }
                  }}
                >
                  {isSpeaking ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <span className="flex w-full items-center justify-center gap-1">
                      <Headphones className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </Tooltip>
              <Tooltip
                content={
                  <span className="flex gap-1 p-2 text-xs text-muted-foreground">
                    {t("Copy message to clipboard")}
                  </span>
                }
                desktopOnly={true}
              >
                <Button
                  variant="ghost"
                  className="h-6 rounded-full p-1 hover:bg-foreground/10 disabled:opacity-90"
                  onClick={() => {
                    navigator.clipboard.writeText(message?.text);
                    toast.success("Message copied to clipboard");
                  }}
                >
                  <ClipboardIcon className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip
                content={
                  <span className="flex gap-1 p-2 text-xs text-muted-foreground">
                    {t(`Translate message to ${targetLanguage}`)} (
                    <Crystal className="h-4 w-4" /> x 1 )
                  </span>
                }
                desktopOnly={true}
              >
                <Button
                  variant="ghost"
                  className="h-6 rounded-full p-1 hover:bg-foreground/10 disabled:bg-foreground/10 disabled:opacity-100"
                  onClick={async () => {
                    setIsTranslating(true);
                    await translate({
                      messageId: message?._id as Id<"messages">,
                      targetLanguage,
                    });
                    setIsTranslating(false);
                  }}
                  disabled={message?.translation || isTranslating}
                >
                  {isTranslating ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Languages className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>

              {message?.speechUrl && isSpeaking && (
                <audio
                  autoPlay
                  controls
                  hidden
                  onEnded={() => setIsSpeaking(false)}
                >
                  <source src={message?.speechUrl} type="audio/mpeg" />
                </audio>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const Inspirations = ({
  chatId,
  characterId,
}: {
  chatId: Id<"chats">;
  characterId: Id<"characters">;
}) => {
  const { t } = useTranslation();
  const autopilot = useMutation(api.followUps.autopilot);
  return (
    <Tooltip
      content={
        <span className="flex gap-1 p-2 text-xs text-muted-foreground">
          <Crystal className="h-4 w-4" /> {t("Continue")}
        </span>
      }
      desktopOnly={true}
    >
      <Button
        variant="outline"
        onClick={() => {
          autopilot({ chatId, characterId });
        }}
        size="icon"
        type="button"
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
};

interface ChatOptionsPopoverProps {
  characterId: Id<"characters">;
  chatId: Id<"chats">;
  name: string;
}

const ChatOptionsPopover = ({
  characterId,
  chatId,
  name,
}: ChatOptionsPopoverProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = router.back;
  const remove = useMutation(api.chats.remove);
  return (
    <Popover>
      <AlertDialog>
        <PopoverContent className="w-52 p-1">
          <Link href={`/character/${characterId}/stories`}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-1 text-muted-foreground"
            >
              <BookMarked className="h-4 w-4 p-0.5" />
              <span className="w-40 truncate text-left">
                {t(`Stories of ${name}`)}
              </span>
            </Button>
          </Link>
          <Link
            href={`/my-characters/create${
              characterId ? `?remixId=${characterId}` : ""
            }`}
          >
            <Button
              variant="ghost"
              className="w-full justify-start gap-1 text-muted-foreground"
            >
              <Repeat className="h-4 w-4 p-0.5" />
              {t("Remix character")}
            </Button>
          </Link>
          <Link href={`/my-personas`}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-1 text-muted-foreground"
            >
              <CircleUserRound className="h-4 w-4 p-0.5" />
              <span className="w-40 truncate text-left">
                {t("Edit my persona")}
              </span>
            </Button>
          </Link>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-1 text-muted-foreground"
            >
              <Delete className="h-4 w-4 p-0.5" />
              <span className="w-40 truncate text-left">
                {" "}
                {t("Delete chat")}
              </span>
            </Button>
          </AlertDialogTrigger>
          <Button
            variant="ghost"
            className="w-full justify-start gap-1 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: document.title,
                  url: document.location.href,
                });
              } else {
                navigator.clipboard.writeText(document.location.href);
                toast.success("Link copied to clipboard");
              }
            }}
          >
            <Share className="h-4 w-4 p-0.5" />
            <span className="w-40 truncate text-left">
              {t("Share")} {name}
            </span>
          </Button>
        </PopoverContent>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {`This action cannot be undone. This will permanently delete chat.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const promise = remove({
                  id: chatId as Id<"chats">,
                });
                toast.promise(promise, {
                  loading: "Deleting chat...",
                  success: () => {
                    goBack();
                    return `Chat has been deleted.`;
                  },
                  error: (error) => {
                    console.log("error:::", error);
                    return error
                      ? (error.data as { message: string })?.message
                      : "Unexpected error occurred";
                  },
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
    </Popover>
  );
};

export function Dialog({
  name,
  model,
  cardImageUrl,
  chatId,
  characterId,
  isPublic,
}: {
  name: string;
  model: string;
  cardImageUrl?: string;
  chatId: Id<"chats">;
  characterId: Id<"characters">;
  isPublic?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useMutation(api.stories.create);
  const { results, loadMore } = usePaginatedQuery(
    api.messages.list,
    { chatId },
    { initialNumItems: 5 },
  );
  const remoteMessages = results.reverse();
  const messages = useMemo(
    () =>
      (
        [] as {
          characterId: Id<"characters">;
          text: string;
          _id: string;
        }[]
      ).concat(
        (remoteMessages ?? []) as {
          characterId: Id<"characters">;
          text: string;
          _id: string;
        }[],
      ),
    [remoteMessages, ""],
  );
  const username = useMyUsername();
  const sendMessage = useMutation(api.messages.send);
  const [isScrolled, setScrolled] = useState(false);
  const [input, setInput] = useState("");

  const sendAndReset = (input: string) => {
    sendMessage({ message: input, chatId, characterId });
    setInput("");
  };
  const handleSend = (event?: FormEvent) => {
    event && event.preventDefault();
    sendAndReset(input);
    setScrolled(false);
  };

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isScrolled) {
      return;
    }
    // Using `setTimeout` to make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
  }, [messages, isScrolled]);
  const ref = useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (inView && isScrolled) {
      loadMore(10);
    }
  }, [inView, loadMore]);

  return (
    <div className="h-full w-full">
      {cardImageUrl && (
        <Image
          src={cardImageUrl}
          alt={`Character card of ${name}`}
          width={300}
          height={525}
          quality={60}
          className="pointer-events-none fixed left-0 top-16 -z-10 h-[100vh] w-[100vw] object-cover opacity-50 sm:hidden"
        />
      )}
      {chatId && (
        <div className="sticky top-0 flex h-12 w-full items-center justify-between border-b bg-background p-2 px-4 lg:rounded-t-lg lg:px-6">
          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground lg:text-xs">
            <ModelBadge modelName={model as string} showCredits={true} />
            <Badge variant="model">
              <Headphones className="h-4 w-4 p-0.5" /> /
              <Crystal className="h-4 w-4 p-0.5" /> x 10
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <ChatOptionsPopover
              characterId={characterId}
              chatId={chatId}
              name={name}
            />
            {isPublic && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="h-8 gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline">Create story</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-fit">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create a story</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`When you create a story, anyone will be able to see and continue the story. Messages you send after creating your story won't be shared.`}
                    </AlertDialogDescription>
                    <div className="flex h-72 flex-col gap-4 overflow-y-scroll rounded-lg border p-4 shadow-lg scrollbar-hide">
                      {messages.map((message, i) => (
                        <Message
                          key={message._id}
                          name={name}
                          message={message}
                          username={(username as string) || "You"}
                          cardImageUrl={cardImageUrl as string}
                        />
                      ))}
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const promise = create({
                          characterId: characterId as Id<"characters">,
                          messageIds: messages
                            .slice(1)
                            .map((message) => message._id as Id<"messages">),
                        });
                        toast.promise(promise, {
                          loading: "Creating story...",
                          success: (storyId) => {
                            router.push(
                              `/character/${characterId}/story/${storyId}`,
                            );
                            if (navigator?.clipboard) {
                              navigator.clipboard.writeText(
                                document.location.href,
                              );
                              toast.success("Link copied to clipboard");
                            }
                            return `Story has been created.`;
                          },
                          error: (error) => {
                            return error?.data
                              ? (error.data as { message: string })?.message
                              : "Unexpected error occurred";
                          },
                        });
                      }}
                    >
                      Create
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}
      <div
        className={`flex h-full min-h-[60vh] flex-col overflow-y-auto lg:h-[calc(100%-12rem)] lg:min-h-fit`}
        ref={listRef}
        onWheel={() => {
          setScrolled(true);
        }}
      >
        <div
          className="mx-2 flex h-fit flex-col gap-8 rounded-lg p-4"
          ref={listRef}
          onWheel={() => {
            setScrolled(true);
          }}
        >
          <div ref={ref} />
          {remoteMessages === undefined ? (
            <>
              <div className="h-5 animate-pulse rounded-md bg-black/10" />
              <div className="h-9 animate-pulse rounded-md bg-black/10" />
            </>
          ) : (
            messages.map((message, i) => (
              <Message
                name={name}
                message={message}
                cardImageUrl={cardImageUrl as string}
                username={(username as string) || "You"}
                chatId={chatId}
              />
            ))
          )}
        </div>
      </div>
      <form
        className="sticky bottom-16 flex h-24 min-h-fit w-full flex-col items-center border-0 border-t-[1px] border-solid bg-background lg:bottom-0 lg:rounded-br-lg"
        onSubmit={(event) => void handleSend(event)}
      >
        <div className="flex w-full items-center justify-center gap-4 px-4">
          <Inspirations chatId={chatId} characterId={characterId} />
          <input
            className="my-3 w-full border-none bg-background focus-visible:ring-0"
            autoFocus
            name="message"
            placeholder="Send a message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button disabled={input === ""} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
