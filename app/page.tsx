import { PotterFlixExplorer } from "@/components/potterflix/potterflix-explorer";
import { getInitialBooks } from "@/lib/server-potter";

export default async function Home() {
  const initialBooks = await getInitialBooks();
  return <PotterFlixExplorer initialBooks={initialBooks} />;
}
