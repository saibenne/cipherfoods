# CipherFoods — Terraform Infrastructure

## Planned Modules

Infrastructure will be built incrementally as the application matures:

### Phase 1 (MVP)
- **VPC** — Public/private subnets in ap-south-1
- **ECS Fargate** — API service (2 tasks, auto-scale to 6)
- **RDS PostgreSQL 16** — db.t3.medium, single-AZ for dev, multi-AZ for prod
- **ElastiCache Redis 7** — cache.t3.medium for sessions/cache/queues
- **ALB** — Application Load Balancer with WAF
- **ECR** — Container registry for API image
- **CloudFront** — CDN for static assets
- **S3** — Terraform state, backups

### Phase 2
- **ECS Service** — Keycloak (can share ECS cluster)
- **Route53** — DNS management
- **ACM** — SSL/TLS certificates
- **SES** — Transactional email
- **SNS** — SMS notifications

### Phase 3
- **CloudWatch** — Alarms and dashboards
- **Secrets Manager** — API keys, DB credentials rotation
- **Backup** — Automated RDS/Redis snapshots

## Usage

```bash
cd infra/terraform
terraform init
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```
