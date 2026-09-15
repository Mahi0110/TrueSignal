import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "@/constants/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
export type CircleNode = {
  key: string;
  label: string;
  selected?: boolean;
  count?: number;
};
export default function InterestCircle({
  nodes,
  center,
  caption,
  onSelect,
  onCenter,
  category = false,
}: {
  nodes: CircleNode[];
  center: string;
  caption: string;
  onSelect: (key: string) => void;
  onCenter?: () => void;
  category?: boolean;
}) {
  const [size, setSize] = useState(340);
  const fade = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const signature = nodes.map((x) => x.key).join("|");
  useEffect(() => {
    fade.setValue(reduced ? 1 : 0);
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: reduced ? 0 : 260,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [signature, reduced, fade]);
  const compact = size < 320;
  const nodeWidth = category ? (compact ? 64 : 76) : compact ? 76 : 86;
  const nodeHeight = compact ? 68 : 74;
  const radius = Math.min(
    size * 0.365,
    size / 2 - Math.max(nodeWidth, nodeHeight) / 2 - 4,
  );
  const centerSize = compact ? 84 : 102;
  return (
    <View
      onLayout={(e) => setSize(e.nativeEvent.layout.width)}
      style={s.container}
    >
      <View
        pointerEvents="none"
        style={[
          s.ring,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            left: size / 2 - radius,
            top: size / 2 - radius,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          s.ring,
          {
            width: radius * 1.35,
            height: radius * 1.35,
            borderRadius: radius,
            left: size / 2 - radius * 0.675,
            top: size / 2 - radius * 0.675,
            borderStyle: "dashed",
            opacity: 0.5,
          },
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fade,
            transform: [
              {
                scale: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        {nodes.map((n, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = size / 2 + Math.cos(angle) * radius,
            y = size / 2 + Math.sin(angle) * radius;
          return (
            <View key={n.key}>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: radius,
                  height: 1,
                  left: (size / 2 + x) / 2 - radius / 2,
                  top: (size / 2 + y) / 2,
                  backgroundColor: n.selected ? "#A78BE9" : "#E5DCF4",
                  transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
                }}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  category
                    ? `Open ${n.label} niches`
                    : `${n.selected ? "Remove" : "Select"} ${n.label}`
                }
                accessibilityState={{ selected: !!n.selected }}
                activeOpacity={0.8}
                onPress={() => onSelect(n.key)}
                style={[
                  s.node,
                  {
                    left: x - nodeWidth / 2,
                    top: y - nodeHeight / 2,
                    width: nodeWidth,
                    height: nodeHeight,
                  },
                ]}
              >
                <View
                  style={[
                    s.dot,
                    n.selected && s.dotSelected,
                    category && s.categoryDot,
                  ]}
                >
                  <Text style={[s.symbol, n.selected && { color: "#FFF" }]}>
                    {n.selected
                      ? "✓"
                      : category
                        ? n.label.slice(0, 2).toUpperCase()
                        : "+"}
                  </Text>
                  {!!n.count && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{n.count}</Text>
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    s.label,
                    n.selected && { color: colors.signal, fontWeight: "900" },
                  ]}
                >
                  {n.label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </Animated.View>
      <TouchableOpacity
        accessibilityRole={onCenter ? "button" : "text"}
        accessibilityLabel={onCenter ? "Back to categories" : center}
        disabled={!onCenter}
        onPress={onCenter}
        style={[
          s.center,
          {
            width: centerSize,
            height: centerSize,
            left: (size - centerSize) / 2,
            top: (size - centerSize) / 2,
            padding: compact ? 6 : 12,
          },
        ]}
      >
        <Text style={[s.centerLabel, compact && { fontSize: 12 }]}>
          {center}
        </Text>
        <Text style={[s.caption, compact && { fontSize: 9 }]}>{caption}</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 550,
    alignSelf: "center",
  },
  ring: { position: "absolute", borderWidth: 1, borderColor: "#DBCCF3" },
  node: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1EAFE",
    borderWidth: 1,
    borderColor: "#D8C5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryDot: { width: 43, height: 43, borderRadius: 17 },
  dotSelected: { backgroundColor: colors.signal, borderColor: colors.signal },
  symbol: { fontSize: 15, fontWeight: "900", color: colors.signal },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    color: colors.text,
    marginTop: 4,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    right: -7,
    top: -5,
    borderRadius: 9,
    backgroundColor: colors.orange,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: "900" },
  center: {
    position: "absolute",
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 5,
    borderColor: "#F4EEFC",
  },
  centerLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  caption: {
    color: "#CFB9FD",
    fontSize: 10,
    lineHeight: 13,
    marginTop: 5,
    textAlign: "center",
  },
});
