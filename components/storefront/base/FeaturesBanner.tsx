import { Truck, ShieldCheck, Clock, CreditCard } from "lucide-react";

export function FeaturesBanner() {
  const features = [
    {
      icon: <Truck className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Free Shipping",
      description: "On all orders over $100",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Secure Payment",
      description: "100% secure payment",
    },
    {
      icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "24/7 Support",
      description: "Dedicated support",
    },
    {
      icon: <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Money Back",
      description: "Return within 30 days",
    },
  ];

  return (
    <section className="w-full bg-white-chalk-100 border-y border-matt-black-500/50 py-8 md:py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center space-y-3 group"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-matt-black-500/20 text-matt-black-200 group-hover:bg-sunflower-100/20 group-hover:text-sunflower-100 transition-colors duration-300">
                {feature.icon}
              </div>
              <div>
                <h3
                  className="text-sm sm:text-base font-bold text-matt-black-100 mb-1"
                  style={{ fontFamily: "var(--font-sora), sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-matt-black-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
