import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up – OShift",
    description: "Create your OShift account and stay always one step ahead.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
