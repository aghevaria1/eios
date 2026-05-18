# Cornelis RAG corpus

Lightweight, single-file corpus that the Phase-Gate Brief agent retrieves from before generating its brief. 18 chunks across 4 Cornelis product pages.

## Source URLs

1. https://www.cornelis.com/product/cornelis-cn5000-omni-path-director-class-switch
2. https://www.cornelis.com/product/cornelis-omni-path-express-director-class-switches
3. https://www.cornelis.com/product/cornelis-omni-path-express-edge-switches
4. https://www.cornelis.com/product/cornelis-cn5000-omni-path-switch

## Schema

`corpus.json` is a flat array of chunks:

```json
{
  "id": "stable-slug",
  "url": "https://...",
  "title": "Product page title",
  "section": "Section heading within the page",
  "text": "Chunked prose (200-500 chars)"
}
```

## Retrieval

Loaded once at module init by `lib/director/rag.ts`. Per request, the Phase-Gate Brief agent tokenizes a query string built from the clicked cell's `lane`, `phase`, `detail`, and matched `decision.title`, then scores each chunk via length-normalized token overlap and returns the top 3 with stable tiebreak by insertion order.

If no chunks score above 0, retrieval returns an empty array and the `PRODUCT CONTEXT` block is omitted from the prompt and the `Sources` section is omitted from the brief.

## Regeneration

The corpus was generated once via WebFetch on the 4 URLs above (WebFetch internally converts HTML to markdown and uses a small model to extract structured content). The output sections were then hand-chunked into `corpus.json` entries. To refresh:

1. Re-fetch each URL via WebFetch with a prompt asking for section-organized technical content
2. Split each page's output into ~4 chunks per section
3. Replace `corpus.json` with the new chunks (keep the schema)

Note: WebFetch is not deterministic since it uses a model for summarization. For production RAG you would replace this with a deterministic HTML→text extractor (e.g., readability.js, boilerpipe, or trafilatura).

## Design history (superseded plan)

An earlier Day-2 plan called for ~15 `.txt` files (one per source document) loaded via `lib/rag.ts`'s existing `loadDirectory()`. The lightweight single-JSON approach shipped instead — fewer moving parts, isolated under `lib/director/rag.ts` to keep v1's `lib/rag.ts` untouched per the v1-isolation working agreement.
