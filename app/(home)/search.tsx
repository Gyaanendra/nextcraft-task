import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Search as SearchIcon, Edit2, Trash2 } from "lucide-react-native";

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
          <View className="flex-auto justify-between  mb-2">
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
    </SafeAreaView>
  );
}
