import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_reviews' })
export class ProductReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  authorName: string;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  product: Product;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
