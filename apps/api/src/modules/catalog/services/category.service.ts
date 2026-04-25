import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: TreeRepository<Category>,
  ) {}

  async create(data: Partial<Category>): Promise<Category> {
    const slug = this.generateSlug(data.name!);

    const category = this.categoryRepo.create({
      ...data,
      slug,
    });

    if (data.parentId) {
      const parent = await this.categoryRepo.findOneBy({ id: data.parentId });
      if (!parent) {
        throw new NotFoundException(`Parent category not found`);
      }
      category.parent = parent;
    }

    return this.categoryRepo.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.findTrees();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    return category;
  }

  async findRoots(): Promise<Category[]> {
    return this.categoryRepo.findRoots();
  }

  async findDescendants(id: string): Promise<Category> {
    const parent = await this.findById(id);
    return this.categoryRepo.findDescendantsTree(parent);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, data);

    if (data.name) {
      category.slug = this.generateSlug(data.name);
    }

    return this.categoryRepo.save(category);
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
