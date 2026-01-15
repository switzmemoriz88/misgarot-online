import { useState, useEffect, useCallback } from 'react';
import { ordersService, type Order, type OrderItem } from '../lib/supabase';

/**
 * useOrders Hook
 * ---------------
 * ניהול הזמנות
 */

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
}

export const useOrders = (pageSize = 20) => {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 0,
    total: 0,
  });

  // Load orders
  const loadOrders = useCallback(async (page = 1) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await ordersService.getMyOrders(page, pageSize);

    setState({
      orders: response.data,
      loading: false,
      error: null,
      page: response.page,
      totalPages: response.totalPages,
      total: response.count,
    });
  }, [pageSize]);

  // Load on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Create order
  const createOrder = useCallback(async (orderData: {
    design_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    notes?: string;
    items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
  }) => {
    setState((prev) => ({ ...prev, loading: true }));

    const { data, error } = await ordersService.create(orderData);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return null;
    }

    // Reload orders
    await loadOrders();
    return data;
  }, [loadOrders]);

  // Get order by ID
  const getOrder = useCallback(async (id: string) => {
    return await ordersService.getById(id);
  }, []);

  // Get order by number
  const getOrderByNumber = useCallback(async (orderNumber: string) => {
    return await ordersService.getByOrderNumber(orderNumber);
  }, []);

  // Update status
  const updateStatus = useCallback(async (id: string, status: Order['status']) => {
    const { data, error } = await ordersService.updateStatus(id, status);

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    }

    // Update local state
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));

    return data;
  }, []);

  // Cancel order
  const cancelOrder = useCallback(async (id: string) => {
    return await updateStatus(id, 'cancelled');
  }, [updateStatus]);

  // Go to page
  const goToPage = useCallback((page: number) => {
    loadOrders(page);
  }, [loadOrders]);

  // Refresh
  const refresh = useCallback(() => {
    loadOrders(state.page);
  }, [loadOrders, state.page]);

  return {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    page: state.page,
    totalPages: state.totalPages,
    total: state.total,
    hasNextPage: state.page < state.totalPages,
    hasPrevPage: state.page > 1,
    createOrder,
    getOrder,
    getOrderByNumber,
    updateStatus,
    cancelOrder,
    goToPage,
    nextPage: () => goToPage(state.page + 1),
    prevPage: () => goToPage(state.page - 1),
    refresh,
  };
};
