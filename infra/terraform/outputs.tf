# ------------------------------------------------------------------------------
# Root Outputs
# ------------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.redis_endpoint
}

output "ecr_api_repository_url" {
  description = "ECR repository URL for the API image"
  value       = module.ecr.api_repository_url
}

output "ecr_keycloak_repository_url" {
  description = "ECR repository URL for the Keycloak image"
  value       = module.ecr.keycloak_repository_url
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_domain_name
}

output "media_bucket_name" {
  description = "S3 bucket for media uploads"
  value       = module.s3.media_bucket_name
}

output "static_assets_bucket_name" {
  description = "S3 bucket for static assets"
  value       = module.s3.static_assets_bucket_name
}
