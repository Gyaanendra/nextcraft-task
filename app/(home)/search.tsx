import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search as SearchIcon, Edit2, Trash2, X } from "lucide-react-native";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product: string;
  quantity: number;
  order_value: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatedOrder, setUpdatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const allOrdersRef = doc(db, "data", "all-orders");
      const allOrdersSnapshot = await getDoc(allOrdersRef);

      if (allOrdersSnapshot.exists()) {
        const data = allOrdersSnapshot.data();
        setOrders(data.orders || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

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

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(query) ||
      order.customer_email?.toLowerCase().includes(query) ||
      order.product?.toLowerCase().includes(query) ||
      order.id?.toLowerCase().includes(query)
    );
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="bg-white p-4 mb-4 rounded-lg shadow-xl border-l-4 border-blue-500">
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
              <Text className="text-blue-600 font-medium">{item.product}</Text>
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0096FF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-lg">
          <SearchIcon size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        className="px-4"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-gray-500 text-lg">
              {searchQuery ? "No results found" : "Start searching..."}
            </Text>
          </View>
        }
      />

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
}
