import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import RatingStars from "../../components/RatingStars";
import * as FileSystem from "expo-file-system";
import styles from "../../assets/styles/create.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore.js";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../constants/api.js";

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null); //Base64 is a way to turn images into text so they can be easily sent over the internet. It's like translating a picture into words that computers can send in messages.
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();
  console.log(token);

  const pickImage = async () => {
    try {
      //request permission if needed
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync(); //Asks the user to grant permissions for accessing user's photo. This method does nothing on web.

        if (status != "granted") {
          Alert.alert(
            "Permission Denied",
            "We need camera roll permission to upload an image"
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled) {
        // console.log("result is here", result);
        setImage(result.assets[0].uri); //this is for showing the image in the UI

        //if base64 is provided, then use it
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64); //this is to upload the image into base64 format to the api and db
        } else {
          // otherwise, convert it into base64
          const base64 = await FileSystem.readAsStringAsync(
            result.assets[0].uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.log("Error picking an image", error);
      Alert.alert("Error", "There was a problem");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill all the fields");
      return;
    }
    try {
      setLoading(true);
      //get the file extension from URI or default to jpeg
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const imageType = fileType
        ? `image/${fileType.toLowerCase()}`
        : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          caption,
          rating: rating.toString(),
          image: imageDataUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recomendation has been posted");
      setTitle("");
      setCaption("");
      setImage(null);
      setImageBase64(null);
      setRating(3);
      router.push("/");
    } catch (error) {
      console.error("Something went wrong, while creating the post");
      Alert.alert("Error", error.message || "Post cannot be created");
    } finally {
      setLoading(false);
    }
  };

  // <RatingStars rating={rating} onRate={setRating} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scrollViewStyle}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recomendation</Text>
            <Text style={styles.subtitle}>
              Share your favorite read with others
            </Text>
          </View>

          {/* Book title */}
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Your Rating</Text>
            <RatingStars rating={rating} onRate={setRating} />
          </View>

          {/* Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Book Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.placeholderText}>
                    Tap to select image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Write your review or thoughts about this book..."
              value={caption}
              onChangeText={setCaption}
              multiline
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={COLORS.white}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
