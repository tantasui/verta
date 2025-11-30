import { SuiClient } from '@mysten/sui/client';

const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID || '';

export interface VideoChunk {
  blob_id: string;
  sequence: number;
  duration: number;
}

export interface VideoMetadata {
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

// In-memory metadata cache
const metadataCache = new Map<string, VideoMetadata>();

/**
 * Fetch video metadata from Sui blockchain
 */
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  // Check cache first
  if (metadataCache.has(videoId)) {
    return metadataCache.get(videoId)!;
  }

  try {
    // Fetch video object from Sui
    const videoObject = await suiClient.getObject({
      id: videoId,
      options: {
        showContent: true
      }
    });

    if (!videoObject.data || !videoObject.data.content) {
      throw new Error('Video not found');
    }

    const content = videoObject.data.content as any;
    if (content.dataType !== 'moveObject') {
      throw new Error('Invalid video object');
    }

    const fields = content.fields;

    // Parse chunks from Sui object
    const chunks: VideoChunk[] = fields.chunks.map((chunk: any) => ({
      blob_id: chunk.blob_id,
      sequence: Number(chunk.sequence),
      duration: Number(chunk.duration)
    }));

    const metadata: VideoMetadata = {
      id: videoId,
      creator: fields.creator,
      title: fields.title,
      description: fields.description,
      chunks,
      thumbnail_blob_id: fields.thumbnail_blob_id,
      created_at: Number(fields.created_at),
      views: Number(fields.views)
    };

    // Cache the metadata
    metadataCache.set(videoId, metadata);

    return metadata;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw error;
  }
}

/**
 * Fetch all videos (for feed)
 */
export async function fetchAllVideos(): Promise<VideoMetadata[]> {
  try {
    // Query all Video objects
    const response = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::verta::VideoCreated`
      },
      order: 'descending'
    });

    const videoIds: string[] = [];

    // Extract video IDs from events
    for (const event of response.data) {
      const parsedJson = event.parsedJson as any;
      if (parsedJson && parsedJson.video_id) {
        videoIds.push(parsedJson.video_id);
      }
    }

    // Fetch metadata for each video
    const videos: VideoMetadata[] = [];
    for (const videoId of videoIds) {
      try {
        const metadata = await fetchVideoMetadata(videoId);
        videos.push(metadata);
      } catch (error) {
        console.error(`Failed to fetch video ${videoId}:`, error);
      }
    }

    return videos;
  } catch (error) {
    console.error('Error fetching all videos:', error);
    return [];
  }
}

/**
 * Increment view count for a video
 */
export async function incrementViews(videoId: string): Promise<void> {
  // Invalidate cache so next fetch gets updated view count
  metadataCache.delete(videoId);
}
