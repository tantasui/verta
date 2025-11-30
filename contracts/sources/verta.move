module verta::verta {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;
    use std::vector;
    use sui::event;

    /// Struct representing a video chunk stored on Walrus
    public struct VideoChunk has store, copy, drop {
        blob_id: String,      // Walrus blob ID
        sequence: u64,        // Chunk sequence number (0, 1, 2, ...)
        duration: u64,        // Duration in milliseconds
    }

    /// Main Video object containing all metadata
    public struct Video has key, store {
        id: UID,
        creator: address,
        title: String,
        description: String,
        chunks: vector<VideoChunk>,
        thumbnail_blob_id: String,
        created_at: u64,
        views: u64,
    }

    /// Event emitted when a video is created
    public struct VideoCreated has copy, drop {
        video_id: ID,
        creator: address,
        title: String,
        chunk_count: u64,
    }

    /// Event emitted when views are incremented
    public struct VideoViewed has copy, drop {
        video_id: ID,
        new_view_count: u64,
    }

    /// Create a new video with metadata and chunks
    public entry fun create_video(
        title: String,
        description: String,
        thumbnail_blob_id: String,
        ctx: &mut TxContext
    ) {
        let video_id = object::new(ctx);
        let id_copy = object::uid_to_inner(&video_id);
        let creator = tx_context::sender(ctx);

        let video = Video {
            id: video_id,
            creator,
            title,
            description,
            chunks: vector::empty<VideoChunk>(),
            thumbnail_blob_id,
            created_at: tx_context::epoch(ctx),
            views: 0,
        };

        event::emit(VideoCreated {
            video_id: id_copy,
            creator,
            title: video.title,
            chunk_count: 0,
        });

        transfer::share_object(video);
    }

    /// Add a chunk to an existing video
    public entry fun add_chunk(
        video: &mut Video,
        blob_id: String,
        sequence: u64,
        duration: u64,
        ctx: &mut TxContext
    ) {
        // Only creator can add chunks
        assert!(video.creator == tx_context::sender(ctx), 0);

        let chunk = VideoChunk {
            blob_id,
            sequence,
            duration,
        };

        vector::push_back(&mut video.chunks, chunk);
    }

    /// Increment the view count for a video
    public entry fun increment_views(
        video: &mut Video,
        ctx: &mut TxContext
    ) {
        video.views = video.views + 1;

        event::emit(VideoViewed {
            video_id: object::uid_to_inner(&video.id),
            new_view_count: video.views,
        });
    }

    /// Get video metadata (for off-chain queries)
    public fun get_video_info(video: &Video): (
        address,
        String,
        String,
        String,
        u64,
        u64,
        u64
    ) {
        (
            video.creator,
            video.title,
            video.description,
            video.thumbnail_blob_id,
            vector::length(&video.chunks),
            video.created_at,
            video.views
        )
    }

    /// Get chunk info by index
    public fun get_chunk(video: &Video, index: u64): (String, u64, u64) {
        let chunk = vector::borrow(&video.chunks, index);
        (chunk.blob_id, chunk.sequence, chunk.duration)
    }

    /// Get total number of chunks
    public fun get_chunk_count(video: &Video): u64 {
        vector::length(&video.chunks)
    }
}
