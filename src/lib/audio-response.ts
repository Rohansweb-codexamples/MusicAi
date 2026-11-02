/** Serves stored audio with range support, or as an attachment for downloads. */
export function audioResponse(
  buffer: Buffer,
  mime: string,
  request: Request,
  filename?: string,
) {
  const headers = new Headers({
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=600",
  });

  if (filename) {
    const safe = filename.replace(/[^A-Za-z0-9 ._-]/g, "").slice(0, 80) || "track";
    headers.set("Content-Disposition", `attachment; filename="${safe}"`);
  }

  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), buffer.length - 1) : buffer.length - 1;

      if (Number.isFinite(start) && start <= end && start < buffer.length) {
        const chunk = buffer.subarray(start, end + 1);
        headers.set("Content-Range", `bytes ${start}-${end}/${buffer.length}`);
        headers.set("Content-Length", String(chunk.length));
        return new Response(new Uint8Array(chunk), { status: 206, headers });
      }
    }
  }

  headers.set("Content-Length", String(buffer.length));
  return new Response(new Uint8Array(buffer), { status: 200, headers });
}
