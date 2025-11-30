import { LRUCache } from './cache.js';
import { fetchVideoMetadata, VideoMetadata } from './metadata.js';

const WALRUS_AGGREGATOR_URL = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

// Initialize cache
const chunkCache = new LRUCache(500); // 500MB cache

/**
 * Generate HLS master manifest
 */
export function generateMasterManifest(videoId: string): string {
  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
/v1/videos/${videoId}/playlist.m3u8
`;
}

/**
 * Generate HLS media playlist
 */
export async function generateMediaPlaylist(videoId: string, baseUrl: string): Promise<string> {
  const metadata = await fetchVideoMetadata(videoId);

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
`;

  // Add each chunk to the playlist
  for (const chunk of metadata.chunks) {
    const durationInSeconds = chunk.duration / 1000;
    playlist += `#EXTINF:${durationInSeconds.toFixed(3)},\n`;
    playlist += `${baseUrl}/v1/videos/${videoId}/stream/${chunk.sequence}\n`;
  }

  playlist += '#EXT-X-ENDLIST\n';

  return playlist;
}

/**
 * Fetch a video chunk from Walrus
 */
export async function fetchChunkFromWalrus(
  blobId: string,
  prefetch: boolean = false
): Promise<ArrayBuffer> {
  // Check cache first
  const cacheKey = `blob:${blobId}`;
  const cached = chunkCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for blob: ${blobId}`);
    return cached;
  }

  console.log(`Fetching blob from Walrus: ${blobId}`);

  // Fetch from Walrus aggregator
  const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch blob from Walrus: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // Cache the chunk
  if (!prefetch) {
    chunkCache.set(cacheKey, arrayBuffer);
  }

  return arrayBuffer;
}

/**
 * Stream a video chunk by sequence number
 */
export async function streamChunk(
  videoId: string,
  sequence: number
): Promise<ArrayBuffer> {
  const metadata = await fetchVideoMetadata(videoId);

  // Find the chunk with the given sequence
  const chunk = metadata.chunks.find(c => c.sequence === sequence);
  if (!chunk) {
    throw new Error(`Chunk ${sequence} not found for video ${videoId}`);
  }

  // Fetch the chunk from Walrus
  const data = await fetchChunkFromWalrus(chunk.blob_id);

  // Prefetch next 2 chunks in background (fire and forget)
  prefetchNextChunks(metadata, sequence);

  return data;
}

/**
 * Prefetch the next 2 chunks in background
 */
async function prefetchNextChunks(metadata: VideoMetadata, currentSequence: number): Promise<void> {
  const nextChunks = metadata.chunks
    .filter(c => c.sequence > currentSequence && c.sequence <= currentSequence + 2)
    .sort((a, b) => a.sequence - b.sequence);

  for (const chunk of nextChunks) {
    // Check if already cached
    const cacheKey = `blob:${chunk.blob_id}`;
    if (!chunkCache.has(cacheKey)) {
      // Fetch and cache in background
      fetchChunkFromWalrus(chunk.blob_id, false).catch(err => {
        console.error(`Failed to prefetch chunk ${chunk.sequence}:`, err);
      });
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return chunkCache.getStats();
}
