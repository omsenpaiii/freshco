export default function ProductLoading() {
  return (
    <div className="product-loading-shell" role="status" aria-label="Loading product">
      <div className="site-container">
        <div className="product-skeleton product-skeleton-breadcrumb" />
        <div className="product-loading-grid" aria-hidden="true">
          <div className="product-skeleton product-skeleton-image" />
          <div className="product-loading-details">
            <div className="product-skeleton product-skeleton-brand" />
            <div className="product-skeleton product-skeleton-title" />
            <div className="product-skeleton product-skeleton-title" />
            <div className="product-skeleton product-skeleton-price" />
            <div className="product-skeleton product-skeleton-line" />
            <div className="product-skeleton product-skeleton-line" />
            <div className="product-skeleton product-skeleton-button" />
          </div>
        </div>
        <span className="sr-only">Getting your fresh pick ready…</span>
      </div>
    </div>
  )
}
