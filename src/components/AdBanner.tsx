export function AdBanner({ slot }: { slot: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!client) return null;

  return (
    <div className="mx-auto my-6 min-h-[90px] w-full max-w-5xl overflow-hidden px-4" aria-label="Publicidad">
      <ins
        className="adsbygoogle block min-h-[90px]"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}