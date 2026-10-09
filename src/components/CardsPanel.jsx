import { useEffect, useRef, useState } from "react";

const ASSETS = "https://assets.tcgdex.net/";
const FORMATS = ["webp", "jpg"];
let cardsPromise;
const loadCards = () => (cardsPromise ||= import("../data/cards.json").then((m) => m.default));

function CardImage({ card, size, alt, lazy }) {
  const [index, setIndex] = useState(0);

  if (index >= FORMATS.length) {
    return (
      <span className="card-missing" role="img" aria-label={alt}>
        ?
      </span>
    );
  }

  return (
    <img
      key={index}
      src={`${ASSETS}${card.img}/${size}.${FORMATS[index]}`}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      crossOrigin="anonymous"
      draggable="false"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

function CardViewer({ cards, index, name, onIndex, onClose }) {
  const card = cards[index];
  const hasNext = index < cards.length - 1;
  const hasPrev = !hasNext && index > 0;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      <CardImage key={card.img} card={card} size="high" alt={`${name} ${card.set} ${card.no}`} />
      <p className="card-viewer-caption">
        {card.set} #{card.no}
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

function CardsPanel({ dex, name }) {
  const [all, setAll] = useState(null);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [viewing, setViewing] = useState(null);
  const drag = useRef(null);

  useEffect(() => {
    let alive = true;
    loadCards().then((d) => alive && setAll(d));
    return () => {
      alive = false;
    };
  }, []);

  const cards = all?.[dex];
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
    setOpen((v) => !v);
    setShown(true);
  };

  return (
    <section className="panel">
      <h3 className="panel-title">卡牌</h3>
      <div className={`matchup-block card-block ${open ? "is-open" : ""}`}>
        <button type="button" className="matchup-toggle" aria-expanded={open} onClick={toggle}>
          {open ? "收起卡牌" : `顯示 ${cards.length} 張卡牌`}
        </button>
        <div className="collapse" aria-hidden={!open}>
          <div className="collapse-inner">
            {shown && (
              <ul
                className="card-strip"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerLeave}
                onClickCapture={onClickCapture}
              >
                {cards.map((card, i) => (
                  <li key={card.img}>
                    <button type="button" className="card-thumb" onClick={() => setViewing(i)}>
                      <CardImage card={card} size="low" alt={`${name} ${card.set} ${card.no}`} lazy />
                      <span className="card-meta">
                        {card.img.startsWith("en/") && <em>EN</em>}
                        {card.set}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {viewing !== null && (
        <CardViewer cards={cards} index={viewing} name={name} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </section>
  );
}

export default CardsPanel;
