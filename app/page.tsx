import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LoveResume – Free AI Resume Builder | ATS-Optimized Templates",
  alternates: {
    canonical: "https://loveresume.app/",
  },
};

export default function Home() {
  redirect("/builder");
}
