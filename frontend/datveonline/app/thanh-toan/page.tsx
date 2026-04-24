import { Typography } from "antd";
import { CheckoutClient } from "../components/checkout-client";
import { SiteShell } from "../components/site-shell";
import { getDictionary } from "../lib/i18n";
import { getLocalizedCinemas, getLocalizedMovieBySlug } from "../lib/localized-data";

export default async function CheckoutPage(props: PageProps<"/thanh-toan">) {
  const searchParams = await props.searchParams;
  const dictionary = getDictionary("vi");
  const movie = getLocalizedMovieBySlug("vi", String(searchParams.movie ?? ""));
  const cinema = getLocalizedCinemas("vi").find(
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
