-- Create drama_chunks table for Quilt-based video chunking

CREATE TABLE IF NOT EXISTS drama_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drama_id UUID REFERENCES dramas(id) ON DELETE CASCADE,
  quilt_id VARCHAR(255) NOT NULL,
  quilt_patch_id VARCHAR(255) NOT NULL UNIQUE,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  start_time FLOAT,
  end_time FLOAT,
  duration FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drama_id, chunk_index)
);

-- Create indexes for fast chunk lookups
CREATE INDEX IF NOT EXISTS idx_drama_chunks_drama_id ON drama_chunks(drama_id);
CREATE INDEX IF NOT EXISTS idx_drama_chunks_quilt_patch_id ON drama_chunks(quilt_patch_id);
CREATE INDEX IF NOT EXISTS idx_drama_chunks_chunk_index ON drama_chunks(drama_id, chunk_index);

-- Add comment for documentation
COMMENT ON TABLE drama_chunks IS 'Stores video chunk metadata for Quilt-based chunked videos';
COMMENT ON COLUMN drama_chunks.quilt_id IS 'Walrus quilt ID (same for all chunks of a video)';
COMMENT ON COLUMN drama_chunks.quilt_patch_id IS 'Unique Walrus quilt patch ID for this chunk';
COMMENT ON COLUMN drama_chunks.chunk_index IS 'Sequential index of this chunk (0, 1, 2, ...)';
COMMENT ON COLUMN drama_chunks.chunk_size IS 'Size of this chunk in bytes';
COMMENT ON COLUMN drama_chunks.start_time IS 'Start time of this chunk in the video (seconds)';
COMMENT ON COLUMN drama_chunks.end_time IS 'End time of this chunk in the video (seconds)';
COMMENT ON COLUMN drama_chunks.duration IS 'Duration of this chunk (seconds)';
