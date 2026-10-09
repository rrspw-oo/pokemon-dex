const MASK = [
  "....####....",
  "..########..",
  ".##########.",
  ".##########.",
  "############",
  "############",
  "############",
  "############",
  ".##########.",
  ".##########.",
  "..########..",
  "....####....",
];

const INK = "#22252e";
const WHITE = "#f6f5f0";

const STYLES = {
  little: { top: "#e04848", accents: [] },
  great: {
    top: "#3f7fd9",
    accents: [
      [2, 2, "#e04848"],
      [3, 2, "#e04848"],
      [8, 2, "#e04848"],
      [9, 2, "#e04848"],
      [2, 3, "#e04848"],
      [9, 3, "#e04848"],
    ],
  },
  ultra: {
    top: "#3a3a40",
    accents: [
      [3, 1, "#f2c230"],
      [3, 2, "#f2c230"],
      [3, 3, "#f2c230"],
      [8, 1, "#f2c230"],
      [8, 2, "#f2c230"],
      [8, 3, "#f2c230"],
      [4, 2, "#f2c230"],
      [7, 2, "#f2c230"],
    ],
  },
  master: {
    top: "#7b42c2",
    accents: [
      [2, 2, "#ef7fcf"],
      [9, 2, "#ef7fcf"],
      [4, 2, WHITE],
      [7, 2, WHITE],
      [4, 3, WHITE],
      [5, 3, WHITE],
      [6, 3, WHITE],
      [7, 3, WHITE],
    ],
  },
};

const inside = (x, y) => MASK[y]?.[x] === "#";

function pixelColor(x, y, style) {
  if (!inside(x, y)) return null;
  if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return INK;
  if (x >= 5 && x <= 6 && y >= 5 && y <= 6) return WHITE;
  if (x >= 4 && x <= 7 && y >= 4 && y <= 7) return INK;
  if (y === 5 || y === 6) return INK;
  const accent = style.accents.find(([ax, ay]) => ax === x && ay === y);
  if (accent) return accent[2];
  return y < 5 ? style.top : WHITE;
}

function LeagueIcon({ league }) {
  const style = STYLES[league];
  return (
    <svg className="league-icon" viewBox="0 0 12 12" aria-hidden="true" shapeRendering="crispEdges">
      {MASK.flatMap((row, y) =>
        [...row].map((_, x) => {
          const fill = pixelColor(x, y, style);
          return fill ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} /> : null;
        })
      )}
    </svg>
  );
}

export default LeagueIcon;
