import { redirect } from "next/navigation";
import { DEMO_THEME_SLUG } from "@/lib/catalogue";

export default function BoardIndexPage() {
  redirect(`/board/${DEMO_THEME_SLUG}`);
}
