import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from "react-native";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Edit2, Trash2, DollarSign, X } from "lucide-react-native";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product: string;
  quantity: number;
  order_value: number;
}

const ITEMS_PER_PAGE = 15;

const HomePage = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrderValue, setTotalOrderValue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatedOrder, setUpdatedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const allOrdersRef = doc(db, "data", "all-orders");
      const allOrdersSnapshot = await getDoc(allOrdersRef);

      if (allOrdersSnapshot.exists()) {
        const data = allOrdersSnapshot.data();
        const ordersData: Order[] = data.orders || [];
        setOrders(ordersData);
        const total = ordersData.reduce(
          (sum, order) => sum + (order.order_value || 0),
          0
        );
        setTotalOrderValue(total);
      } else {
        setOrders([]);
        setTotalOrderValue(0);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const handleUpdateOrder = async (orderToUpdate: Order) => {
    setSelectedOrder(orderToUpdate);
    setUpdatedOrder({ ...orderToUpdate });
    setModalVisible(true);
  };

  const saveUpdatedOrder = async () => {
    if (!updatedOrder || !selectedOrder) return;

    try {
      const allOrdersRef = doc(db, "data", "all-orders");
      const allOrdersSnapshot = await getDoc(allOrdersRef);

      if (allOrdersSnapshot.exists()) {
        const currentOrders = allOrdersSnapshot.data().orders || [];
        const updatedOrders = currentOrders.map((order: Order) =>
          order.id === selectedOrder.id ? updatedOrder : order
        );

        await setDoc(allOrdersRef, { orders: updatedOrders });
        setOrders(updatedOrders);

        const newTotal = updatedOrders.reduce(
          (sum: number, order: Order) => sum + (order.order_value || 0),
          0
        );
        setTotalOrderValue(newTotal);

        Alert.alert("Success", "Order updated successfully");
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order");
    }
  };

  const handleDeleteOrder = async (orderToDelete: Order) => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const deletedOrdersRef = doc(db, "data", "deleted-orders");
            await updateDoc(deletedOrdersRef, {
              orders: arrayUnion({
                ...orderToDelete,
                deletedAt: new Date().toISOString(),
              }),
            });

            const allOrdersRef = doc(db, "data", "all-orders");
            const allOrdersSnapshot = await getDoc(allOrdersRef);

            if (allOrdersSnapshot.exists()) {
              const currentOrders = allOrdersSnapshot.data().orders || [];
              const updatedOrders = currentOrders.filter(
                (order: Order) => order.id !== orderToDelete.id
              );

              await setDoc(allOrdersRef, { orders: updatedOrders });
              setOrders(updatedOrders);
              const newTotal = updatedOrders.reduce(
                (sum: number, order: Order) => sum + (order.order_value || 0),
                0
              );
              setTotalOrderValue(newTotal);

              Alert.alert("Success", "Order deleted successfully");
            }
          } catch (error) {
            console.error("Error deleting order:", error);
            Alert.alert("Error", "Failed to delete order");
          }
        },
      },
    ]);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    return (
      <View className="bg-white p-4 mb-4 rounded-lg shadow-xl border-l-4 border-green-500">
        <View className="flex-row justify-between">
          <View className="flex-1">
            <View className="flex-auto justify-between mb-2">
              <Text className="text-sm font-bold text-gray-800">
                Order id #{item.id}
              </Text>
              <Text className="text-lg font-semibold text-green-600">
                Order value ${item.order_value.toFixed(2)}
              </Text>
            </View>
            <View className="space-y-1">
              <Text className="text-gray-700 font-medium">
                {item.customer_name}
              </Text>
              <Text className="text-gray-600">{item.customer_email}</Text>
              <View className="flex-row justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <Text className="text-blue-600 font-medium">
                  {item.product}
                </Text>
                <Text className="text-gray-600">Quantity: {item.quantity}</Text>
                <View className="flex-row space-x-1">
                  <TouchableOpacity
                    onPress={() => handleUpdateOrder(item)}
                    className="bg-blue-500 p-1.5 rounded-full"
                  >
                    <Edit2 size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteOrder(item)}
                    className="bg-red-500 p-1.5 rounded-full"
                  >
                    <Trash2 size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(query) ||
      order.customer_email?.toLowerCase().includes(query) ||
      order.product?.toLowerCase().includes(query) ||
      order.id?.toLowerCase().includes(query)
    );
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity
          className="flex-row items-center space-x-2"
          onPress={() => router.push("../component/profile")}
        >
          <Text className="text-gray-600 mr-3 text-xl">
            Hi, {user?.firstName}
          </Text>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white font-medium text-lg">
                {user?.firstName?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Orders</Text>
      </View>

      <View className="bg-white rounded-lg p-4 mb-4 shadow-md">
        <View className="flex-row items-center">
          <DollarSign size={24} color="#34D399" />
          <Text className="font-bold text-lg text-gray-700 ml-2">
            Total Order Value:
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800 mt-2">
          ${totalOrderValue.toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={paginatedOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        className="px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
      />

      <View className="flex-row justify-between items-center p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-full ${
            currentPage === 1 ? "bg-gray-300" : "bg-blue-500"
          }`}
        >
          <Text className="text-white">Previous</Text>
        </TouchableOpacity>
        <Text className="text-gray-600">
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-full ${
            currentPage === totalPages ? "bg-gray-300" : "bg-blue-500"
          }`}
        >
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Update Order</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            {updatedOrder && (
              <>
                <TextInput
                  className="border rounded-lg px-4 py-2 mb-3"
                  value={updatedOrder.customer_name}
                  onChangeText={(text) =>
                    setUpdatedOrder({
                      ...updatedOrder,
                      customer_name: text,
                    })
                  }
                  placeholder="Customer Name"
                />
                <TextInput
                  className="border rounded-lg px-4 py-2 mb-3"
                  value={updatedOrder.customer_email}
                  onChangeText={(text) =>
                    setUpdatedOrder({
                      ...updatedOrder,
                      customer_email: text,
                    })
                  }
                  placeholder="Customer Email"
                />
                <TextInput
                  className="border rounded-lg px-4 py-2 mb-3"
                  value={updatedOrder.product}
                  onChangeText={(text) =>
                    setUpdatedOrder({
                      ...updatedOrder,
                      product: text,
                    })
                  }
                  placeholder="Product"
                />
                <TextInput
                  className="border rounded-lg px-4 py-2 mb-3"
                  value={updatedOrder.quantity.toString()}
                  onChangeText={(text) =>
                    setUpdatedOrder({
                      ...updatedOrder,
                      quantity: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="Quantity"
                />
                <TextInput
                  className="border rounded-lg px-4 py-2 mb-4"
                  value={updatedOrder.order_value.toString()}
                  onChangeText={(text) =>
                    setUpdatedOrder({
                      ...updatedOrder,
                      order_value: parseFloat(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="Order Value"
                />
                <View className="flex-row justify-end space-x-3">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="bg-gray-300 px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveUpdatedOrder}
                    className="bg-blue-500 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomePage;
