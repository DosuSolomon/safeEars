import {
  Wind,
  CloudRain,
  Users,
  Leaf,
  Briefcase,
  Sparkles,
  MessageCircle,
  Hand,
  BookOpen,
  HelpCircle,
  Phone,
  Heart,
  Star,
  ShieldCheck,
  Moon,
} from "lucide-react";

const map = {
  Wind,
  CloudRain,
  Users,
  Leaf,
  Briefcase,
  Sparkles,
  MessageCircle,
  Hand,
  BookOpen,
  HelpCircle,
  Phone,
  Heart,
  Star,
  ShieldCheck,
  Moon,
};

export function getIcon(name) {
  return map[name] || Heart;
}
