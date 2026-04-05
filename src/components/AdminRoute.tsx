import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();

  // 1. انتظر حتى يتم تحميل بيانات المستخدم من Clerk
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  // 2. التحقق من البريد الإلكتروني (استبدل الإيميل بإيميلك الشخصي في Clerk)
  const isAdmin = user?.primaryEmailAddress?.emailAddress === "khaledeyad310@gmail.com";

  if (!isAdmin) {
    // إذا حاول أي شخص آخر الدخول، سيتم تحويله فوراً للصفحة الرئيسية
    return <Navigate to="/" replace />;
  }

  // 3. إذا كنت أنت الأدمن، سيتم عرض الصفحة
  return <>{children}</>;
};