/** الصورة البديلة لمن لم يضف صورة شخصية بعد: شعار التطبيق داخل الدائرة. */
export const AVATAR_PLACEHOLDER_SRC = "/images/logo-avatar.webp";

export default function AvatarPlaceholder({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- صورة ثابتة صغيرة من public
  return <img src={AVATAR_PLACEHOLDER_SRC} alt="" className={`avatar-placeholder ${className}`} loading="lazy" decoding="async" draggable={false} aria-hidden="true" />;
}
