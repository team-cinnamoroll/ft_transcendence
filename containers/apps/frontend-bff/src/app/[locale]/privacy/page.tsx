import { getTranslations } from 'next-intl/server';

type Section = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('Privacy');
  const sections = t.raw('sections') as Section[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      <div>
        {sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-lg font-semibold mt-8 mb-2">{section.heading}</h2>
            {section.paragraphs?.map((paragraph, i) => (
              <p key={i} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="list-disc pl-6 mb-4 space-y-1">
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
