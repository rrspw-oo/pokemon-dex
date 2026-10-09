export const formatId = (id) => `#${String(id).padStart(4, "0")}`;
export const shortName = (zh) => zh.replace(/的樣子\)/, ")");
