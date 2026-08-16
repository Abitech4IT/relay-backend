import { UserRole } from "../../common/constants/roles";

export interface RealtimeUser {
  id: string;
  role: UserRole;
}

export interface SubscribeRequestPayload {
  requestId: string;
}

export interface RequestStatusEvent {
  requestId: string;
  status: string;
  timestamp: string;
  data?: Record<string, unknown>;
}
