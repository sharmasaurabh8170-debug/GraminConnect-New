import { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Send,
  Sprout,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  MapPin,
  Package,
} from "lucide-react";

const farmerQuestions = [
  "How can I improve my crop listing?",
  "How should I store fresh vegetables?",
  "How do I write a product description?",
];

const customerQuestions = [
  "Suggest fresh vegetables for salad",
  "Show me available fruits",
  "Find affordable vegetables",
];

const API_URL = "http://localhost:5000";

function isProductQuery(message) {
  const keywords = [
    "suggest",
    "recommend",
    "show me",
    "find",
    "available",
    "buy",
    "purchase",
    "price",
    "vegetable",
    "vegetables",
    "fruit",
    "fruits",
    "crop",
    "crops",
    "salad",
    "tomato",
    "potato",
    "onion",
    "spinach",
    "apple",
    "banana",
    "mango",
  ];

  const text = message.toLowerCase();

  return keywords.some((keyword) => text.includes(keyword));
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("customer");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Namaste! 🌱 Welcome to GraminConnect. I'm your AI assistant. Ask me about farming or find fresh products from our farmers!",
      products: [],
    },
  ]);

  const suggestions =
    role === "farmer" ? farmerQuestions : customerQuestions;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const message = text.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      { sender: "user", text: message },
    ]);

    setInput("");
    setLoading(true);

    try {
      let endpoint = "/api/ai/chat";

      // Customer product-related questions use recommendations API.
      if (role === "customer" && isProductQuery(message)) {
        endpoint = "/api/recommendations";
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          endpoint === "/api/ai/chat"
            ? { message, role }
            : { message }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.reply || "AI request failed"
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          sender: "ai",
          text: data.reply || "Here is some information for you.",
          products: data.products || [],
        },
      ]);
    } catch (error) {
      console.error("GraminConnect AI Error:", error);

      setMessages((previous) => [
        ...previous,
        {
          sender: "ai",
          text: "Sorry! 🌱 AI is temporarily unavailable. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[120] flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-2xl transition hover:scale-110 hover:bg-green-700"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={29} />

          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-xs">
            AI
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-[120] flex h-[min(650px,85vh)] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between bg-green-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2">
                <Bot size={25} />
              </div>

              <div>
                <h3 className="font-bold">
                  GraminConnect AI
                </h3>

                <p className="text-xs text-green-100">
                  Your Smart Agriculture Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 hover:bg-white/20"
              aria-label="Close assistant"
            >
              <X size={22} />
            </button>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-2 border-b border-green-100 p-3">
            <button
              onClick={() => setRole("farmer")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                role === "farmer"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-800"
              }`}
            >
              <Sprout size={17} />
              Farmer
            </button>

            <button
              onClick={() => setRole("customer")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                role === "customer"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-800"
              }`}
            >
              <ShoppingBag size={17} />
              Customer
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#F4FAF1] p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="max-w-[90%]">
                  <div
                    className={`whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 ${
                      message.sender === "user"
                        ? "rounded-br-sm bg-green-600 text-white"
                        : "rounded-bl-sm border border-green-100 bg-white text-gray-700"
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* Recommended Products */}
                  {message.sender === "ai" &&
                    message.products?.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <p className="flex items-center gap-2 text-xs font-bold text-green-800">
                          <Sparkles size={14} />
                          Recommended Products
                        </p>

                        {message.products.map((product) => (
                          <div
                            key={product._id}
                            className="overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm"
                          >
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-32 w-full object-cover"
                              />
                            )}

                            <div className="space-y-2 p-3">
                              <h4 className="font-bold text-green-900">
                                {product.name}
                              </h4>

                              <p className="text-xs text-gray-500">
                                {product.category}
                              </p>

                              <p className="font-bold text-green-700">
                                ₹{product.price}
                              </p>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Package size={13} />
                                  {product.quantity} available
                                </span>

                                <span className="flex items-center gap-1">
                                  <MapPin size={13} />
                                  {product.location}
                                </span>
                              </div>

                              {product.description && (
                                <p className="text-xs leading-5 text-gray-600">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white p-3 text-sm text-green-700">
                  <span className="animate-pulse">
                    GraminConnect AI is thinking... 🌱
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Suggested Questions */}
            {!loading && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-green-800">
                  <Sparkles size={14} />
                  Suggested Questions
                </p>

                <div className="space-y-2">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="block w-full rounded-xl border border-green-200 bg-white p-2 text-left text-xs text-green-800 transition hover:bg-green-100"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-green-100 bg-white p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask or find fresh products..."
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl bg-green-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-300"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl bg-green-600 p-3 text-white hover:bg-green-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}