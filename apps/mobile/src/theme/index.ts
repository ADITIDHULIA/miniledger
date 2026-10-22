export const colors = {
  background: "#F5F8F6",
  card: "#FFFFFF",
  navy: "#0B1F3A",
  muted: "#5B6B7F",
  border: "#E2E8F0",
  green: "#16A34A",
  greenDark: "#0F7A37",
  greenSoft: "#E6F6EC",
  red: "#DC2626",
  redSoft: "#FDECEC",
  orange: "#EA580C",
  orangeSoft: "#FFF1E6",
  blueSoft: "#EAF0FA",
  white: "#FFFFFF",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fonts = {
  title: { fontSize: 26, fontWeight: "700" as const, color: colors.navy },
  heading: { fontSize: 18, fontWeight: "700" as const, color: colors.navy },
  body: { fontSize: 15, color: colors.navy },
  caption: { fontSize: 13, color: colors.muted },
};
