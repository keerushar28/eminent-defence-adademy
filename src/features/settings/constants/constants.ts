import { Monitor, Moon, Sun } from "lucide-react";

export const themes = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
    description: "Clean and bright interface",
  },
  { id: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  {
    id: "system",
    label: "System",
    icon: Monitor,
    description: "Follows your device settings",
  },
];
