import { PlaceholderRoutePage } from "../../components/cgv-home-page";
import { getDictionary } from "../../lib/i18n";

export default function EnglishCultureplexPage() {
  const dictionary = getDictionary("en");

  return (
    <PlaceholderRoutePage
      eyebrow={dictionary.pages.cultureplex.eyebrow}
      title={dictionary.pages.cultureplex.title}
      description={dictionary.pages.cultureplex.description}
    />
  );
}
