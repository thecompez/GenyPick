import { AppShell } from "@/components/AppShell";
import { FarcasterProvider } from "@/components/FarcasterProvider";

export default function Home() {
  return (
    <FarcasterProvider>
      <AppShell />
    </FarcasterProvider>
  );
}
