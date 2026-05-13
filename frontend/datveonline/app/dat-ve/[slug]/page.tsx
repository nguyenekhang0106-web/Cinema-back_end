import { SeatSelectionClient } from "../../components/seat-selection-client";
import { SiteShell } from "../../components/site-shell";

export default async function SeatSelectionPage(
  props: PageProps<"/dat-ve/[slug]">,
) {
  const { slug } = await props.params;

  return (
    <div className="cinema-page bg-[#fdfcf0] min-h-screen">
      <SiteShell>
        {/* ĐÃ SỬA: Tăng từ max-w-6xl lên max-w-[1400px] để mở rộng sang 2 bên */}
        <main className="cinema-shell px-4 py-8 sm:px-6 max-w-[1400px] mx-auto">
          <SeatSelectionClient showtimeId={slug} />
        </main>
      </SiteShell>
    </div>
  );
}