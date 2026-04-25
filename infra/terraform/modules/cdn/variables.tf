variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "static_assets_bucket_arn" {
  description = "ARN of the static assets S3 bucket"
  type        = string
}

variable "static_assets_bucket_domain_name" {
  description = "Regional domain name of the static assets bucket"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for the distribution"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate (must be in us-east-1 for CloudFront)"
  type        = string
  default     = ""
}
