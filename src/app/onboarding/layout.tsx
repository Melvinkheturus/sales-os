export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-[#0B0B0F] flex items-center justify-center p-4">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.025) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
