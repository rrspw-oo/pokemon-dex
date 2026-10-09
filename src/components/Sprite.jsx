import { useState } from "react";

function Sprite({ urls, alt, className = "", eager = false }) {
  const [index, setIndex] = useState(0);
  const failed = index >= urls.length;

  if (failed) {
    return (
      <span className={`sprite sprite-missing ${className}`} role="img" aria-label={alt}>
        ?
      </span>
    );
  }

  return (
    <img
      key={urls[index]}
      src={urls[index]}
      alt={alt}
      className={`sprite ${className}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      crossOrigin="anonymous"
      draggable="false"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

export default Sprite;
