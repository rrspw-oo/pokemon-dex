const FLAME = [
  "....#.....",
  "...##.....",
  "...###..#.",
  "..####.##.",
  ".#######..",
  ".########.",
  "##########",
  "####oo####",
  "###oooo###",
  "###oooo###",
  ".##oooo##.",
  "..######..",
];

function ShadowIcon({ title = "暗影" }) {
  return (
    <svg className="shadow-icon" viewBox="0 0 10 12" role="img" aria-label={title} shapeRendering="crispEdges">
      <title>{title}</title>
      {FLAME.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={c === "o" ? "#c9a4ff" : "#6b2fb3"} />
        )
      )}
    </svg>
  );
}

export default ShadowIcon;
