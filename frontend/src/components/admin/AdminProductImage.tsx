import { useState, useEffect } from 'react';

export function AdminProductImage({
  imageUrl,
  title,
  categoryName,
  compact = false,
  onImageError,
}: {
  imageUrl?: string;
  title: string;
  categoryName: string;
  compact?: boolean;
  onImageError?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const wrapperClassName = compact ? 'admin-image-preview compact-admin-image-preview' : 'admin-image-preview';

  return (
    <div className={wrapperClassName}>
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={title}
          onError={() => {
            setImageFailed(true);
            onImageError?.();
          }}
        />
      ) : (
        <div className="admin-image-placeholder">
          <strong>{title}</strong>
          <span>
            {imageUrl && imageFailed
              ? 'No pudimos cargar esa imageUrl'
              : categoryName}
          </span>
        </div>
      )}
    </div>
  );
}
