import { SuiClient } from '@mysten/sui/client';
import axios from 'axios';

const SUI_RPC_URL = import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const AGGREGATOR_URL = import.meta.env.VITE_AGGREGATOR_URL || 'http://localhost:3001';

export interface VideoChunk {
  blob_id: string;
  sequence: number;
  duration: number;
}

export interface Video {
  id: string;
  creator: string;
  title: string;
  description: string;
  chunks: VideoChunk[];
  thumbnail_blob_id: string;
  created_at: number;
  views: number;
}

// Initialize Sui client
const suiClient = new SuiClient({ url: SUI_RPC_URL });

/**
 * Fetch video metadata from aggregator (which queries Sui)
 */
export async function fetchVideoMetadata(videoId: string): Promise<Video> {
  const response = await axios.get(`${AGGREGATOR_URL}/v1/videos/${videoId}/metadata`);
  return response.data;
}

/**
 * Fetch all videos for the feed
 */
export async function fetchAllVideos(): Promise<Video[]> {
  const response = await axios.get(`${AGGREGATOR_URL}/v1/videos`);
  return response.data.videos;
}

/**
 * Get Walrus blob URL for thumbnail
 */
export function getThumbnailUrl(blobId: string): string {
  const walrusAggregator = 'https://aggregator.walrus-testnet.walrus.space';
  return `${walrusAggregator}/v1/blobs/${blobId}`;
}

export { suiClient };
