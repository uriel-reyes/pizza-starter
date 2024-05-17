import React from 'react';
import PizzaItem from './PizzaItem';
import './OrderItem.css';

interface Pizza {
  id: string;
  productName: string;
  ingredients: string[];
}

interface Order {
  id: string;
  lineItems: Pizza[];
}

interface OrderItemProps {
  order: Order;
  isActive: boolean; // new prop to indicate if the item is active
}

const OrderItem: React.FC<OrderItemProps> = ({ order, isActive }) => {
  const activeClass = isActive ? 'active' : '';
  return (
    <div className={`order-container ${activeClass}`}>
      <h2>Order ID: {order.id}</h2>
      {order.lineItems.map((pizza, index) => (
        <PizzaItem key={index} pizza={pizza} />
      ))}
    </div>
  );
};

export default OrderItem;
