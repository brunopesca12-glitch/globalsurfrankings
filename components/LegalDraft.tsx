export function LegalDraft() {
  return (
    <div
      hidden
      dangerouslySetInnerHTML={{
        __html: "<!-- DRAFT: pending legal review. This is a first draft and not a final legal opinion. -->",
      }}
    />
  );
}
