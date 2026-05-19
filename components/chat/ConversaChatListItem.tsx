import React, { memo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ConversaChat } from "../../types/chat";

type Props = {
  conversation: ConversaChat;
  onPress: (conversation: ConversaChat) => void;
};

export const ConversaChatListItem = memo(function ConversaChatListItem({
  conversation,
  onPress,
}: Props) {
  const { otherUserName, petName, lastMessage, lastMessageTime, avatarUrl, hasUnread } =
    conversation;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversa com ${otherUserName} sobre ${petName}`}
      onPress={() => onPress(conversation)}
      style={({ pressed }) => [
        styles.container,
        hasUnread && styles.containerUnread,
        pressed && styles.containerPressed,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.title}>
            {`${otherUserName.toUpperCase()} | ${petName.toUpperCase()}`}
          </Text>

          <Text style={[styles.time, hasUnread && styles.timeUnread]}>{lastMessageTime}</Text>
        </View>

        <Text numberOfLines={1} style={[styles.preview, hasUnread && styles.previewUnread]}>
          {lastMessage}
        </Text>
      </View>

      {hasUnread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 0.8,
    borderBottomColor: "#E6E7E8",
  },
  containerPressed: {
    backgroundColor: "#F2F2F2",
  },
  containerUnread: {
    backgroundColor: "#F4FBF9",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#D9D9D9",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#D9D9D9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Roboto_400Regular",
    flex: 1,
    fontSize: 12,
    color: "#589B9B",
    marginRight: 12,
    fontWeight: "500",

  },
  time: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    color: "#434343",
    fontWeight: "400",
  },
  timeUnread: {
    color: "#589B9B",
    fontFamily: "Roboto_500Medium",
  },
  preview: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#757575",
    fontWeight: "400",
  },
  previewUnread: {
    color: "#434343",
    fontFamily: "Roboto_500Medium",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#88C9BF",
    marginLeft: 12,
  },
});
