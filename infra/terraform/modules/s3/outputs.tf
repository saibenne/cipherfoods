output "media_bucket_name" {
  description = "Name of the media uploads bucket"
  value       = aws_s3_bucket.media.bucket
}

output "media_bucket_arn" {
  description = "ARN of the media uploads bucket"
  value       = aws_s3_bucket.media.arn
}

output "static_assets_bucket_name" {
  description = "Name of the static assets bucket"
  value       = aws_s3_bucket.static_assets.bucket
}

output "static_assets_bucket_arn" {
  description = "ARN of the static assets bucket"
  value       = aws_s3_bucket.static_assets.arn
}

output "static_assets_bucket_regional_domain_name" {
  description = "Regional domain name of the static assets bucket"
  value       = aws_s3_bucket.static_assets.bucket_regional_domain_name
}
