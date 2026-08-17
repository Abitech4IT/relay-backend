import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

const ACCESS_TOKEN = "PASTE YOUR TOKEN HERE";

const REQUEST_ID = "PASTE YOUR PublicId HERE";

const socket = io(SERVER_URL, {
  transports: ["websocket"],

  auth: {
    token: ACCESS_TOKEN,
  },

  reconnection: false,
});

socket.on("connect", () => {
  console.log("✅ Socket connected");
  console.log("Socket ID:", socket.id);

  console.log(`Subscribing to ${REQUEST_ID}...`);

  socket.emit(
    "request:subscribe",
    {
      requestId: REQUEST_ID,
    },
    (response: { success: boolean; requestId?: string; error?: string }) => {
      console.log("Subscription response:", response);

      if (response.success) {
        console.log(`✅ Subscribed to ${response.requestId}`);
      } else {
        console.error(`❌ Subscription failed: ${response.error}`);
      }
    },
  );
});

socket.on("request:status", (payload) => {
  console.log("\n🔥 REQUEST STATUS UPDATE");
  console.log(JSON.stringify(payload, null, 2));
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection failed:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});
