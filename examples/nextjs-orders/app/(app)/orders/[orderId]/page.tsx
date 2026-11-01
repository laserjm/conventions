import { notFound } from 'next/navigation';
import { getOrder } from '@/modules/orders/server';
import { OrderCard } from '@/modules/orders/index';

type OrderPageProps = { params: Promise<{ orderId: string }> };

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();
  return <OrderCard order={order} canPay={order.can.pay} tenantId={order.tenantId} />;
}
