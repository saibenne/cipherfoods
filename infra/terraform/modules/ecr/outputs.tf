output "api_repository_url" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "keycloak_repository_url" {
  description = "URL of the Keycloak ECR repository"
  value       = aws_ecr_repository.keycloak.repository_url
}

output "api_repository_arn" {
  description = "ARN of the API ECR repository"
  value       = aws_ecr_repository.api.arn
}

output "keycloak_repository_arn" {
  description = "ARN of the Keycloak ECR repository"
  value       = aws_ecr_repository.keycloak.arn
}
