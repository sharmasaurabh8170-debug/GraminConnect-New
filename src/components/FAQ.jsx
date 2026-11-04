import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Customers",
    question: "How can I buy fresh products?",
    answer:
      "Browse available crops on the homepage, add your favourite products to the cart, and proceed to checkout.",
  },
  {
    category: "Customers",
    question: "Can I contact the farmer directly?",
    answer:
      "You can use the contact details provided with a listing, if available, to connect with the farmer.",
  },
  {
    category: "Customers",
    question: "How can I track my order?",
    answer:
      "Once the order system is connected, you will be able to view your order status in the Customer Dashboard.",
  },
  {
    category: "Farmers",
    question: "How can I sell my crops?",
    answer:
      "Register as a farmer, log in, open your Farmer Dashboard, and select Add Crop to publish a listing.",
  },
  {
    category: "Farmers",
    question: "Can I update my crop details?",
    answer:
      "You will be able to manage your crop listings from the Farmer Dashboard once editing features are enabled.",
  },
  {
    category: "Farmers",
    question: "How do I receive customer orders?",
    answer:
      "Customer orders will appear in the Farmer Dashboard after the order management system is connected.",
  },
  {
    category: "General",
    question: "Is registration free?",
    answer:
      "Yes, creating a GraminConnect account is free.",
  },
  {
    category: "General",
    question: "What is GraminConnect?",
    answer:
      "GraminConnect is a farmer-to-customer marketplace designed to help farmers showcase their crops and connect with customers.",
  },
];

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section id="faq" className="bg-[#F4FAF1] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-green-700 font-semibold mb-2">
            NEED HELP?
          </p>

          <h2 className="text-3xl md:text-4xl font-bold text-[#1B2E1B]">
            Frequently Asked Questions
          </h2>

          <p className="text-gray-600 mt-3">
            Find answers to common questions about GraminConnect.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-[#DCE8D7] rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() =>
                  setActiveIndex(activeIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <div>
                  <span className="text-xs font-semibold text-green-700">
                    {faq.category}
                  </span>

                  <h3 className="font-semibold text-[#1B2E1B] mt-1">
                    {faq.question}
                  </h3>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-green-700 shrink-0 transition-transform ${
                    activeIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeIndex === index && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-7">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;