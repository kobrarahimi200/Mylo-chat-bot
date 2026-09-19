export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  isRenamedManually?: boolean;
}

export type Folder = {
  id: string;
  name: string;
  createdAt: number;
};

export type Language = "en" | "fa";
export type Theme = "light" | "dark";
