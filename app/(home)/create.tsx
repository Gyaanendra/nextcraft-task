import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import UUID from "react-native-uuid";
import { db } from "../../config/firebase";
import { PRODUCTS } from "../../data/products";

interface FormData {
  customer_name: string;
  customer_email: string;
  product: string;
  quantity: string;
}

interface Errors {
  customer_name?: string;
  customer_email?: string;
  quantity?: string;
}

export default function CreateOrder() {
  const [formData, setFormData] = useState<FormData>({
    customer_name: "",
    customer_email: "",
    product: "1",
    quantity: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Name is required";
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = "Email is required";
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = "Invalid email format";
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = "Quantity is required";
    } else if (
      isNaN(Number(formData.quantity)) ||
      parseInt(formData.quantity) <= 0
    ) {
      newErrors.quantity = "Quantity must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateOrderValue = (): number => {
    const product = PRODUCTS.find((p) => p.id.toString() === formData.product);
    return product ? product.price * parseInt(formData.quantity || "0") : 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const product = PRODUCTS.find(
        (p) => p.id.toString() === formData.product
      );
      const orderValue = calculateOrderValue();
      const orderId = UUID.v4(); // Generate a unique ID for the order

      const allOrdersRef = doc(db, "data", "all-orders"); // Reference to the "all-orders" document

      await updateDoc(allOrdersRef, {
        orders: arrayUnion({
          id: orderId,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          product: formData.product,
          product_name: product?.name,
          quantity: parseInt(formData.quantity),
          order_value: orderValue,
          //  createdAt: new Date().toISOString(),
        }),
      });

      Alert.alert("Success", "Order created successfully!");
      setFormData({
        customer_name: "",
        customer_email: "",
        product: "1",
        quantity: "",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Error", "Failed to create order");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-white p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Create New Order
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-1">Customer Name</Text>
            <TextInput
              className={`border rounded-lg p-4 ${
                errors.customer_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter customer name"
              value={formData.customer_name}
              onChangeText={(text) =>
                setFormData({ ...formData, customer_name: text })
              }
            />
            {errors.customer_name && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.customer_name}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-gray-600 mb-1">Customer Email</Text>
            <TextInput
              className={`border rounded-lg p-4 ${
                errors.customer_email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter customer email"
              value={formData.customer_email}
              onChangeText={(text) =>
                setFormData({ ...formData, customer_email: text })
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.customer_email && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.customer_email}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-gray-600 mb-1">Product</Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={formData.product}
                onValueChange={(itemValue: any) =>
                  setFormData({ ...formData, product: itemValue })
                }
              >
                {PRODUCTS.map((product: any) => (
                  <Picker.Item
                    key={product.id}
                    label={`${product.name} - $${product.price}`}
                    value={product.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View>
            <Text className="text-gray-600 mb-1">Quantity</Text>
            <TextInput
              className={`border rounded-lg p-4 ${
                errors.quantity ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter quantity"
              value={formData.quantity}
              onChangeText={(text) =>
                setFormData({ ...formData, quantity: text })
              }
              keyboardType="numeric"
            />
            {errors.quantity && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.quantity}
              </Text>
            )}
          </View>
        </View>

        <View className="mt-6">
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-lg"
            onPress={handleCreateOrder}
          >
            <Text className="text-white text-center font-bold">
              Create Order
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
