import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  customerEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  customerPhone: string | null;

  @Column({ default: 'pending' })
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('text')
  shippingAddress: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
