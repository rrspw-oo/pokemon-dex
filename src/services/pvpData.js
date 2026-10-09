import { useEffect, useState } from "react";

export const LEAGUES = [
  [1500, "超級聯盟", "超級"],
  [2500, "高級聯盟", "高級"],
  [10000, "大師聯盟", "大師"],
];

let pvpPromise;
let cupsPromise;

const loadPvp = () => (pvpPromise ||= import("../data/pvp.json").then((m) => m.default));
const loadCups = () => (cupsPromise ||= import("../data/cups.json").then((m) => m.default));

function useLoaded(loader) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    loader().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [loader]);
  return data;
}

export const usePvpData = () => useLoaded(loadPvp);
export const useCupsData = () => useLoaded(loadCups);
