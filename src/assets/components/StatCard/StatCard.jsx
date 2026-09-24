function StatCard({ title, value, subtitle }) {
  return (
    <div
      className="
        bg-white/90
        backdrop-blur-xl
        border border-white/40
        rounded-2xl
        shadow-xl
        p-6

        transition-all
        duration-300
        ease-out

        hover:-translate-y-2
        hover:shadow-2xl

        cursor-pointer

        animate-[fadeIn_0.6s_ease-out]
      "
    >
      <p className="text-gray-600 text-sm font-medium">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </h2>

      <p className="text-sm text-green-600 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

export default StatCard;