export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="page-header">
      {eyebrow && (
        <p className="page-header-eyebrow">
          {eyebrow}
        </p>
      )}

      <h1 className="type-subheading-1 page-header-title">
        {title}
      </h1>

      {description && (
        <p className="type-body-1 page-header-description">
          {description}
        </p>
      )}
    </div>
  )
}