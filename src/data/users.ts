import type { User } from "@/types/user";

export const users: Array<User & { id: string }> = [
  { id: "12345", name: "Relator", permissions: ["comment:edit", "comment:delete"] },
  { id: "26192", name: "Sujeito", permissions: [] },
  { id: "01918", name: "Luiz", permissions: [] },
];
