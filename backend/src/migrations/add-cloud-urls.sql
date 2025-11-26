-- إضافة حقول Wasabi Cloud URLs
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS cloud_video_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cloud_audio_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cloud_thumbnail_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cloud_hls_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_uploaded_to_cloud BOOLEAN DEFAULT FALSE;

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_content_cloud_status ON content(is_uploaded_to_cloud);
CREATE INDEX IF NOT EXISTS idx_content_processed ON content(is_processed);

-- تعليق توضيحي
COMMENT ON COLUMN content.cloud_video_url IS 'Wasabi S3 URL for video file';
COMMENT ON COLUMN content.cloud_audio_url IS 'Wasabi S3 URL for audio HLS';
COMMENT ON COLUMN content.cloud_thumbnail_url IS 'Wasabi S3 URL for thumbnail';
COMMENT ON COLUMN content.cloud_hls_url IS 'Wasabi S3 URL for HLS master playlist';
COMMENT ON COLUMN content.is_uploaded_to_cloud IS 'Whether content has been uploaded to Wasabi';
