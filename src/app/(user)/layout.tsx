import AppNavbar from "@/components/navigation/AppNavbar";
import { requireUser } from "@/lib/auth/session";
import { getDashboardProfile } from "@/lib/users/profile";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser("/dashboard");
  const { profile } = await getDashboardProfile(supabase, user.id);

  const displayName =
    profile?.display_name ?? profile?.username ?? user.email ?? "Learner";

  return (
    <>
      <AppNavbar
        user={{
          displayName,
          email: user.email,
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
      {children}
    </>
  );
}
