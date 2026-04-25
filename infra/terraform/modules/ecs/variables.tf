variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for ECS tasks"
  type        = list(string)
}

variable "api_target_group_arn" {
  description = "ARN of the API ALB target group"
  type        = string
}

variable "keycloak_target_group_arn" {
  description = "ARN of the Keycloak ALB target group"
  type        = string
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks (created at root level)"
  type        = string
}

variable "api_image" {
  description = "Docker image URI for the API"
  type        = string
}

variable "keycloak_image" {
  description = "Docker image URI for Keycloak"
  type        = string
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
}

variable "ecs_task_memory" {
  description = "Memory in MiB for ECS tasks"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of API tasks"
  type        = number
}

variable "ecs_max_count" {
  description = "Maximum number of API tasks for auto-scaling"
  type        = number
}

variable "db_host" {
  description = "Database host endpoint"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_host" {
  description = "Redis host endpoint"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
}

variable "s3_media_bucket" {
  description = "S3 media bucket name"
  type        = string
}
