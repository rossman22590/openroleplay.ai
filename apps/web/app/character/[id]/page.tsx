"use client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
} from "@repo/ui/src/components";
import Image from "next/image";
import { Dialog } from "../../dialog";
import Spinner from "@repo/ui/src/components/spinner";
import useStoreChatEffect from "../../lib/hooks/use-store-chat-effect";
import { MessagesSquare } from "lucide-react";
import { nFormatter } from "../../lib/utils";
import { SignIn } from "@clerk/nextjs";

export default function Page({ params }: { params: { id: string } }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const data = useQuery(api.characters.get, {
    id: params.id as Id<"characters">,
  });
  const chatId = useStoreChatEffect(params.id as Id<"characters">);
  return (
    <div className="w-full max-w-screen-xl flex flex-col justify-self-start">
      <Card className="w-full h-full lg:h-[42rem] shadow-none lg:shadow-xl border-transparent lg:border-border flex lg:flex-row flex-col">
        <CardHeader className="border-b lg:border-b-0 lg:border-r lg:w-96 lg:h-[42rem] relative justify-end">
          {data?.cardImageUrl && (
            <Image
              src={data.cardImageUrl}
              alt={`Character card of ${data?.name}`}
              width={300}
              height={525}
              quality={75}
              className="object-cover absolute w-full h-full lg:rounded-l-lg left-0 top-0 pointer-events-none"
            />
          )}
          <div className="bg-gradient-to-b from-transparent to-black/75 absolute -left-0 -bottom-0 w-full h-full lg:rounded-b-lg" />
          <CardTitle className="text-white text-xl z-[1] flex justify-between">
            <div className="w-[80%] truncate">{data?.name}</div>
            <Tooltip content={`Number of chats with ${data?.name}`}>
              <div className="text-white text-xs rounded-full group-hover:opacity-80 duration-200 z-[3] flex gap-0.5 items-center">
                <MessagesSquare className="w-5 h-5 p-1 aspect-square" />
                {nFormatter(data?.numChats as number)}
              </div>
            </Tooltip>
          </CardTitle>
          <p className="text-white z-[1] lg:line-clamp-5 line-clamp-3 text-sm">
            {data?.description}
          </p>
        </CardHeader>
        <CardContent className="w-full h-full p-0">
          {chatId ? (
            <Dialog
              name={data?.name as string}
              welcomeMessage={
                data?.greetings ? (data.greetings[0] as string) : undefined
              }
              chatId={chatId}
              characterId={data?._id as any}
              cardImageUrl={data?.cardImageUrl}
            />
          ) : isAuthenticated && !isLoading ? (
            <div className="w-full h-full items-center justify-center flex">
              <Spinner />
            </div>
          ) : (
            <div className="w-full h-full items-center justify-center flex">
              <SignIn />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}