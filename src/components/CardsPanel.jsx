import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ASSETS = "https://assets.tcgdex.net/";
const PROXY = "https://wsrv.nl/?url=assets.tcgdex.net/";
const SOURCES = [
  { base: PROXY, ext: "webp", cors: true },
  { base: ASSETS, ext: "webp" },
  { base: ASSETS, ext: "jpg" },
];

const preload = (url) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  return img;
};
let cardsPromise;
const loadCards = () => (cardsPromise ||= import("../data/cards.json").then((m) => m.default));

function toCard(img, sets) {
  const cut = img.lastIndexOf("/");
  const setPath = img.slice(0, cut);
  const no = img.slice(cut + 1);
  return { img, no, set: sets[setPath] };
}

const formatPrice = (price) => `US$${price.toLocaleString("en-US")}`;

function CardImage({ card, size, alt, lazy, onFail }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= SOURCES.length) onFail?.(card.img);
  }, [index, card, onFail]);

  if (index >= SOURCES.length) {
    if (onFail) return null;
    return (
      <span className="card-missing" role="img" aria-label={alt}>
        ?
      </span>
    );
  }

  return (
    <img
      key={index}
      src={`${SOURCES[index].base}${card.img}/${size}.${SOURCES[index].ext}`}
      crossOrigin={SOURCES[index].cors ? "anonymous" : undefined}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      draggable="false"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

const highUrl = (card) => `${PROXY}${card.img}/high.webp`;

function ViewerImage({ card, alt }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = preload(highUrl(card));
    img.onload = () => setReady(true);
  }, [card]);

  if (ready) return <img src={highUrl(card)} alt={alt} crossOrigin="anonymous" draggable="false" />;
  return <CardImage card={card} size="low" alt={alt} />;
}

function CardViewer({ cards, index, name, prices, priceDate, onIndex, onClose }) {
  const card = cards[index];
  const price = prices[card.img];
  const hasNext = index < cards.length - 1;
  const hasPrev = !hasNext && index > 0;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    for (const near of [cards[index - 1], cards[index + 1]]) {
      if (near) preload(highUrl(near));
    }
  }, [cards, index]);

  const swipe = useRef(null);
  const onPointerDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY, done: false };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    s.done = true;
    const next = index + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < cards.length) onIndex(next);
  };
  const onBackdropClick = () => {
    const swiped = swipe.current?.done;
    swipe.current = null;
    if (!swiped) onClose();
  };

  const step = (delta) => (e) => {
    e.stopPropagation();
    onIndex(index + delta);
  };

  return (
    <div
      className="card-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} ${card.set}`}
      onClick={onBackdropClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <ViewerImage key={card.img} card={card} alt={`${name} ${card.set} ${card.no}`} />
      <p className="card-viewer-caption">
        {card.set} #{card.no}
        {price && (
          <span className="card-price">
            {formatPrice(price)}
            <span className="card-price-date">{priceDate}</span>
          </span>
        )}
        <span className="card-viewer-count">
          {index + 1} / {cards.length}
        </span>
      </p>
      <div className="card-viewer-actions">
        {hasPrev && (
          <button type="button" className="pixel-button" onClick={step(-1)}>
            上一張
          </button>
        )}
        <button type="button" className="pixel-button" onClick={onClose}>
          關閉
        </button>
        {hasNext && (
          <button type="button" className="pixel-button" onClick={step(1)}>
            下一張
          </button>
        )}
      </div>
    </div>
  );
}

const DESKTOP = window.matchMedia("(min-width: 860px)");

function useDesktop() {
  const [desktop, setDesktop] = useState(DESKTOP.matches);
  useEffect(() => {
    const onChange = (e) => setDesktop(e.matches);
    DESKTOP.addEventListener("change", onChange);
    return () => DESKTOP.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

function CardsPanel({ dex, name }) {
  const [all, setAll] = useState(null);
  const [toggled, setToggled] = useState(false);
  const desktop = useDesktop();
  const open = desktop || toggled;
  const [viewing, setViewing] = useState(null);
  const drag = useRef(null);

  useEffect(() => {
    let alive = true;
    loadCards().then((d) => alive && setAll(d));
    return () => {
      alive = false;
    };
  }, []);

  const cards = useMemo(() => all?.cards[dex]?.map((img) => toCard(img, all.sets)), [all, dex]);

  const prices = all?.prices;
  const ordered = useMemo(() => {
    if (!cards) return cards;
    const priced = cards.filter((card) => prices[card.img]).sort((a, b) => prices[b.img] - prices[a.img]);
    return [...priced, ...cards.filter((card) => !priced.includes(card))];
  }, [cards, prices]);

  const [failed, setFailed] = useState(() => new Set());
  const onFail = useCallback((img) => setFailed((prev) => new Set(prev).add(img)), []);
  const visible = ordered?.filter((card) => !failed.has(card.img));

  if (!cards) return null;

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      e.currentTarget.classList.add("is-dragging");
    }
    if (d.moved) e.currentTarget.scrollLeft = d.left - dx;
  };
  const onPointerUp = (e) => {
    if (drag.current?.moved) e.currentTarget.classList.remove("is-dragging");
    if (drag.current && !drag.current.moved) drag.current = null;
  };
  const onPointerLeave = (e) => {
    e.currentTarget.classList.remove("is-dragging");
    drag.current = null;
  };
  const onClickCapture = (e) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
    drag.current = null;
  };

  const toggle = () => {
    if (!open) for (const card of cards) preload(`${PROXY}${card.img}/low.webp`);
    setToggled((v) => !v);
  };

  return (
    <section className="panel">
      <h3 className="panel-title">卡牌</h3>
      <div className={`matchup-block card-block ${open ? "is-open" : ""}`}>
        {!desktop && (
          <button type="button" className="matchup-toggle" aria-expanded={open} onClick={toggle}>
            {open ? (
              "收卡"
            ) : (
              <>
                發卡
                <span className="card-count" aria-label={`${cards.length} 張`}>
                  {cards.length}
                </span>
              </>
            )}
          </button>
        )}
        {open && visible.length === 0 && <p className="card-loading">此寶可夢暫搜尋不到卡牌</p>}
        {open && visible.length > 0 && (
          <ul
            className="card-strip"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onClickCapture={onClickCapture}
          >
            {visible.map((card, i) => (
              <li key={card.img}>
                <button type="button" className="card-thumb" onClick={() => setViewing(i)}>
                  <CardImage card={card} size="low" alt={`${name} ${card.set} ${card.no}`} lazy onFail={onFail} />
                  <span className="card-meta">
                    {card.img.startsWith("en/") && <em>EN</em>}
                    {card.set}
                  </span>
                  {prices[card.img] && (
                    <span className="card-price">
                      {formatPrice(prices[card.img])}
                      <span className="card-price-date">{all.priceDate}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {viewing !== null && (
        <CardViewer
          cards={visible}
          index={viewing}
          name={name}
          prices={prices}
          priceDate={all.priceDate}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
        />
      )}
    </section>
  );
}

export default CardsPanel;
