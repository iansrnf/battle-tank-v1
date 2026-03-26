"use client";

import { useEffect, useState } from "react";

const MAX_MESSAGES = 40;

export function useTwitchChat() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const source = new EventSource("/api/chat/stream");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.kind === "heartbeat") return;

        setMessages((current) => {
          const next = [...current, payload];
          return next.slice(-MAX_MESSAGES);
        });
      } catch {}
    };

    source.onerror = () => {
      setMessages((current) => {
        if (current.some((message) => message.id === "local-chat-error")) {
          return current;
        }

        return [
          ...current.slice(-(MAX_MESSAGES - 1)),
          {
            id: "local-chat-error",
            kind: "system",
            text: "Chat feed disconnected. Refresh to reconnect.",
            time: Date.now(),
          },
        ];
      });
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  return messages;
}
