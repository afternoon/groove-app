import { type Timestamp } from "firebase/firestore";

export interface Project {
  id: string;
  name?: string;
  ownerId: string;
  createdAt: Timestamp;
  isPublic: boolean;
  latestSnapshot?: {
    content?: {
      tempo?: number;
    };
  };
}
