import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductReview } from './product-review.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 0 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('json', { nullable: true })
  specifications?: Array<{ label: string; value: string }>;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  featured: boolean;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  category?: Category;

  @OneToMany(() => ProductReview, (review) => review.product, { cascade: true })
  reviews: ProductReview[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
