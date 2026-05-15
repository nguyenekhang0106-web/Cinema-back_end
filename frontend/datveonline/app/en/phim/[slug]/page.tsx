import { notFound } from "next/navigation";
import { MovieDetailContent } from "../../../components/movie-detail-content";
import { SiteShell } from "../../../components/site-shell";
import { allMovies } from "../../../data/cgv-template";
import { getMovieBySlugWithFallback } from "../../../lib/cinema-api";

export const dynamic = "force-dynamic";

export default async function EnglishMovieDetailPage(
  props: PageProps<"/en/phim/[slug]">,
) {
  const { slug } = await props.params;
  const movie = await getMovieBySlugWithFallback("en", slug);

  if (!movie) {
    notFound();
  }

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <MovieDetailContent movie={movie} />
        </main>
      </SiteShell>
    </div>
  );
}
