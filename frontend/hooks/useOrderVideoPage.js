"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function useOrderVideoPage() {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch(`/api/orders/${id}`, { getToken }),
    enabled: Boolean(id) && isSignedIn,
  });

  const order = data?.order;
  const paid = order?.status === "paid";

  useEffect(() => {
    if (!paid || !isSignedIn || !id) return undefined;

    let videoClient;
    let activeCall;

    async function connectOrderVideo() {
      const token = await apiFetch("/api/stream/token", {
        getToken,
        method: "POST",
      });

      videoClient = new StreamVideoClient({
        apiKey: token.apiKey,
        user: { id: token.userId, name: token.name },
        token: token.token,
      });

      activeCall = videoClient.call("default", `order-${id}`);
      await activeCall.join({ create: true });
      setClient(videoClient);
      setCall(activeCall);
    }

    connectOrderVideo().catch((e) => {
      setError(e instanceof Error ? e.message : "Video failed to start");
    });

    return () => {
      activeCall?.leave().catch(() => {});
      videoClient?.disconnectUser().catch(() => {});
    };
  }, [paid, isSignedIn, id, getToken]);

  return {
    id,
    client,
    call,
    error,
    isLoading,
    loadError,
    order,
    paid,
  };
}

export default useOrderVideoPage;
