# Cornelis RAG Corpus

This directory holds the public-source document corpus used by the Director PM agents (Phase-Gate Brief Agent, Roadmap Comms Agent) for retrieval-augmented generation.

## Status

**Pre-staged on Day 2.** Corpus assembly happens on Day 4 morning per the build plan. This README locks the directory structure now so Day 4 work drops files in without touching `lib/rag.ts` plumbing.

## File format

- One file per source document, `.txt` extension (matches v1's `loadDirectory` extension filter — no loader change needed)
- First line of each file: `Source: <human-readable citation>` followed by URL on line 2
- Remainder: full or excerpted text content

Example:
```
Source: Cornelis CN6000 Product Announcement (Nov 2025)
https://www.cornelisnetworks.com/...

[document body...]
```

## Day 4 corpus target — 15 documents

1. Cornelis CN6000 product announcement (Nov 2025)
2. Cornelis CN5000 product page
3. Spelman keynote / public talk transcript
4. Hays interview on protocol selection (HPCwire or similar)
5. UEC consortium technical overview
6. ServeTheHome CN6000 deep-dive coverage
7. HPE Cray + Cornelis partnership announcement
8. DOE / federal HPC procurement public materials
9. NCCL / NVIDIA collective communications technical overview
10. Slurm topology-aware scheduling documentation
11. PyTorch distributed training / RDMA documentation
12. Broadcom Tomahawk + UEC announcements
13. Penguin Solutions / federal HPC integration materials
14. Cornelis "65% GPU idle" public statement / GPU utilization context
15. Industry supply lead time benchmarks (analyst content)

## Loader integration

`lib/rag.ts` will be extended on Day 4 to:
1. Add a `loadDirectory(path.join(process.cwd(), 'data', 'targets', activeTarget, 'rag-corpus'), 'targets/<activeTarget>')` call inside `initRAG()`
2. Add a new `retrieveTargetContext(query: string, targetId: string, topK = 3): RAGResult[]` function that filters corpus by source prefix `targets/<targetId>/`

v1's keyword-based retrieval (Jaccard-style token overlap) handles this corpus without an embedding API. If retrieval quality reads thin during Day 4 testing, the Day 5 contingency is to swap in Voyage AI embeddings — `sqlite-vec` is already a project dependency and `lib/db.ts` has an unused `embeddings` table ready to wire up.
