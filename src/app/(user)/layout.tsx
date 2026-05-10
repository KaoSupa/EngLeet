import { requireUser } from "@/lib/auth/session";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/dashboard");

  return children;
}
