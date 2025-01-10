import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, DollarSign, Package } from "lucide-react-native";

interface DeletedOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  product: string;
  quantity: number;
  order_value: number;
  deletedAt: string;
}

const ITEMS_PER_PAGE = 20;

export default function DeletedOrdersPage() {
  const { isLoaded } = useAuth();
  const [deletedOrders, setDeletedOrders] = useState<DeletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDeletedValue, setTotalDeletedValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchDeletedOrders = useCallback(async () => {
    try {
      const deletedOrdersRef = doc(db, "data", "deleted-orders");
      const deletedOrdersSnapshot = await getDoc(deletedOrdersRef);

      if (deletedOrdersSnapshot.exists()) {
        const data = deletedOrdersSnapshot.data();
        const orders = data.orders || [];
        const sortedOrders = orders.sort(
          (a: DeletedOrder, b: DeletedOrder) =>
            new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        );
        setDeletedOrders(sortedOrders);

        const total = orders.reduce(
          (sum: number, order: DeletedOrder) => sum + (order.order_value || 0),
          0
        );
        setTotalDeletedValue(total);
      } else {
        setDeletedOrders([]);
        setTotalDeletedValue(0);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching deleted orders:", error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedOrders();
    const intervalId = setInterval(fetchDeletedOrders, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDeletedOrders]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  const renderDeletedOrder = ({ item }: { item: DeletedOrder }) => {
    const {
      id,
      customer_name,
      customer_email,
      product,
      quantity,
      order_value,
      deletedAt,
    } = item;

    return (
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="bg-white p-4 mb-4 rounded-lg shadow-md"
      >
        <View className="border-l-4 border-red-500 pl-3">
          <Text className="font-bold text-lg text-gray-800">
            Order #{id || "N/A"}
          </Text>
          <Text className="text-gray-600 mt-2">
            Customer: {customer_name || "Unknown"}
          </Text>
          <Text className="text-gray-600">
            Email: {customer_email || "Unknown"}
          </Text>
          <Text className="text-gray-600">Product: {product || "Unknown"}</Text>
          <Text className="text-gray-600">Quantity: {quantity || 0}</Text>
          <Text className="font-semibold text-red-600 mt-2">
            Order Value: ${order_value?.toFixed(2) || "0.00"}
          </Text>
          <Text className="text-gray-400 text-sm mt-2">
            Deleted: {formatDate(deletedAt)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeletedOrders();
  }, [fetchDeletedOrders]);

  if (!isLoaded || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  const totalPages = Math.ceil(deletedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = deletedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Deleted Orders</Text>
        <TouchableOpacity
          onPress={() => router.push("/(home)/home")}
          className="bg-gray-100 p-2 rounded-full"
        >
          <ArrowLeft size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <View className="px-6 py-4 bg-gray-200 shadow-slate-900 mb-4 rounded-xl">
        <View className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-black text-lg mb-2">
                Total Deleted Value
              </Text>
              <Text className="text-black text-3xl font-bold">
                ${totalDeletedValue.toFixed(2)}
              </Text>
            </View>
            <DollarSign size={48} color="black" opacity={0.8} />
          </View>
          <View className="flex-row items-center mt-4">
            <Text className="text-black text-base ml-2">
              Total Orders: {deletedOrders.length}
            </Text>
          </View>
        </View>
      </View>

      {deletedOrders.length > 0 ? (
        <>
          <FlatList
            data={paginatedOrders}
            renderItem={renderDeletedOrder}
            keyExtractor={(item) => item.id}
            className="px-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#EF4444"
              />
            }
          />

          <View className="flex-row justify-between items-center p-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full ${
                currentPage === 1 ? "bg-gray-300" : "bg-red-500"
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
                currentPage === totalPages ? "bg-gray-300" : "bg-red-500"
              }`}
            >
              <Text className="text-white">Next</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 text-lg mb-4">
            No deleted orders found.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(home)/home")}
            className="bg-red-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">View Active Orders</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
