"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useOrderDetailPage } from "./useOrderDetailPage";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { StreamChat } from "stream-chat";

export function useOrderChatPage() {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const { paid } = useOrderDetailPage();

  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);

  const { data: metaData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = metaData?.user?.role;

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/orders/${id}/video-invite`, { getToken, method: "POST" }),
  });

  useEffect(() => {
    if (!id) return undefined;

    let chatClient;

    async function connectOrderChat() {
      await apiFetch(`/api/orders/${id}/stream-channel`, {
        getToken,
        method: "POST",
      });

      const tokenData = await apiFetch("/api/stream/token", {
        getToken,
        method: "POST",
      });

      console.log("tokenData:", tokenData);
      chatClient = StreamChat.getInstance(tokenData.apiKey);

      await chatClient.connectUser(
        { id: tokenData.userId, name: tokenData.name },
        tokenData.token,
      );
      const channel = chatClient.channel("messaging", `order-${id}`);

      await channel.watch();
      setClient(chatClient);
    }

    connectOrderChat().catch((e) => {
      setError(e instanceof Error ? e.message : "Chat failed to load");
    });

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [paid, id, getToken]);

  const channel =
    client && id ? client.channel("messaging", `order-${id}`) : null;
  const canInvite = role === "support" || role === "admin";

  return { paid, client, error, channel, canInvite, inviteMutation };
}
