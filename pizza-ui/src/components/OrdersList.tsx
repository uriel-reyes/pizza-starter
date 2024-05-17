import React, { useState, useEffect } from 'react';
import OrderItem from './OrderItem';

interface Order {
  id: string;
  lineItems: any[];
}

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0); // new state for active order

  useEffect(() => {
    fetch('http://localhost:3001/orders')  // Adjust this URL to where your backend is hosted
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error('Error fetching orders:', error));

    // Handle keyboard events for navigation and actions
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          setActiveOrderIndex(prev => Math.max(prev - 1, 0)); // Move selection up
          break;
        case 'ArrowDown':
          setActiveOrderIndex(prev => Math.min(prev + 1, orders.length - 1)); // Move selection down
          break;
        case 'Enter':
          modifyOrderStatus(orders[activeOrderIndex].id); // Modify the status of the selected order
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [orders.length, activeOrderIndex]);  // Dependencies include orders.length and activeOrderIndex

  // Function to modify the order status
  const modifyOrderStatus = (orderId: string) => {
    fetch(`http://localhost:3001/orders/${orderId}/modify`, {
      method: 'POST',  // Assume POST method to modify the order status
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Completed' })  // Example status update
    }).then(() => {
      // Remove the order from the list upon successful status update
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      setActiveOrderIndex(prev => Math.max(prev - 1, 0));  // Adjust active index if needed
    }).catch(error => console.error('Error modifying order status:', error));
  };

  return (
    <div>
      {orders.map((order, index) => (
        <OrderItem key={order.id} order={order} isActive={index === activeOrderIndex} />
      ))}
    </div>
  );
};

export default OrdersList;
