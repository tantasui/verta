-- Add Walrus blob ID fields to dramas table

ALTER TABLE dramas
ADD COLUMN IF NOT EXISTS walrus_blob_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS walrus_blob_object_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS walrus_thumbnail_blob_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS walrus_end_epoch INTEGER;

-- Create index on blob IDs for faster lookups
CREATE INDEX IF NOT EXISTS idx_dramas_walrus_blob_id ON dramas(walrus_blob_id);
CREATE INDEX IF NOT EXISTS idx_dramas_walrus_thumbnail_blob_id ON dramas(walrus_thumbnail_blob_id);

-- Add comment for documentation
COMMENT ON COLUMN dramas.walrus_blob_id IS 'Walrus blob ID for the video file';
COMMENT ON COLUMN dramas.walrus_blob_object_id IS 'Sui blob object ID from Walrus';
COMMENT ON COLUMN dramas.walrus_thumbnail_blob_id IS 'Walrus blob ID for the thumbnail image';
COMMENT ON COLUMN dramas.walrus_end_epoch IS 'Walrus storage end epoch';
