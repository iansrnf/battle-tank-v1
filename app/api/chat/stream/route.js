export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sendSse(controller, payload) {
  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    return true;
  } catch {
    return false;
  }
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePrivmsg(line) {
  const match = line.match(/display-name=([^;]*).* PRIVMSG #\S+ :(.*)$/);
  if (!match) return null;

  const [, displayName, message] = match;
  const cleanName = displayName || "viewer";
  return {
    id: createMessageId("chat"),
    user: cleanName,
    text: message,
    kind: "chat",
    time: Date.now(),
  };
}

function normalizeEntries(message) {
  if (Array.isArray(message)) return message;
  if (message && typeof message === "object") return [message];
  return [];
}

function getDisplayName(entry) {
  return entry?.name || entry?.from || entry?.username || "Someone";
}

function getDonationSender(entry) {
  return entry?.from || entry?.name || entry?.username || "Someone";
}

function getTipAmount(entry) {
  return entry?.formatted_amount || entry?.formattedAmount || entry?.displayString || entry?.amount_display || entry?.amount;
}

function joinParts(parts) {
  return parts.filter(Boolean).join(" • ");
}

function formatStreamlabsEvent(eventData) {
  const entry = normalizeEntries(eventData?.message)[0];
  if (!entry) return null;

  switch (eventData.type) {
    case "donation": {
      const donor = getDonationSender(entry);
      const amount = getTipAmount(entry);
      const message = entry.message || entry.comment || "";
      return {
        id: createMessageId("tip"),
        kind: "alert",
        alertType: "tip",
        text: joinParts([`Tip from ${donor}`, amount, message]),
        time: Date.now(),
      };
    }
    case "bits": {
      const sender = getDisplayName(entry);
      const amount = entry.amount ? `${entry.amount} bits` : "bits";
      const message = entry.message || entry.comment || "";
      return {
        id: createMessageId("bits"),
        kind: "alert",
        alertType: "bits",
        text: joinParts([`${sender} cheered`, amount, message]),
        time: Date.now(),
      };
    }
    case "follow":
      return {
        id: createMessageId("follow"),
        kind: "alert",
        alertType: "follow",
        text: `${getDisplayName(entry)} followed the channel`,
        time: Date.now(),
      };
    case "subscription": {
      const user = getDisplayName(entry);
      const months = entry.months ? `${entry.months} month${entry.months === 1 ? "" : "s"}` : "";
      const plan = entry.sub_plan_name || entry.sub_type || "";
      const message = entry.message || entry.comment || "";
      return {
        id: createMessageId("sub"),
        kind: "alert",
        alertType: "subscription",
        text: joinParts([`${user} subscribed`, months, plan, message]),
        time: Date.now(),
      };
    }
    default:
      return null;
  }
}

async function getTwitchIdentity(token) {
  const response = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `OAuth ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to validate Twitch token.");
  }

  return response.json();
}

export async function GET() {
  const token = process.env.access_token?.trim();
  const streamlabsToken = process.env.socket_api_token?.trim();

  const stream = new ReadableStream({
    async start(controller) {
      let socket;
      let streamlabs;
      let heartbeat;
      let closed = false;

      const emit = (payload) => {
        if (closed) return;
        const sent = sendSse(controller, payload);
        if (!sent) {
          finish();
        }
      };

      const finish = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        if (socket && socket.readyState <= 1) {
          socket.close();
        }
        if (streamlabs) {
          streamlabs.disconnect();
        }
        try {
          controller.close();
        } catch {}
      };

      const closeAll = () => {
        finish();
      };

      try {
        if (!token && !streamlabsToken) {
          throw new Error("Missing Twitch and Streamlabs tokens.");
        }

        if (token) {
          const identity = await getTwitchIdentity(token);
          const login = identity.login?.toLowerCase();
          const scopes = identity.scopes ?? [];

          if (!login) {
            throw new Error("Twitch token is missing an account login.");
          }

          if (!scopes.includes("chat:read")) {
            emit({
              id: "system-chat-scope",
              kind: "system",
              text: "Twitch token is missing chat:read, so chat messages are disabled.",
              time: Date.now(),
            });
          } else {
            const channel = (process.env.TWITCH_CHANNEL || login).toLowerCase();
            emit({
              id: "system-connected",
              kind: "system",
              text: `Watching Twitch chat for #${channel}`,
              time: Date.now(),
            });

            socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

            socket.addEventListener("open", () => {
              socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
              socket.send(`PASS oauth:${token}`);
              socket.send(`NICK ${login}`);
              socket.send(`JOIN #${channel}`);
            });

            socket.addEventListener("message", (event) => {
              const lines = String(event.data).split("\r\n").filter(Boolean);
              for (const line of lines) {
                if (line.startsWith("PING ")) {
                  socket.send(line.replace("PING", "PONG"));
                  continue;
                }

                if (line.includes(" PRIVMSG ")) {
                  const message = parsePrivmsg(line);
                  if (message) emit(message);
                }
              }
            });

            socket.addEventListener("close", () => {
              emit({
                id: "system-chat-closed",
                kind: "system",
                text: "Twitch chat connection closed.",
                time: Date.now(),
              });
            });

            socket.addEventListener("error", () => {
              emit({
                id: "system-chat-error",
                kind: "system",
                text: "Unable to connect to Twitch chat.",
                time: Date.now(),
              });
            });
          }
        }

        if (streamlabsToken) {
          const socketIoClient = await import("socket.io-client");
          const io = socketIoClient.io || socketIoClient.default;
          streamlabs = io(`https://sockets.streamlabs.com?token=${streamlabsToken}`, {
            transports: ["websocket"],
            reconnection: true,
          });

          emit({
            id: "system-streamlabs-connected",
            kind: "system",
            text: "Watching Streamlabs alerts for tips, bits, follows, and subscriptions.",
            time: Date.now(),
          });

          streamlabs.on("connect", () => {
            emit({
              id: createMessageId("system"),
              kind: "system",
              text: "Streamlabs alert connection active.",
              time: Date.now(),
            });
          });

          streamlabs.on("event", (eventData) => {
            const formatted = formatStreamlabsEvent(eventData);
            if (formatted) emit(formatted);
          });

          streamlabs.on("disconnect", () => {
            emit({
              id: createMessageId("system"),
              kind: "system",
              text: "Streamlabs alert connection closed.",
              time: Date.now(),
            });
          });

          streamlabs.on("connect_error", () => {
            emit({
              id: createMessageId("system"),
              kind: "system",
              text: "Unable to connect to Streamlabs alerts.",
              time: Date.now(),
            });
          });
        }

        heartbeat = setInterval(() => {
          emit({
            id: `heartbeat-${Date.now()}`,
            kind: "heartbeat",
            time: Date.now(),
          });
        }, 15000);
      } catch (error) {
        emit({
          id: "system-failure",
          kind: "system",
          text: error instanceof Error ? error.message : "Failed to start chat stream.",
          time: Date.now(),
        });
        closeAll();
      }
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
