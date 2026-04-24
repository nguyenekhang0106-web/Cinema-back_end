import { Typography } from "antd";
import { CheckoutClient } from "../../components/checkout-client";
import { SiteShell } from "../../components/site-shell";
import { getDictionary } from "../../lib/i18n";
import { getLocalizedCinemas, getLocalizedMovieBySlug } from "../../lib/localized-data";

export default async function EnglishCheckoutPage(
  props: PageProps<"/en/thanh-toan">,
) {
  const searchParams = await props.searchParams;
  const dictionary = getDictionary("en");
  const movie = getLocalizedMovieBySlug("en", String(searchParams.movie ?? ""));
  const cinema = getLocalizedCinemas("en").find(
    (item) => item.id === String(searchParams.cinema ?? ""),
  );
  const time = String(searchParams.time ?? "");
  const seats = String(searchParams.seats ?? "")
    .split(",")
    .filter(Boolean);
  const total = Number(searchParams.total ?? 0);

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          {movie && cinema && seats.length > 0 ? (
            <CheckoutClient
              movieTitle={movie.title}
              cinemaName={cinema.name}
              time={time}
              seats={seats}
              total={total}
            />
          ) : (
            <Typography.Title level={3}>
              {dictionary.checkout.invalidOrder}
            </Typography.Title>
          )}
        </main>
      </SiteShell>
    </div>
  );
}
