import { cookies } from "next/headers";

export const PASSWORD_RECOVERY_COOKIE = "engleet_password_recovery";
export const PASSWORD_RECOVERY_COOKIE_VALUE = "active";
export const PASSWORD_RECOVERY_MAX_AGE_SECONDS = 10 * 60;

export async function hasPasswordRecoveryCookie() {
  const cookieStore = await cookies();

  return (
    cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value ===
    PASSWORD_RECOVERY_COOKIE_VALUE
  );
}

