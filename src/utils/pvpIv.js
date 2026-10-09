export function computeCp(stats, iv, m) {
  const cp = Math.floor(((stats[0] + iv[0]) * Math.sqrt(stats[1] + iv[1]) * Math.sqrt(stats[2] + iv[2]) * m * m) / 10);
  return Math.max(10, cp);
}

export function bestIv(stats, cap, cpm) {
  let best = null;
  for (let a = 0; a <= 15; a++) {
    for (let d = 0; d <= 15; d++) {
      for (let s = 0; s <= 15; s++) {
        for (let i = cpm.length - 1; i >= 0; i--) {
          const [level, m] = cpm[i];
          const cp = computeCp(stats, [a, d, s], m);
          if (cp > cap) continue;
          const product = (stats[0] + a) * m * (stats[1] + d) * m * Math.floor((stats[2] + s) * m);
          const better =
            !best ||
            product > best.product ||
            (product === best.product && (cp > best.cp || (cp === best.cp && a > best.iv[0])));
          if (better) best = { iv: [a, d, s], level, cp, product };
          break;
        }
      }
    }
  }
  return best;
}
