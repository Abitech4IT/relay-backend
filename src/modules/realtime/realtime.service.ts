import { RequestStatus } from "../../common/constants/request-status";
import { getRealtimeServer, getRequestRoom } from "./realtime.gateway";

export class RealtimeService {
  emitRequestStatus(
    publicRequestId: string,
    status: RequestStatus,
    data?: Record<string, unknown>,
  ): void {
    const io = getRealtimeServer();

    io.to(getRequestRoom(publicRequestId)).emit("request:status", {
      requestId: publicRequestId,
      status,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    });
  }

  safeEmitRequestStatus(
    publicRequestId: string,
    status: RequestStatus,
    data?: Record<string, unknown>,
  ): void {
    try {
      this.emitRequestStatus(publicRequestId, status, data);
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("Realtime status publish failed", {
          requestId: publicRequestId,

          status,

          error:
            error instanceof Error ? error.message : "Unknown realtime error",
        });
      }
    }
  }
}

export const realtimeService = new RealtimeService();
