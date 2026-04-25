terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "cipherfoods-terraform-state"
    key            = "infra/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "cipherfoods-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CipherFoods"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ------------------------------------------------------------------------------
# Data Sources
# ------------------------------------------------------------------------------

data "aws_availability_zones" "available" {
  state = "available"
}

# ------------------------------------------------------------------------------
# Modules
# ------------------------------------------------------------------------------

module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
}

# ECS security group lives at root level to break the circular dependency
# between ECS (needs RDS/ElastiCache endpoints) and RDS/ElastiCache (need ECS SG).
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-${var.environment}-ecs-"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "API port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [module.alb.alb_security_group_id]
  }

  ingress {
    description     = "Keycloak port from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [module.alb.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

module "rds" {
  source = "./modules/rds"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_instance_class = var.db_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  ecs_security_group_id = aws_security_group.ecs_tasks.id
}

module "elasticache" {
  source = "./modules/elasticache"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  redis_node_type     = var.redis_node_type
  ecs_security_group_id = aws_security_group.ecs_tasks.id
}

module "ecs" {
  source = "./modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  # ALB target groups
  api_target_group_arn      = module.alb.api_target_group_arn
  keycloak_target_group_arn = module.alb.keycloak_target_group_arn
  ecs_security_group_id     = aws_security_group.ecs_tasks.id

  # Container images
  api_image      = "${module.ecr.api_repository_url}:latest"
  keycloak_image = "${module.ecr.keycloak_repository_url}:latest"

  # Task sizing
  ecs_task_cpu     = var.ecs_task_cpu
  ecs_task_memory  = var.ecs_task_memory
  ecs_desired_count = var.ecs_desired_count
  ecs_max_count    = var.ecs_max_count

  # App configuration
  db_host       = module.rds.db_endpoint
  db_port       = module.rds.db_port
  db_name       = var.db_name
  db_username   = var.db_username
  db_password   = var.db_password
  redis_host    = module.elasticache.redis_endpoint
  redis_port    = module.elasticache.redis_port
  s3_media_bucket = module.s3.media_bucket_name
}

module "cdn" {
  source = "./modules/cdn"

  project_name             = var.project_name
  environment              = var.environment
  static_assets_bucket_arn           = module.s3.static_assets_bucket_arn
  static_assets_bucket_domain_name   = module.s3.static_assets_bucket_regional_domain_name
  alb_dns_name             = module.alb.alb_dns_name
  domain_name              = var.domain_name
  certificate_arn          = var.certificate_arn
}
