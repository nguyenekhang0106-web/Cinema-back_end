import { notFound } from "next/navigation";
import { SeatSelectionClient } from "../../components/seat-selection-client";
import { SiteShell } from "../../components/site-shell";
import { allMovies } from "../../data/cgv-template";
import { getMovieBySlugWithFallback } from "../../lib/cinema-api";
import { getLocalizedCinemas } from "../../lib/localized-data";

export async function generateStaticParams() {
  return allMovies.map((movie) => ({ slug: movie.slug }));
}

export default async function SeatSelectionPage(
  props: PageProps<"/dat-ve/[slug]">,
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const movie = await getMovieBySlugWithFallback("vi", slug);
  const selectedCinemaId = String(searchParams.cinema ?? "");
  const selectedCinema = getLocalizedCinemas("vi").find(
    (cinema) => cinema.id === selectedCinemaId,
  );

  if (!movie) {
    notFound();
  }

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <SeatSelectionClient
            movie={movie}
            selectedCinemaId={selectedCinemaId}
            selectedCinemaName={selectedCinema?.name}
            selectedTime={String(searchParams.time ?? "")}
          />
        </main>
      </SiteShell>
    </div>
  );
}
