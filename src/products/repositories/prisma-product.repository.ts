import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../interfaces/product.interface';
import { ProductRepository } from './product.repository';

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<Product[]> {
    return await this.prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: number): Promise<Product | null> {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    return await this.prisma.product.create({
      data: dto,
    });
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product | null> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return null;
    }

    return await this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
