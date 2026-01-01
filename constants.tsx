import React from 'react';
import { 
  Gamepad2, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart,
  LayoutGrid, // New
  List // New
} from 'lucide-react';

export const Icons = {
  Logo: Gamepad2,
  Users: Users,
  Logout: LogOut,
  Add: Plus,
  Search: Search,
  Edit: Edit,
  Delete: Trash2,
  Export: Download,
  Prev: ChevronLeft,
  Next: ChevronRight,
  User: UserIcon,
  Admin: Shield,
  View: Eye,
  Warning: AlertTriangle,
  Success: CheckCircle,
  Error: XCircle,
  Chart: BarChart,
  Grid: LayoutGrid, // New
  List: List // New
};

export const ITEMS_PER_PAGE = 5;