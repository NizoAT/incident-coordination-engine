export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = Number.parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(pageSizeRaw, 100)
      : 20;
  return { page, pageSize };
}
