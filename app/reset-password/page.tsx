import type { Metadata } from "next";
import ResetPasswordForm from "./reset-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your Salon Central account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
