import Link from "next/link";
import { PageHero } from "@/components/ui";

export default function NotFound() {
  return (
    <PageHero title="Page not found" lead="That page doesn't exist or has moved.">
      <div className="actions"><Link href="/" className="btn primary">Go to the home page</Link></div>
    </PageHero>
  );
}
