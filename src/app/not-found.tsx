import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return <div className="admin-login-page"><header className="admin-public-header container"><Logo/></header><main className="empty-state" style={{ maxWidth: 600, width: "calc(100% - 36px)", margin: "70px auto", background: "white", padding: "50px 25px" }}><span><MapPin size={36}/></span><h3>المكان ده مش في الدليل!</h3><p>الصفحة اللي بتدور عليها مش موجودة، لكن أكيد هتلاقي الخدمة اللي محتاجها في الصفحة الرئيسية.</p><Link className="button button-primary" href="/"><ArrowLeft size={18}/> ارجع للرئيسية</Link></main></div>;
}
